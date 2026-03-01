import { writable, type Writable } from 'svelte/store'
import { RepoView, type AppState, type Preferences } from "./entities";

export const appStoreState = {
    subscribers: [],
    appState: {
        activeRepository: null,
        activeRecord: null,
        activeRepoView: RepoView.Relational,
        knownRepos: []
    },
    set: (value: AppState) => {
        appStoreState.appState = value
        appStoreState.subscribers.forEach(subscriber => {
            subscriber(appStoreState.appState)
        });
        window['state'].flush('state', value)
    },
    subscribe: (subscription: (value: any) => void) => {
        appStoreState.subscribers.push(subscription)
        subscription(appStoreState.appState)
    },
    load: () => {
        window['state'].load(appStoreState.appState)
    },
    save: (value: AppState) => {
        window['state'].flush('state', value)
    }
}
appStoreState.load()