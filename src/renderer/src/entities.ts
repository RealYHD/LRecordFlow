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
    workingDir: string
}


export interface AppState {
    activeRepository: Repository
    activeRecord: Record
    activeRepoView: RepoView
    knownRepos: Repository[]
}