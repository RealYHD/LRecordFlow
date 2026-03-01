export enum RepoView {
    Relational, Itemized
}

export interface Repository {
    name: string
    remote: string
    localPath: string
    lastAccessed: Date
}

export interface Record {
    repository: Repository
    path: string
}

export interface Preferences {
}


export interface AppState {
    activeRepository: Repository | null
    activeRecord: Record | null
    activeRepoView: RepoView
    knownRepos: Repository[]
}