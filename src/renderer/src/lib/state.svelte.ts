export enum RepoView {
    Relational, Itemized
}

export interface Repository {
    name: string
    remote: string
    local: string
    lastAccessed: Date
    status: "Ready" | "Not Ready"
}

export interface AppState {
    knownRepos: Repository[]
    notifications: NotificationDescriptor[]
}

export interface NotificationDescriptor {
    title: string
    date: Date
    status: "Information" | "Alert"
    message: string
}

export const appStateStore: { state: AppState } = $state({
    state: {
        preferredRepoView: 'Relational',
        knownRepos: [],
        notifications: [],
    }
})

export function flush() {
    window['state'].flush('state', $state.snapshot(appStateStore).state)
}

export function load() {
    window['state'].load('state', $state.snapshot(appStateStore).state).then((value) => {
        Object.assign(appStateStore.state, value)
    })
}