export interface Repository {
  name: string
  local: string
}

export interface SlurmJobMetrics {
  JobID: string
  JobName: string
  Partition: string
  Account: string
  AllocCPUS: number
  State: string
  ExitCode: number
}

export interface SshConnectionDetails {
  host: string
  port: number
  username: string
  privateKeyPath: string | undefined
  password: string | undefined
}

export interface NotificationDescriptor {
  title: string
  date: Date
  status: 'Information' | 'Alert'
  message: string
}

export interface AppConfiguration {
  knownRepos: Repository[]
  connections: SshConnectionDetails[]
  watchedProcesses: Record<string, ProcessDescriptor>
}

export interface PromiseDescriptorStatus {
  title: string
  description: string
  progress: number
}

export interface PromiseDescriptor {
  id: string
  promise: Promise<unknown>
  status: PromiseDescriptorStatus
  startTime: number
  endTime: number | undefined
}

export interface ProcessDescriptor {
  title: string
  pid: number
  status: string
  startTime: Date
  endTime: Date | null
}

export interface PathStatus {
  lastModified: Date | null
  lockStatus: lockStatus | null
}

export interface lockStatus {
  currentUser: string | null
  lockDate: Date | null
}

export enum MetadataValueType {
  Options = 'options',
  Date = 'date',
  Number = 'number',
  Text = 'text',
  File = 'file'
}

export type RepositoryRecord = {
  identifier: string
  metadata: RecordMetadata
  files: string[]
}

export type RecordMetadata = Record<string, string>

export interface MetadataDescriptor {
  key: string
  value: {
    valueType: MetadataValueType
    options: string[]
  }
  required: boolean
}

export type RepRecordFilterPredicate = (value: string) => boolean

export interface RepositoryRecordFilter {
  key: string
  displayName: string
  predicate: RepRecordFilterPredicate
  must: boolean
  identifier: string
}

export interface ScriptParameter {
  key: string // sbatch flag, e.g. "--sample"
  value: string // template, e.g. "{sample_id}" or a literal
}

export interface ScriptDefinition {
  name: string // human-readable script name
  path: string // relative to repo .lrf/scripts/, e.g. "my_pipeline.py"
  parameters: ScriptParameter[] // input/param mapping
  outputColumns: string[] // the columns this script claims it will fill (e.g. ["coverage", "n_contigs"])
}

export type ScriptStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed'

export interface RecordScriptState {
  script: string | null // which script this record is running
  jobId: string | null // remote process PID (or sbatch JobID for sbatch-based scripts)
  status: ScriptStatus
  lastSubmitted: Date | null
  lastChecked: Date | null
  output: Record<string, string> | null // parsed return values (key = column)
}

export interface RepositoryConfiguration {
  defined: MetadataDescriptor[]
  exactKeys: boolean
  scripts: ScriptDefinition[] // repo-level script registry
  connection: SshConnectionDetails // default SSH connection for script execution
}
