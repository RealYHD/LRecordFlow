import { contextBridge, ipcMain, ipcRenderer } from 'electron'
import * as Repositories from './repo'

const repoFunctions: [string, Function][] = Object.entries(Repositories).filter(([, value]) => typeof value === "function").map(([key, val]) => [key, (val as Function)])
const domain: string = "repository"

// Register all repository functions
export function registerIPCHandles() {
    repoFunctions.forEach(([key, value]) => ipcMain.handle(domain + ":" + key, (event, ...args) => value(...args)))
}

export function exposeRepoFunctionsInMainWorld() {
    contextBridge.exposeInMainWorld("repo", Object.fromEntries(repoFunctions.map(([key, val]) => [key, (...args: any) => ipcRenderer.invoke(domain + ":" + key, ...args)])))
}