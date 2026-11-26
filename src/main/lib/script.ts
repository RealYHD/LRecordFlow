import { SshConnectionDetails } from '../../common/types/models'
import { ShellExecutor, SshShellExecutor } from './shell'
import { writeFile, mkdir, rm, readdir } from 'fs/promises'
import { join } from 'path'
import * as repo from './repo'
import type { RecordScriptState } from '../../common/types/models'

/**
 * Directory on the remote machine where script outputs are cached.
 */
const scriptOutputDir = '.lrf/scripts/cache'

/**
 * Marks a script run in the record metadata, so state survives restarts.
 */
const scriptStateFilename = '.lrf.script-state.json'

interface ScriptCommandResult {
  stdout: string[]
  stderr: string[]
  code: number
  signal: number
}

/**
 * Fetch a file from the remote machine via SSH.
 */
export async function fetchRemoteFile(
  connection: SshConnectionDetails,
  remotePath: string
): Promise<string | null> {
  const sshExec: ShellExecutor = new SshShellExecutor(connection)
  try {
    const result = await sshExec.execute(`cat "${remotePath}"`)
    if (result.code !== 0 || result.stdout.length === 0) return null
    return result.stdout.join('\n')
  } catch {
    return null
  }
}

/**
 * Write a file to the remote machine via SSH.
 */
export async function writeRemoteFile(
  connection: SshConnectionDetails,
  remotePath: string,
  content: string
): Promise<void> {
  const sshExec: ShellExecutor = new SshShellExecutor(connection)
  const result = await sshExec.execute(`cat > "${remotePath}" <<'EOF'\n${content}\nEOF`)
  if (result.code !== 0) {
    throw new Error(`Failed to write ${remotePath}: ${result.stderr.join('\n')}`)
  }
}

/**
 * Build the remote command for a script run on a record.
 * Substitutes `{column}` placeholders with the record's column values.
 * Runs the script in the background so the SSH connection is free, and
 * echoes the PID so it can be tracked.
 */
export function buildScriptCommand(
  scriptPath: string,
  parameters: { key: string; value: string }[],
  outputCachePath: string,
  recordMetadata: Record<string, string>
): string {
  const substitutions = parameters
    .map(({ key, value }) => `${key}=${resolveTemplate(value, recordMetadata)}`)
    .join(' ')

  return (
    `cd ${scriptPath.split('/').slice(0, -1).join('/')}; ` +
    `nohup python3 "${scriptPath}" ${substitutions} ` +
    `> "${outputCachePath}" 2> "${outputCachePath}.stderr" & echo $!`
  )
}

/**
 * Resolve a template like "{column}" against record metadata.
 */
function resolveTemplate(template: string, recordMetadata: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = recordMetadata[key]
    if (value === undefined) {
      throw new Error(`Missing column value for placeholder {${key}}`)
    }
    return value
  })
}

/**
 * Runs a script on a record via SSH.
 *
 * The script runs in the background; its PID is echoed by the command and
 * captured so it can be tracked. The JSON output is written to the cached path.
 */
export async function runScriptOnRecord(
  localRepoPath: string,
  recordIdentifier: string,
  connection: SshConnectionDetails,
  scriptPath: string,
  parameters: { key: string; value: string }[],
  outputCachePath: string
): Promise<void> {
  const recordMetadata = await repo.getRecordMetadata(localRepoPath, recordIdentifier)
  const command = buildScriptCommand(scriptPath, parameters, outputCachePath, recordMetadata)

  const sshExec: ShellExecutor = new SshShellExecutor(connection)
  const result: ScriptCommandResult = await sshExec.execute(command)

  // The last stdout line is the PID of the backgrounded script
  const pid = result.stdout[result.stdout.length - 1]?.trim()
  const stderr = result.stderr.join('\n')

  if (result.code !== 0 || !pid) {
    // Script failed to start — persist failure state
    const state: RecordScriptState = {
      script: scriptPath,
      jobId: null,
      status: 'failed',
      lastSubmitted: new Date(),
      lastChecked: new Date(),
      output: null
    }
    await mkdir(join(localRepoPath, recordIdentifier), { recursive: true })
    await writeFile(
      join(localRepoPath, recordIdentifier, scriptStateFilename),
      JSON.stringify(state)
    )
    throw new Error(`Script failed to start: ${stderr || 'unknown error'}`)
  }

  // Script is running — persist state for tracking
  const state: RecordScriptState = {
    script: scriptPath,
    jobId: pid,
    status: 'pending',
    lastSubmitted: new Date(),
    lastChecked: new Date(),
    output: null
  }
  await mkdir(join(localRepoPath, recordIdentifier), { recursive: true })
  await writeFile(
    join(localRepoPath, recordIdentifier, scriptStateFilename),
    JSON.stringify(state)
  )
}

/**
 * Parse a dictionary-like JSON output into Record<string,string>.
 */
export function parseScriptOutput(output: string): Record<string, string> {
  try {
    const json = JSON.parse(output)
    return Object.fromEntries(
      Object.entries(json).map(([key, value]) => [key, String(value)])
    )
  } catch {
    // Fall back to key=value parsing for non-JSON output
    return Object.fromEntries(
      output
        .split('\n')
        .filter((line) => line.includes('='))
        .map((line) => {
          const [key, ...rest] = line.split('=')
          return [key, rest.join('=')]
        })
    )
  }
}

/**
 * Write the parsed script output back into the record's metadata columns.
 * Column names are namespaced as `<script_filename>:<value>`.
 */
export async function applyScriptOutput(
  localRepoPath: string,
  recordIdentifier: string,
  output: Record<string, string>,
  scriptFilename: string
): Promise<void> {
  const namespaced = Object.fromEntries(
    Object.entries(output).map(([key, value]) => [`${scriptFilename}:${key}`, value])
  )

  const state: RecordScriptState = {
    script: scriptFilename,
    jobId: null,
    status: 'completed',
    lastSubmitted: new Date(),
    lastChecked: new Date(),
    output: namespaced
  }
  await mkdir(join(localRepoPath, recordIdentifier), { recursive: true })
  await writeFile(
    join(localRepoPath, recordIdentifier, scriptStateFilename),
    JSON.stringify(state)
  )
}

/**
 * Check whether a backgrounded script process is still running on the remote machine.
 */
export async function isProcessRunning(connection: SshConnectionDetails, pid: string): Promise<boolean> {
  const sshExec: ShellExecutor = new SshShellExecutor(connection)
  try {
    const result = await sshExec.execute(`ps -p ${pid} -o pid= > /dev/null 2>&1`)
    return result.code === 0
  } catch {
    return false
  }
}

/**
 * Fetch the cached JSON output for a script run on a record.
 */
export async function fetchScriptOutput(
  connection: SshConnectionDetails,
  recordIdentifier: string,
  scriptFilename: string
): Promise<Record<string, string> | null> {
  const outputCachePath = join(scriptOutputDir, `${recordIdentifier}_${scriptFilename}.json`)
  const content = await fetchRemoteFile(connection, outputCachePath)
  if (!content) return null
  return parseScriptOutput(content)
}

/**
 * Clean up stale script cache files for a record.
 */
export async function cleanupScriptCache(recordIdentifier: string): Promise<void> {
  const cacheDir = join(scriptOutputDir)
  try {
    const entries = await readdir(cacheDir)
    for (const entry of entries) {
      if (entry.startsWith(recordIdentifier)) {
        await rm(join(cacheDir, entry))
      }
    }
  } catch {
    // Cache dir may not exist; ignore
  }
}
