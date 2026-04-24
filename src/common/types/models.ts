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

export interface RepositoryConfiguration {
  defined: MetadataDescriptor[]
  exactKeys: boolean
}
