import {
  SlurmJobMetrics as SlurmJobDescriptor,
  SshConnectionDetails
} from '../../common/types/models'
import { ShellExecutor, SshShellExecutor } from './shell'
import Papa from 'papaparse'

function useSshShellExecutor(connection: SshConnectionDetails): ShellExecutor {
  return new SshShellExecutor(connection)
}

export async function getSlurmVersion(connection: SshConnectionDetails): Promise<string> {
  return (await useSshShellExecutor(connection).execute('sinfo --version')).stdout[0]
}

// TODO add a slurm version check to ensure compatibility

export async function getSlurmJobs(
  connection: SshConnectionDetails
): Promise<SlurmJobDescriptor[]> {
  return Papa.parse<SlurmJobDescriptor>(
    (
      await useSshShellExecutor(connection).execute(
        'sacct --format=jobid,jobname,partition,account,alloccpus,state,exitcode --parsable2 --delimiter=","'
      )
    ).stdout.join('\n'),
    {
      header: true,
      delimiter: ','
    }
  ).data
}

/**
 * Runs a sbatch command on the SLURM cluster available
 * on the SSH connection.
 *
 * @param connection SSH connection details
 * @param slurmArgs arguments for sbatch
 * @returns Job ID for the slurm cluster
 */
export async function execSlurm(
  connection: SshConnectionDetails,
  slurmArgs: string[]
): Promise<number> {
  const command: string[] = ['sbatch', ...slurmArgs]
  const sshExec = await useSshShellExecutor(connection)
  const results = await sshExec.execute(command.join(' '))
  if (results.code != 0) {
    throw new Error(
      `Returned non-zero (${results.code}) exit status:\n${results.stderr.join('\n')}`
    )
  }
  return Number.parseInt(results.stdout[0])
}

export async function slurmJobStatus(
  connection: SshConnectionDetails,
  jobId: string
): Promise<SlurmJobDescriptor | undefined> {
  return (await getSlurmJobs(connection)).find((value) => value.JobID == jobId)
}

export async function cancelSlurmJob(
  connection: SshConnectionDetails,
  jobId: string
): Promise<void> {
  const sshExec = await useSshShellExecutor(connection)
  const results = await sshExec.execute(`scancel ${jobId}`)
  if (results.code != 0) {
    throw new Error(
      `Returned non-zero (${results.code}) exit status:\n${results.stderr.join('\n')}`
    )
  }
  return
}

// TODO Implement function to extract results

export async function getSlurmJobLogs(
  connection: SshConnectionDetails,
  jobId: string
): Promise<string[]> {
  const sshExec = await useSshShellExecutor(connection)
  const results = await sshExec.execute(`cat slurm-${jobId}.out`)
  if (results.code != 0) {
    throw new Error(
      `Returned non-zero (${results.code}) exit status:\n${results.stderr.join('\n')}`
    )
  }
  return results.stdout
}

// TODO add specific implementation for nextflow??
