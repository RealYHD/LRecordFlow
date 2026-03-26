import { ipcMain } from 'electron'

export const registeredIPCHandles: Record<string, [string, string][]> = {}

export function registerIPCHandleRetriever() {
    ipcMain.handle("getRegisteredIPCHandles", (_event) => {
        return registeredIPCHandles
    })
}
// Register all repository functions
export function registerIPCHandles(module: object, domain: string) {
    let repoFunctions: [string, Function][] = Object.entries(module).filter(([, value]) => typeof value === "function").map(([key, val]) => [key, (val as Function)])
    repoFunctions.forEach(([key, value]) => {
        let handleKey = domain + ":" + key
        if (!(domain in registeredIPCHandles)) registeredIPCHandles[domain] = []
        registeredIPCHandles[domain].push([key, handleKey])
        ipcMain.handle(handleKey, (_event, ...args) => value(...args))
    })
}
