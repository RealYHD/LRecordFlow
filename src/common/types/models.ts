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

export interface AppConfiguration {
  knownRepos: Repository[]
  watchedProcesses: Record<string, ProcessDescriptor>
}

export interface PromiseDescriptorMessage {
  title: string
  description: string
}

export interface PromiseDescriptor {
  id: string
  promise: Promise<any>
  message: PromiseDescriptorMessage
  startTime: Date
  endTime: Date | undefined
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
