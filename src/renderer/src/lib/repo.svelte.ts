import { appStateStore } from "./state.svelte"

export const identifierKey = "Identifier"

export type RepositoryRecordData = Record<string, string>
export enum MetadataValueType {
    Options = "options", Date = "date", Number = "number", Text = "text"
}

export interface MetadataDescriptor {
    key: string
    value: {
        valueType: MetadataValueType
        options: string[]
    }
    required: boolean
}
export interface RepositoryConfiguration {
    defined: MetadataDescriptor[]
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
        recordMetadata[identifierKey] = recordName
        records.push(recordMetadata)
    }
    return records
}

export function aggregateMetadataDescriptors(records: RepositoryRecordData[], repoConfig: RepositoryConfiguration): MetadataDescriptor[] {
    let descriptors: MetadataDescriptor[] = $state([])
    let included: Set<string> = new Set()
    for (const definedDescriptor of repoConfig.defined) {
        if (definedDescriptor.key == identifierKey) continue
        included.add(definedDescriptor.key)
        descriptors.push(definedDescriptor)
    }
    for (const record of records) {
        for (const recordKey in record) {
            if (recordKey == identifierKey) continue
            if (included.has(recordKey)) continue
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

export function validateRecords(records: RepositoryRecordData[], metadataDescriptors: MetadataDescriptor[]) {
    let issues: Record<string, string[]>[] = $state([])
    for (const record of records) {
        issues.push({})
        let recordIssues = issues[issues.length - 1]
        for (const { key, value: valueDesc, required } of metadataDescriptors) {
            recordIssues[key] = []
            const metadataIssues = recordIssues[key]
            if (key.trim() == '') metadataIssues.push("Metadata key cannot be empty.")
            if (!record[key] && !required) continue
            let recordStringValue: string = (record[key] || '').toString()
            switch (valueDesc.valueType) {
                case MetadataValueType.Date:
                    if (!Date.parse(recordStringValue)) metadataIssues.push(`"${key}" must represent a date but could not be parsed as a date.`)
                    break;
                case MetadataValueType.Number:
                    if (!Number.parseFloat(recordStringValue)) metadataIssues.push(`"${key}" must be a number but could not be parsed as a number.`)
                    break;
                case MetadataValueType.Options:
                    if (!valueDesc.options.includes(recordStringValue)) metadataIssues.push(`"${key}" must be one of ${valueDesc.options.join(', ')}.`)
                    break;
                case MetadataValueType.Text:
                    if (!recordStringValue || recordStringValue.trim() == '') metadataIssues.push(`"${key}" is required to not be blank.`)
                    break;
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
    for (const { key } of repoConfig.defined) {
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
    if (repoConfig.defined.find((value) => value.key == key)) {
        issues.push(`"${key}" already exists.`)
    }
    return issues
}