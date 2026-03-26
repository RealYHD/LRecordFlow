import { ipcMain } from 'electron'

export const registeredIPCHandles: Record<string, [string, string][]> = {}

export function registerIPCHandleRetriever(): void {
  ipcMain.handle('getRegisteredIPCHandles', () => {
    return registeredIPCHandles
  })
}
// Register all repository functions
export function registerIPCHandles(module: object, domain: string): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const repoFunctions: [string, Function][] = Object.entries(module)
    .filter(([, value]) => typeof value === 'function')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    .map(([key, val]) => [key, val as Function])
  repoFunctions.forEach(([key, value]) => {
    const handleKey = domain + ':' + key
    if (!(domain in registeredIPCHandles)) registeredIPCHandles[domain] = []
    registeredIPCHandles[domain].push([key, handleKey])
    ipcMain.handle(handleKey, (_event, ...args) => value(...args))
  })
}
