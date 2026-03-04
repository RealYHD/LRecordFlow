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

export async function findColumns(records: Record<string, string>[]): Promise<Record<string, string[]>> {
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
    return columns
}

// TODO manually IPC necessary functions and add a "receiver" on this end instead of using the IPC indexer.