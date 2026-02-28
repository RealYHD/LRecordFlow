import simpleGit, { GitResponseError, MergeResult, TaskOptions } from "simple-git";
import fs from 'fs/promises';
import path from "path";

export const recordMetadataFilename = "record.json"

function getRecordPath(workingDir: string, localRepoName: string, recordIdentifier: string): string {
    return path.join(workingDir, localRepoName, recordIdentifier)
}

function getRecordMetadataPath(workingDir: string, localRepoName: string, recordIdentifier: string): string {
    return path.join(getRecordPath(workingDir, localRepoName, recordIdentifier), recordMetadataFilename)
}

function getRepositoryPath(workingDir: string, localRepoName: string) {
    return path.join(workingDir, localRepoName)
}

export async function cloneGitRepository(workingDir: string, remoteRepoPath: string) {
    return await simpleGit({ baseDir: workingDir }).clone(remoteRepoPath)
}

export async function repoHasPendingChanges(workingDir: string, localRepoName: string) {
    return (await simpleGit({ baseDir: getRepositoryPath(workingDir, localRepoName) }).status()).modified
}

export async function repoIsSynced(workingDir: string, localRepoName: string) {
    let gitStatus = await simpleGit({ baseDir: getRepositoryPath(workingDir, localRepoName) }).fetch().status()
    return gitStatus.ahead == 0 && gitStatus.behind == 0
}

async function merge(workingDir: string, localRepoName: string, options: TaskOptions) {
    try {
        const mergeSummary = await simpleGit({baseDir: getRepositoryPath(workingDir, localRepoName)}).merge(options);
        return mergeSummary.conflicts;
    } catch (err) {
        const mergeSummary: MergeResult = (err as GitResponseError<MergeResult>).git;
        const conflicts = mergeSummary?.conflicts || [];
        return conflicts
    }
}

export async function syncLocalRepoWithRemote(workingDir: string, localRepoName: string) {
    return merge(workingDir, localRepoName, [])
}

export async function continueSyncLocalRepoWithRemote(workingDir: string, localRepoName: string) {
    return merge(workingDir, localRepoName, ["--continue"])
}

export async function abortSyncLocalRepoWithRemote(workingDir: string, localRepoName: string) {
    return merge(workingDir, localRepoName, ["--abort"])
}

export async function syncRemoteRepoWithLocal(workingDir: string, localRepoName: string) {
    return (await simpleGit({ baseDir: getRepositoryPath(workingDir, localRepoName) }).push()).remoteMessages
}

export async function save(workingDir: string, localRepoName: string, modificationNotes: string) {
    return (await simpleGit({ baseDir: getRepositoryPath(workingDir, localRepoName) }).add(".").commit(modificationNotes)).summary
}

export async function recordExists(workingDir: string, localRepoName: string, recordIdentifier: string): Promise<boolean> {
    let recordDirectory = getRecordPath(workingDir, localRepoName, recordIdentifier)
    return (await (fs.stat(recordDirectory))).isDirectory()
}

export async function recordHasMetadata(workingDir: string, localRepoName: string, recordIdentifier: string): Promise<boolean> {
    return (await (fs.stat(getRecordMetadataPath(workingDir, localRepoName, recordIdentifier)))).isFile()
}

export async function createRecord(workingDir: string, localRepoName: string, recordIdentifier: string) {
    if (await recordExists(workingDir, localRepoName, recordIdentifier)) return
    return await fs.mkdir(getRecordPath(workingDir, localRepoName, recordIdentifier))
}

export async function deleteRecord(workingDir: string, localRepoName: string, recordIdentifier: string) {
    if (!await recordExists(workingDir, localRepoName, recordIdentifier)) return
    return await fs.rm(getRecordPath(workingDir, localRepoName, recordIdentifier), { recursive: true, force: true })
}

export async function getRecord(workingDir: string, localRepoName: string, recordIdentifier: string) {
    if (!await recordExists(workingDir, localRepoName, recordIdentifier)) return "{}"
    if (await recordHasMetadata(workingDir, localRepoName, recordIdentifier)) {
        return JSON.parse(await fs.readFile(getRecordMetadataPath(workingDir, localRepoName, recordIdentifier), 'utf-8'))
    }
}

export async function setRecord(workingDir: string, localRepoName: string, recordIdentifier: string, record: object) {
    return await fs.writeFile(getRecordMetadataPath(workingDir, localRepoName, recordIdentifier), JSON.stringify(record))
}

export async function repoExists(workingDir: string, localRepoName: string) {
    let repoPath = getRepositoryPath(workingDir, localRepoName)
    return (await fs.stat(repoPath)).isDirectory() && simpleGit({baseDir: repoPath}).checkIsRepo()
}

export async function getAllRepoRecords(workingDir: string, localRepoName: string) {
    if (!repoExists(workingDir, localRepoName)) return [];
    return (await fs.readdir(getRepositoryPath(workingDir, localRepoName), { withFileTypes: true })).filter(entry => entry.isDirectory())
}

export async function getAllRepos(workingDir: string) {
    return (await fs.readdir(workingDir, {withFileTypes: true})).filter(entry => entry.isDirectory() && repoExists(workingDir, entry.name)).map((value) => value.name)
}