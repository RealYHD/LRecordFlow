import { SvelteMap } from 'svelte/reactivity'
import type {
  AppConfiguration,
  PromiseDescriptor,
  PromiseDescriptorStatus,
  Repository
} from '../../../common/types/models'

export const LoadStatePromiseId = 'Load State'

export const appConfig: AppConfiguration = $state({
  knownRepos: [],
  watchedProcesses: {}
})

export const openedRepo: { repo: Repository } = $state({ repo: undefined })
const trackedPromises: SvelteMap<string, PromiseDescriptor> = new SvelteMap()

export function trackPromise(
  id: string,
  generatePromise: (status: PromiseDescriptorStatus) => Promise<unknown>,
  stopTrackingOnComplete: boolean = true
): PromiseDescriptor {
  if (trackedPromises.has(id)) return trackedPromises.get(id)
  const status: PromiseDescriptorStatus = {
    title: '',
    description: '',
    progress: 0
  }
  const generatedPromise = generatePromise(status)
  trackedPromises.set(id, {
    id: id,
    promise: generatedPromise,
    status: status,
    startTime: Date.now(),
    endTime: undefined
  })
  generatedPromise.then(() => {
    getTrackedPromise(id).endTime = Date.now()
    getTrackedPromise(id).status.progress = 1
  })
  if (stopTrackingOnComplete) {
    generatedPromise.then(() => {
      stopTrackingPromise(id)
    })
  }
  return getTrackedPromise(id)
}

export function getTrackedPromise(id: string): PromiseDescriptor {
  return trackedPromises.get(id)
}

export function stopTrackingPromise(id: string): boolean {
  return trackedPromises.delete(id)
}

export function saveConfiguration(): void {
  window['persistence'].flush('config', $state.snapshot(appConfig))
}

export function isTrackedPromiseDone(id: string): boolean {
  return !trackedPromises.has(id) || trackedPromises.get(id).endTime != undefined
}

export function guaranteeConfiguration(): Promise<AppConfiguration> {
  return trackPromise(LoadStatePromiseId, (message) => {
    message.title = 'Loading Configuration'
    message.description = 'Loading configuration'
    return window['persistence'].load('config', $state.snapshot(appConfig)).then((value) => {
      Object.assign(appConfig, value)
      message.description = 'Completed loading configuration'
    })
  }).promise as Promise<AppConfiguration>
}
