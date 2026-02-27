export enum RepoView {
    Relational, Itemized
}

export interface Repository {
    name: string
    url: string
    gitUser: string
    gitPassword: string
}

export interface Preferences {
    workingDir: string
}


export interface AppState {
    activeRepository: Repository
    activeRepoView: RepoView
}