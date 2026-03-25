import {
  MetadataValueType,
  type MetadataDescriptor,
  type PathStatus as PathStatus,
  type RecordMetadata,
  type RepositoryConfiguration,
  type RepositoryRecord,
  type RepositoryRecordFilter
} from '../../../common/types/models'

export async function repoExists(localRepoPath: string) {
  return await window['repo'].repoExists(localRepoPath)
}

export function recordDataIsEqual(record1: RecordMetadata, record2: RecordMetadata) {
  if (record1 == record2) return true
  if (!record1) return false
  if (!record2) return false
  return (
    JSON.stringify(Object.entries(record1).sort()) == JSON.stringify(Object.entries(record2).sort())
  )
}

export async function getAllRecordsForRepo(localRepoPath: string): Promise<string[]> {
  return await window['repo'].getAllRepoRecords(localRepoPath)
}

export async function loadRecordFromRepo(
  localRepoPath: string,
  identifier: string
): Promise<RepositoryRecord> {
  return {
    identifier: identifier,
    metadata: await window['repo'].getRecordMetadata(localRepoPath, identifier),
    files: await window['repo'].getFilesAssociatedWithRecord(localRepoPath, identifier)
  }
}

export function aggregateMetadataDescriptors(
  records: RepositoryRecord[],
  repoConfig: RepositoryConfiguration
): MetadataDescriptor[] {
  let descriptors: MetadataDescriptor[] = $state([])
  let included: Set<string> = new Set()
  for (const definedDescriptor of repoConfig.defined) {
    if (definedDescriptor.key == 'Identifier') continue
    included.add(definedDescriptor.key)
    descriptors.push(definedDescriptor)
  }
  for (const record of records) {
    for (const recordKey in record.metadata) {
      if (recordKey == 'Identifier') continue // TODO we should remove this in the future
      if (included.has(recordKey)) continue
      included.add(recordKey)
      descriptors.push({
        key: recordKey,
        required: false,
        value: {
          options: [],
          valueType: MetadataValueType.Text
        }
      })
    }
  }
  return descriptors
}

export async function deleteRecord(localRepoPath: string, recordIdentifier: string) {
  return await window['repo'].deleteRecord(localRepoPath, recordIdentifier)
}

export async function saveRecord(
  localRepoPath: string,
  recordIdentifier: string,
  recordData: RecordMetadata
) {
  window['repo'].setRecord(localRepoPath, recordIdentifier, recordData)
}

export async function getRepoConfig(localRepoPath: string) {
  return window['repo'].getRepoConfiguration(localRepoPath)
}

export async function setRepoConfig(
  localRepoPath: string,
  repoConfiguration: RepositoryConfiguration
) {
  return window['repo'].setRepoConfiguration(localRepoPath, repoConfiguration)
}

export function validateRecords(
  records: RepositoryRecord[],
  metadataDescriptors: MetadataDescriptor[]
): Record<string, Record<string, string[]>> {
  let issues: Record<string, Record<string, string[]>> = $state({})
  for (const record of records) {
    issues[record.identifier] = {}
    let recordIssues = issues[record.identifier]
    for (const { key, value: valueDesc, required } of metadataDescriptors) {
      recordIssues[key] = []
      const metadataIssues = recordIssues[key]
      if (key.trim() == '') metadataIssues.push('Metadata key cannot be empty.')
      if (record.metadata[key] == undefined && !required) continue
      let recordStringValue: string = (record.metadata[key] || '').toString()
      switch (valueDesc.valueType) {
        case MetadataValueType.Date:
          if (!Date.parse(recordStringValue))
            metadataIssues.push(`"${key}" must represent a date but could not be parsed as a date.`)
          break
        case MetadataValueType.Number:
          if (!Number.parseFloat(recordStringValue))
            metadataIssues.push(`"${key}" must be a number but could not be parsed as a number.`)
          break
        case MetadataValueType.Options:
          if (!valueDesc.options.includes(recordStringValue))
            metadataIssues.push(`"${key}" must be one of ${valueDesc.options.join(', ')}.`)
          break
        case MetadataValueType.Text:
          if (!recordStringValue || recordStringValue.trim() == '')
            metadataIssues.push(`"${key}" is required to not be blank.`)
          break
        case MetadataValueType.File:
          if (record.files.length && !record.files.includes(recordStringValue))
            metadataIssues.push(`"${key}" is not a known file name associated with record.`)
          if (!record.files.length)
            metadataIssues.push(`Record has no files associated with the record to select.`)
      }
    }
  }
  return issues
}

export function countIssues(recordIssues: Record<string, Record<string, string[]>>) {
  const issueCount: Record<string, number> = $state({})
  for (const recordIdentifier in recordIssues) {
    let total = 0
    for (const key in recordIssues[recordIdentifier]) {
      const issues = recordIssues[recordIdentifier][key]
      total += issues.length
    }
    issueCount[recordIdentifier] = total
  }
  return issueCount
}

export async function attemptLockRecord(
  localRepoPath: string,
  recordIdentifier: string
): Promise<boolean> {
  return await window['repo'].attemptLockRecord(localRepoPath, recordIdentifier)
}

export async function attemptUnlockRecord(
  localRepoPath: string,
  recordIdentifier: string
): Promise<boolean> {
  return await window['repo'].attemptUnlockRecord(localRepoPath, recordIdentifier)
}

export async function statRecord(
  localRepoPath: string,
  recordIdentifier: string
): Promise<PathStatus> {
  return await window['repo'].statRecord(localRepoPath, recordIdentifier)
}

export async function attemptLockRepoConfig(localRepoPath: string): Promise<boolean> {
  return await window['repo'].attemptLockRepoConfig(localRepoPath)
}

export async function attemptUnlockRepoConfig(localRepoPath: string): Promise<boolean> {
  return await window['repo'].attemptUnlockRepoConfig(localRepoPath)
}

export async function statRepoConfig(localRepoPath: string): Promise<PathStatus> {
  return await window['repo'].statRepoConfig(localRepoPath)
}

export function validateRecordIdentifier(identifier: string, allIdentifiers: string[]) {
  // TODO validate that it is a valid path
  if (identifier.trim().length <= 0) {
    return 'Identifier cannot be blank'
  }
  if (identifier.trim().length != identifier.length)
    return 'Identifier must not have leading or lagging spaces'
  if (allIdentifiers.includes(identifier)) {
    return 'Identifier is already in use'
  }
  return ''
}

export function validateRepoConfig(repoConfig: RepositoryConfiguration): Record<string, string[]> {
  let issues: Record<string, string[]> = $state({})
  for (const { key } of repoConfig.defined) {
    issues[key] = []
    const metadataIssues = issues[key]
    if (key.trim().length == 0) {
      metadataIssues.push('Metadata key cannot be empty.')
    }
  }
  return issues
}

export function validateMetadataKey(key: string, repoConfig: RepositoryConfiguration): string[] {
  const issues: string[] = $state([])
  if (key.trim().length == 0) {
    issues.push('Key cannot be empty.')
  }
  if (repoConfig.defined.find((value) => value.key == key)) {
    issues.push(`"${key}" already exists.`)
  }
  return issues
}

export async function recordExists(
  localRepoPath: string,
  recordIdentifier: string
): Promise<boolean> {
  return await window['repo'].recordExists(localRepoPath, recordIdentifier)
}

export async function openRepoRecordDirectory(localRepoPath: string, recordIdentifier: string) {
  return await window['repo'].openRepoRecordDirectory(localRepoPath, recordIdentifier)
}

export async function openRepoDirectory(localRepoPath: string) {
  return await window['repo'].openRepoDirectory(localRepoPath)
}

export async function importRepoRecordsFromTabular(
  localRepoPath: string,
  tabularPath: string,
  identifierCol: string,
  pathColumns: string[]
): Promise<string[]> {
  return await window['repo'].importRepoRecordsFromTabular(
    localRepoPath,
    tabularPath,
    identifierCol,
    pathColumns
  )
}

export function recordFiltersEqual(
  filter1: RepositoryRecordFilter,
  filter2: RepositoryRecordFilter
) {
  if (!filter1 && filter2) return false
  if (!filter2 && filter1) return false
  if (!filter2 && !filter1) return true
  return filter1.identifier == filter2.identifier
}

export async function getRepoLastModified(localRepoPath: string): Promise<Date | null> {
  return await window['repo'].getRepoLastModified(localRepoPath)
}

export async function createRepositoryDirectory(repoPath: string): Promise<string> {
  return await window['repo'].createRepositoryDirectory(repoPath)
}
