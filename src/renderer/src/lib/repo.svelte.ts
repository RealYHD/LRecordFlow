import { appStateStore } from "./state.svelte"

export type RepositoryRecordData = Record<string, string>
export enum MetadataValueType {
    Options = "options", Date = "date", Number = "number", Text = "text"
}

export interface MetadataValueDescriptor {
    valueType: MetadataValueType
    options: string[]
}
export interface MetadataKeyValuePairDescriptor {
    key: string,
    value: MetadataValueDescriptor
}
export interface RepositoryConfiguration {
    requiredMetadata: MetadataKeyValuePairDescriptor[]
    exactKeys: boolean
}

export async function loadRecords(localRepoPath: string): Promise<RepositoryRecordData[]> {
    let records: RepositoryRecordData[] = []
    let recordNames: string[] = await window['repo'].getAllRepoRecords(localRepoPath)
    for (const recordName of recordNames) {
        let recordMetadata: RepositoryRecordData = await window['repo'].getRecordMetadata(
            localRepoPath,
            recordName
        )
        recordMetadata['Identifier'] = recordName
        records.push(recordMetadata)
    }
    return records
}

export function getColumnsFromRecords(records: RepositoryRecordData[]): MetadataKeyValuePairDescriptor[] {
    let columns: Record<string, string[]> = $state({})
    columns['Identifier'] = []
    for (const record of records) {
        for (const key in record) {
            if (!Object.hasOwn(record, key)) continue

            const element = record[key]

            if (!Object.hasOwn(columns, key)) columns[key] = ['N/A']
            if (columns[key].includes(element)) continue
            columns[key].push(element)
        }
    }
    return Object.entries(columns).map(([colName, colValues]) => ({ key: colName, value: { valueType: MetadataValueType.Text, options: colValues } }))
}
// TODO unify naming scheme for columns and metadata (will switch to referring to columns solely as metadata)
export function updateColumnsByRepoConfig(repoConfig: RepositoryConfiguration, columns: MetadataKeyValuePairDescriptor[]): void {
    let repoConfigSnapshot = $state.snapshot(repoConfig)
    for (let index = 0; index < repoConfigSnapshot.requiredMetadata.length; index++) {
        const configKeyValueDesc = repoConfigSnapshot.requiredMetadata[index];
        let { key: requiredKey, value: requiredValue } = configKeyValueDesc
        let currentKeyValDesc = columns.find((keyValuePairDesc) => keyValuePairDesc.key == requiredKey)
        if (currentKeyValDesc) {
            if (requiredValue.valueType == MetadataValueType.Options) {
                currentKeyValDesc.value.options.length = 0
            }
            currentKeyValDesc.value.valueType = requiredValue.valueType
            currentKeyValDesc.value.options.push(...requiredValue.options)
        } else {
            columns.push(configKeyValueDesc)
        }
    }
}

export function aggregateRepositoryMetadata(records: RepositoryRecordData[], repoConfig: RepositoryConfiguration) {
    let recordColumns = getColumnsFromRecords(records)
    updateColumnsByRepoConfig(repoConfig, recordColumns)
    return recordColumns
}


export function cloneGitRepository(name: string, remote: string, local: string): void {
    appStateStore.state.notifications.push({
        date: new Date(),
        message: `Began cloning repository ("${name}") from "${remote}" to "${local}"`,
        status: 'Information',
        title: `Cloning "${name}"`
    })
    appStateStore.state.knownRepos.push({
        name: name,
        remote: remote,
        local: local,
        lastAccessed: new Date(),
        status: 'Not Ready'
    })
    window['repo']
        .cloneGitRepository(remote, local, name)
        .then((clonePath: string) => {
            appStateStore.state.notifications.push({
                date: new Date(),
                message: `Completed cloning repository ("${name}") from "${remote}" to "${local}"`,
                status: 'Information',
                title: `Completed cloning "${name}"`
            })
            let repo = appStateStore.state.knownRepos.find((repo) => repo.local == local)
            repo.status = 'Ready'
            repo.local = clonePath
        })
        .catch((err) => {
            appStateStore.state.notifications.push({
                date: new Date(),
                message:
                    `Failed to clone repository "${name}" from "${remote}" to "${local}" due to following error\n` +
                    err.message,
                status: 'Alert',
                title: `Failed to clone repository "${name}"`
            })
            appStateStore.state.knownRepos.find((repo) => repo.local == local).status = 'Not Ready'
        })
}

export async function deleteRecord(localRepoPath: string, recordIdentifier: string) {
    return await window['repo'].deleteRecord(localRepoPath, recordIdentifier)
}

export async function saveRecord(localRepoPath: string, recordIdentifier: string, recordData: RepositoryRecordData) {
    window['repo'].setRecord(localRepoPath, recordIdentifier, recordData)
}

export async function getRepoConfig(localRepoPath: string) {
    return window['repo'].getRepoConfiguration(localRepoPath)
}

export async function setRepoConfig(localRepoPath: string, repoConfiguration: RepositoryConfiguration) {
    return window['repo'].setRepoConfiguration(localRepoPath, repoConfiguration)
}

export function validateRecords(records: RepositoryRecordData[], repoConfig: RepositoryConfiguration = null) {
    let issues: Record<string, string[]>[] = $state([])
    for (const record of records) {
        issues.push({})
        let recordIssues = issues[issues.length - 1]
        for (const metadataKey in record) {
            recordIssues[metadataKey] = []
            const metadataKeyIssues = recordIssues[metadataKey]
            if (metadataKey.trim() == '') metadataKeyIssues.push("Metadata key cannot be empty.")
        }
        if (repoConfig != null) {
            for (const { key, value: valueDesc } of repoConfig.requiredMetadata) {
                if (!recordIssues[key]) recordIssues[key] = []
                const requiredKeyIssues = recordIssues[key]
                let recordStringValue: string = (record[key] || '').toString()
                switch (valueDesc.valueType) {
                    case MetadataValueType.Date:
                        if (!Date.parse(recordStringValue)) requiredKeyIssues.push(`"${key}" must represent a date but could not be parsed as a date.`)
                        break;
                    case MetadataValueType.Number:
                        if (!Number.parseFloat(recordStringValue)) requiredKeyIssues.push(`"${key}" must be a number but could not be parsed as a number.`)
                        break;
                    case MetadataValueType.Options:
                        if (!valueDesc.options.includes(recordStringValue)) requiredKeyIssues.push(`"${key}" must be one of ${valueDesc.options.join(', ')}.`)
                        break;
                    case MetadataValueType.Text:
                        if (!recordStringValue || recordStringValue.trim() == '') requiredKeyIssues.push(`"${key}" is required to not be blank.`)
                        break;
                }
            }
        }
    }
    return issues
}

export function countIssues(recordIssues: Record<string, string[]>[]) {
    const issueCount: number[] = $state([])
    for (const issueRecord of recordIssues) {
        let total = 0
        for (const key in issueRecord) {
            const issues = issueRecord[key];
            total += issues.length
        }
        issueCount.push(total)
    }
    return issueCount
}

export function validateRecordIdentifier(identifier: string, allIdentifiers: string[]) {
    // TODO validate that it is a valid path
    if (identifier.trim().length <= 0) {
        return "Identifier cannot be blank"
    }
    if (identifier.trim().length != identifier.length) return "Identifier must not have leading or lagging spaces"
    if (allIdentifiers.includes(identifier)) {
        return "Identifier is already in use"
    }
    return ''
}



export function validateRepoConfig(repoConfig: RepositoryConfiguration): Record<string, string[]> {
    let issues: Record<string, string[]> = $state({})
    for (const { key, value } of repoConfig.requiredMetadata) {
        issues[key] = []
        const metadataIssues = issues[key];
        if (key.trim().length == 0) {
            metadataIssues.push("Metadata key cannot be empty.")
        }
    }
    return issues
}

export function validateMetadataKey(key: string, repoConfig: RepositoryConfiguration): string[] {
    const issues: string[] = $state([])
    if (key.trim().length == 0) {
        issues.push("Key cannot be empty.")
    }
    if (repoConfig.requiredMetadata.find((value) => value.key == key)) {
        issues.push(`"${key}" already exists.`)
    }
    return issues
}