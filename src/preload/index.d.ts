import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    repo: Record<string, (...args: unknown[]) => Promise<unknown>>
    script: Record<string, (...args: unknown[]) => Promise<unknown>>
    jobTracker: Record<string, (...args: unknown[]) => Promise<unknown>>
  }
}
