import { createReadStream } from 'fs'
import Papa from 'papaparse'

export async function previewTabular(
  path: string
): Promise<Record<string, Record<string, number>>> {
  return new Promise<Record<string, Record<string, number>>>((resolve, reject) => {
    const preview: Record<string, Record<string, number>> = {}
    Papa.parse<Record<string, string>>(createReadStream(path), {
      header: true,
      step(results) {
        if (results.errors.length) {
          reject(results.errors)
        }
        for (const key in results.data) {
          const value = results.data[key]
          if (!preview[key]) preview[key] = {}
          if (!preview[key][value]) preview[key][value] = 0
          preview[key][value] += 1
        }
      },
      complete(results) {
        if (results.errors.length) {
          reject(results.errors)
        }
        resolve(preview)
      },
      error(error) {
        reject(error)
      }
    })
  })
}
