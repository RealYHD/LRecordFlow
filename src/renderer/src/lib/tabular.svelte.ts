export async function getCSVDataSample(path: string): Promise<Record<string,string>> {
    return await window['tabular'].getCSVDataSample(path)
}

export async function getUniqueValuesFromCSV(path:string, column: string) {
    return await window['tabular'].getUniqueValuesFromCSV(path, column)
}