import { createReadStream } from 'fs';
import Papa from 'papaparse';

export async function previewTabular(path: string): Promise<Record<string, string[]>> {
    return new Promise<Record<string, string[]>>((resolve, reject) => {
        let preview: Record<string, string[]> = {}
        Papa.parse<Record<string,string>>(createReadStream(path), {
            header: true,
            step(results) {
                if (results.errors.length) {
                    reject(results.errors)
                }
                for (const key in results.data) {
                    const value = results.data[key];
                    if (!preview[key]) preview[key] = []
                    if (!preview[key].includes(value)) preview[key].push(value)
                }
            },
            complete(results)  {
                if (results.errors.length) {
                    reject(results.errors)
                }
                resolve(preview)

            },
            error(error) {
                reject(error)
            },
        })
    })
}