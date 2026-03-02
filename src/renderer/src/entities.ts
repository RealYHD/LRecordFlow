export enum RepoView {
    Relational, Itemized
}

export interface Repository {
    name: string
    remote: string
    local: string
    lastAccessed: Date
}

export interface Record {
    repository: Repository
    path: string
}


export interface AppState {
    activeRepository: Repository | null
    activeRecord: Record | null
    activeRepoView: "Relational" | "Itemized"
    knownRepos: Repository[]
    notifications: NotificationDescriptor[]
}

export interface NotificationDescriptor {
    title: string
    date: Date
    status: "Information" | "Alert"
    message: string
}