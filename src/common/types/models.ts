export interface Repository {
  name: string
  local: string
}

export interface NotificationDescriptor {
  title: string
  date: Date
  status: 'Information' | 'Alert'
  message: string
}

export interface AppState {
  knownRepos: Repository[]
  openedRepoPath: string | null
  ongoingProcesses: Record<string, ProcessDescriptor>
}

export interface PromiseDescriptor {
  id: string
  title: string
  promise: Promise<any>
  status: string
  startTime: Date
  endTime: Date | null
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
