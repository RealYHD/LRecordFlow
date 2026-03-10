import csvParser from "csv-parser"
import { createReadStream } from "fs"

export async function getCSVDataSample(csvPath: string) {
    let sampleData: Record<string, string> = {}
    let readStream = createReadStream(csvPath)
    readStream.pipe(csvParser())
        .on('data', (data) => {
            Object.assign(sampleData, data)
            readStream.destroy()
        })
    return sampleData
}

export async function getUniqueValuesFromCSV(csvPath: string, column: string) {
    let uniqueValues = new Set()
    createReadStream(csvPath).pipe(csvParser()).on('data', (data) => {
        uniqueValues.add(data[column])
    })
    return Array.from(uniqueValues)
}