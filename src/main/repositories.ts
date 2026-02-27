import simpleGit, { SimpleGit } from "simple-git";
import fs from 'fs/promises';
import path from "path";

export const recordMetadataFilename = "record.json"

export class RepositoryManager {
    private workingDir: string
    /**
     *
     */
    constructor(workingDir: string) {
        this.workingDir = workingDir;
    }

    private getRecordPath(localRepoName: string, recordIdentifier: string): string {
        return path.join(this.workingDir, localRepoName, recordIdentifier)
    }

    private getRecordMetadataPath(localRepoName: string, recordIdentifier: string): string {
        return path.join(this.getRecordPath(localRepoName, recordIdentifier), recordMetadataFilename)
    }

    private getRepositoryPath(localRepoName: string) {
        return path.join(this.workingDir, localRepoName)
    }

    /**
     * setupRepository
    */
    public async cloneGitRepository(remoteRepoPath: string) {
        return await simpleGit({ baseDir: this.workingDir }).clone(remoteRepoPath)
    }

    public async repoHasPendingChanges(localRepoName: string) {
        return (await simpleGit({ baseDir: this.getRepositoryPath(localRepoName) }).status()).modified
    }

    public async repoIsSynced(localRepoName: string) {
        let gitStatus = await simpleGit({ baseDir: this.getRepositoryPath(localRepoName) }).fetch().status()
        return gitStatus.ahead == 0 && gitStatus.behind == 0
    }

    // TODO figure out merge conflict resolution

    public async syncLocalRepoWithRemote(localRepoName: string) {
        return (await simpleGit({baseDir: this.getRepositoryPath(localRepoName)}).pull()).summary
    }

    public async syncRemoteRepoWithLocal(localRepoName: string) {
        return (await simpleGit({baseDir: this.getRepositoryPath(localRepoName)}).push()).remoteMessages
    }

    public async save(localRepoName: string, modificationNotes: string) {
        return (await simpleGit({baseDir: this.getRepositoryPath(localRepoName)}).add(".").commit(modificationNotes)).summary
    }

    /**
     * recordExists
     */
    public async recordExists(localRepoName: string, recordIdentifier: string): Promise<boolean> {
        let recordDirectory = this.getRecordPath(localRepoName, recordIdentifier)
        return (await (fs.stat(recordDirectory))).isDirectory()
    }

    public async recordHasMetadata(localRepoName: string, recordIdentifier: string): Promise<boolean> {
        return (await (fs.stat(this.getRecordMetadataPath(localRepoName, recordIdentifier)))).isFile()
    }

    public async createRecord(localRepoName: string, recordIdentifier: string) {
        if (await this.recordExists(localRepoName, recordIdentifier)) return
        return await fs.mkdir(this.getRecordPath(localRepoName, recordIdentifier))
    }

    public async deleteRecord(localRepoName: string, recordIdentifier: string) {
        if (!await this.recordExists(localRepoName, recordIdentifier)) return
        return await fs.rm(this.getRecordPath(localRepoName, recordIdentifier), { recursive: true, force: true })
    }

    public async getRecord(localRepoName: string, recordIdentifier: string) {
        if (!await this.recordExists(localRepoName, recordIdentifier)) return "{}"
        if (await this.recordHasMetadata(localRepoName, recordIdentifier)) {
            return JSON.parse(await fs.readFile(this.getRecordMetadataPath(localRepoName, recordIdentifier), 'utf-8'))
        }
    }

    public async setRecord(localRepoName: string, recordIdentifier: string, record: object) {
        return await fs.writeFile(this.getRecordMetadataPath(localRepoName, recordIdentifier), JSON.stringify(record))
    }

    public async repoExists(localRepoName: string) {
        return (await fs.stat(this.getRepositoryPath(localRepoName))).isDirectory()
    }

    public async getAllRepoRecords(localRepoName: string) {
        if (!this.repoExists(localRepoName)) return [];
        return (await fs.readdir(this.getRepositoryPath(localRepoName), { withFileTypes: true })).filter(entry => entry.isDirectory())
    }
}