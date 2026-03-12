import { SvelteMap } from 'svelte/reactivity'

export interface Repository {
  name: string
  remote: string
  local: string
  lastAccessed: Date
  status: 'Ready' | 'Not Ready'
}

export interface NotificationDescriptor {
  title: string
  date: Date
  status: 'Information' | 'Alert'
  message: string
}

export interface AppState {
  knownRepos: Repository[]
  openedRepoPath: string | null
  ongoingProcesses: Record<string, ProcessDescriptor>
}

export interface PromiseDescriptor {
  id: string
  title: string
  promise: Promise<any>
  status: string
  startTime: Date
  endTime: Date | null
}

export interface ProcessDescriptor {
  title: string
  pid: number
  status: string
  startTime: Date
  endTime: Date | null
}

export const appStateStore: { state: AppState; promises: SvelteMap<string, PromiseDescriptor> } =
  $state({
    state: {
      knownRepos: [],
      openedRepoPath: null,
      ongoingProcesses: {}
    },
    promises: new SvelteMap()
  })

export function trackPromise(promiseDescriptor: PromiseDescriptor): PromiseDescriptor {
  if (appStateStore.promises.has(promiseDescriptor.id)) {
    return appStateStore.promises.get(promiseDescriptor.id)
  }
  promiseDescriptor.promise.then(() => {
    getTrackedPromise(promiseDescriptor.id).endTime = new Date()
  })
  appStateStore.promises.set(promiseDescriptor.id, promiseDescriptor)
  return appStateStore.promises.get(promiseDescriptor.id)
}

export function getTrackedPromise(id: string) {
  return appStateStore.promises.get(id)
}

export function stopTrackingPromise(id: string) {
  return appStateStore.promises.delete(id)
}

export function flush() {
  window['state'].flush('state', $state.snapshot(appStateStore).state)
}

export function load() {
  window['state'].load('state', $state.snapshot(appStateStore).state).then((value) => {
    Object.assign(appStateStore.state, value)
  })
}
