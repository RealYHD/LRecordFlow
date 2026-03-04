import { type AppState, type Repository } from "./entities";

export const appStateStore: { state: AppState } = $state({
    state: {
        preferredRepoView: 'Relational',
        knownRepos: [],
        notifications: []
    }
})

export function flush() {
    window['state'].flush('state', $state.snapshot(appStateStore).state)
}

export function load() {
    window['state'].load('state', $state.snapshot(appStateStore).state).then((value) => {
        appStateStore.state = value
    })
}