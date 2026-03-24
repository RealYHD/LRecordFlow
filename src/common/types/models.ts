export interface RecordDirStatus {
  lastModified: Date
  lockStatus: RecordLockStatus | null
}

export interface RecordLockStatus {
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
