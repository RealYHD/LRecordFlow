import { type AppState } from "./entities";

export const appStoreState: {
    subscribers: Set<(value: AppState) => void>,
    appState: AppState
    set: (value: AppState) => void,
    subscribe: (subscription: (value: AppState) => void) => (() => void)
} = {
    subscribers: new Set(),
    appState: {
        activeRepository: null,
        activeRecord: null,
        activeRepoView: 'Relational',
        knownRepos: [],
        notifications: []
    },
    set: (value: AppState) => {
        appStoreState.appState = value
        appStoreState.subscribers.forEach(subscriber => {
            subscriber(appStoreState.appState)
        });
    },
    subscribe: (subscription: (value: AppState) => void) => {
        appStoreState.subscribers.add(subscription)
        subscription(appStoreState.appState)
        return () => appStoreState.subscribers.delete(subscription)
    }
}

export function flush() {
    console.log("flush called")
    window['state'].flush('state', appStoreState.appState).then(() => console.log("finished writing"))
}

export function load() {
    window['state'].load('state', appStoreState.appState).then((value) => {
        console.log("finished loading")
        console.log(value)
    })
}
