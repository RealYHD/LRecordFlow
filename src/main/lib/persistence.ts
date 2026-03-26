import { app } from 'electron'
import { existsSync } from 'fs'
import { readFile, stat, writeFile } from 'fs/promises'
import path from 'path'

export async function flush(name: string, value: object): Promise<void> {
  const storePath = path.join(app.getPath('userData'), name + '.json')
  if (!value) return
  return await writeFile(storePath, JSON.stringify(value), { encoding: 'utf-8' })
}

export async function load(name: string, defaultValue: object): Promise<object> {
  const storePath = path.join(app.getPath('userData'), name + '.json')
  if (!(existsSync(storePath) && (await stat(storePath)).isFile())) return defaultValue
  const result = await readFile(storePath, { encoding: 'utf-8' })
  return JSON.parse(result)
}
