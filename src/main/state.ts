import { app } from "electron";
import { existsSync } from "fs";
import { readFile, stat, writeFile } from "fs/promises";
import path from "path";

export async function flush(name: string, value: object) {
    let storePath = path.join(app.getPath("userData"), name + ".json")
    if (!value) return
    console.log("writing to " + storePath)
    return await writeFile(storePath, JSON.stringify(value), { encoding: 'utf-8' })
}

export async function load(name: string, defaultValue: object) {
    let storePath = path.join(app.getPath("userData"), name + ".json")
    if (!(existsSync(storePath) && (await stat(storePath)).isFile())) return defaultValue
    console.log("retrieving from " + storePath)
    let result = await readFile(storePath, { encoding: 'utf-8' })
    return JSON.parse(result)
}