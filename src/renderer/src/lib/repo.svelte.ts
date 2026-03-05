import { appStateStore } from "./state.svelte"

export async function loadRecords(localRepoPath: string): Promise<Record<string, string>[]> {
    let records: Record<string, string>[] = []
    let recordNames: string[] = await window['repo'].getAllRepoRecords(localRepoPath)
    for (const recordName of recordNames) {
        let recordMetadata: Record<string, string> = await window['repo'].getRecordMetadata(
            localRepoPath,
            recordName
        )
        recordMetadata['Identifier'] = recordName
        records.push(recordMetadata)
    }
    return records
}

export function findColumns(records: Record<string, string>[]): [string, string[]][] {
    let columns: Record<string, string[]> = {}
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
    return Object.entries(columns).map(([colName, colValues]) => [colName, colValues])
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

export async function setRecord(localRepoPath: string, recordIdentifier: string, recordData: Record<string, string>) {
    window['repo'].setRecord(localRepoPath, recordIdentifier, recordData)
}

export function validateRecords(records: Record<string, string>[], columnTypes: Record<string, string[]> = null) {
    let issues: Record<string, string[]>[] = $state([])
    for (const record of records) {
        issues.push({})
        let recordIssues = issues[issues.length - 1]
        for (const metadataKey in record) {
            recordIssues[metadataKey] = []
            const metadataKeyIssues = recordIssues[metadataKey]
            if (metadataKey.trim() == '') metadataKeyIssues.push("Metadata key cannot be empty.")
        }
        if (columnTypes != null) {
            for (const metadataKey in columnTypes) {
                const acceptableValues = columnTypes[metadataKey];
                if (!recordIssues[metadataKey]) recordIssues[metadataKey] = []
                const columnIssues = recordIssues[metadataKey]
                if (record[metadataKey]) {
                    if (!acceptableValues.includes(record[metadataKey])) {
                        columnIssues.push(`"${record[metadataKey]}" is not an acceptable value for column "${metadataKey}".`)
                    }
                } else {
                    columnIssues.push(`Missing value for column "${metadataKey}".`)
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
    if (!identifier) {
        return "Identifier cannot be blank"
    }
    if (allIdentifiers.includes(identifier)) {
        return "Identifier is already in use"
    }
    return ''
}

// TODO manually IPC necessary functions and add a "receiver" on this end instead of using the IPC indexer.