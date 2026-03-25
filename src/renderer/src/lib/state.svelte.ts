import { SvelteMap } from 'svelte/reactivity'
import type { AppState, PromiseDescriptor } from '../../../common/types/models';

export const LoadStatePromiseId = 'Load State'

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

export function loadAppState() {
  if (appStateStore.promises.has(LoadStatePromiseId)) {
    return getTrackedPromise(LoadStatePromiseId).promise
  } else {
    return trackPromise({
      id: LoadStatePromiseId,
      promise: window['state'].load('state', $state.snapshot(appStateStore).state).then((value) => {
        Object.assign(appStateStore.state, value)
      }),
      startTime: new Date(),
      title: 'Load App State',
      endTime: null,
      status: 'Loading app state from drive.'
    }).promise
  }
}
