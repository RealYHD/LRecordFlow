import { createReadStream } from 'fs';
import Papa from 'papaparse';

export async function previewTabular(path: string, preview_count: number = 1) {
    let tabularStream = createReadStream(path)
    return new Promise<Record<string, string>[]>((resolve, reject) => {
        let previews: Record<string, string>[] = []
        let previewed = 0
        Papa.parse<Record<string,string>>(tabularStream, {
            header: true,
            preview: preview_count,
            step(results) {
                if (results.errors.length) {
                    reject(results.errors)
                }
                previews.push(results.data)
                previewed += 1
                if (previewed >= preview_count) {
                    resolve(previews)
                }
            },
            complete(results)  {
                if (results.errors.length) {
                    reject(results.errors)
                }
                resolve(previews)

            },
            error(error) {
                reject(error)
            },
        })
    })
}

export async function getUniqueValuesFromTabular(path: string, column: string) {
    return new Promise<string[]>((resolve, reject) => {
        let unique: Set<string> = new Set()
        Papa.parse<Record<string,string>>(createReadStream(path), {
            header:true,
            step: (results) => {
                if (results.errors.length) {
                    reject(results.errors)
                }
                unique.add(results.data[column])
            },
            complete: () => {
                resolve(Array.from(unique))
            },
            error: (error) => {
                reject(error)
            }
        })
    })
}