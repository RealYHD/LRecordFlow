import { Repository, ScriptStatus, SshConnectionDetails } from '../../common/types/models'
import { readFile, writeFile, access } from 'fs/promises'
import { join } from 'path'
import * as repo from './repo'
import * as persistence from './persistence'
import * as script from './script'

/**
 * Interval in milliseconds between reconciliations of pending script jobs.
 */
const RECONCILIATION_INTERVAL_MS = 30_000 // 30 seconds

/**
 * Marks a script run in the record metadata, so state survives restarts.
 */
const scriptStateFilename = '.lrf.script-state.json'

interface ScriptRunState {
  script: string | null
  jobId: string | null
  status: ScriptStatus
  lastSubmitted: Date | null
  lastChecked: Date | null
  output: Record<string, string> | null
}

/**
 * Reconcile all in-flight script jobs across a repo's records.
 * Runs on startup and periodically to converge record state with reality.
 */
export async function reconcileJobs(repoPath: string): Promise<void> {
  const config = await repo.getRepoConfiguration(repoPath)
  const connection = config?.connection ?? ({} as SshConnectionDetails)

  const records = await repo.getAllRecordsForRepo(repoPath)
  for (const recordIdentifier of records) {
    const state = await getScriptRunState(repoPath, recordIdentifier)
    if (!state || !state.script) continue

    switch (state.status) {
      case 'pending':
        await reconcilePending(repoPath, recordIdentifier, state, connection)
        break
      case 'running':
        await reconcileRunning(repoPath, recordIdentifier, state, connection)
        break
    }
  }
}

/**
 * Check a pending script run: verify the process is still running on the remote machine
 * and fetch the output cache if it has finished.
 */
async function reconcilePending(
  repoPath: string,
  recordIdentifier: string,
  state: ScriptRunState,
  connection: SshConnectionDetails
): Promise<void> {
  // Verify the backgrounded process is still alive
  const running = await script.isProcessRunning(connection, state.jobId!)
  if (!running) {
    // Process is dead — fetch the output cache (or mark failed if missing)
    const output = await script.fetchScriptOutput(connection, recordIdentifier, state.script!)
    if (output) {
      await script.applyScriptOutput(repoPath, recordIdentifier, output, state.script!)
      return
    }

    // No output — the script failed without producing results
    const updated = { ...state, status: 'failed' as ScriptStatus, lastChecked: new Date(), output: null }
    await writeScriptRunState(repoPath, recordIdentifier, updated)
    return
  }

  // Still running — update lastChecked and keep polling
  const updated = { ...state, lastChecked: new Date() }
  await writeScriptRunState(repoPath, recordIdentifier, updated)
}

/**
 * Check a running script run: same as pending for now.
 */
async function reconcileRunning(
  repoPath: string,
  recordIdentifier: string,
  state: ScriptRunState,
  connection: SshConnectionDetails
): Promise<void> {
  await reconcilePending(repoPath, recordIdentifier, state, connection)
}

/**
 * Get the script run state for a record.
 */
export async function getScriptRunState(
  repoPath: string,
  recordIdentifier: string
): Promise<ScriptRunState | null> {
  const statePath = join(repoPath, recordIdentifier, scriptStateFilename)
  try {
    await access(statePath)
  } catch {
    return null
  }
  return JSON.parse(await readFile(statePath, 'utf-8')) as ScriptRunState
}

/**
 * Write the script run state for a record.
 */
export async function writeScriptRunState(
  repoPath: string,
  recordIdentifier: string,
  state: ScriptRunState
): Promise<void> {
  await writeFile(join(repoPath, recordIdentifier, scriptStateFilename), JSON.stringify(state))
}

/**
 * Mark a record's script run as failed.
 */
export async function markScriptFailed(repoPath: string, recordIdentifier: string): Promise<void> {
  const state = await getScriptRunState(repoPath, recordIdentifier)
  if (!state) return

  const updated = { ...state, status: 'failed' as ScriptStatus, lastChecked: new Date(), output: null }
  await writeScriptRunState(repoPath, recordIdentifier, updated)
}

/**
 * Start the reconciliation polling loop.
 */
export function startReconciliation(intervalMs: number = RECONCILIATION_INTERVAL_MS): void {
  setInterval(() => reconcileAll(), intervalMs)
}

/**
 * Reconcile all known repos.
 */
export async function reconcileAll(): Promise<void> {
  const config = await persistence.load('config', { knownRepos: [] })
  const knownRepos = (config as { knownRepos: Repository[] }).knownRepos ?? []
  for (const repo of knownRepos) {
    await reconcileJobs(repo.local)
  }
}
