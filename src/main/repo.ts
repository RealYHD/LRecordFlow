import simpleGit, { GitResponseError, MergeResult, TaskOptions } from "simple-git";
import fs from 'fs/promises';
import path from "path";

const recordMetadataFilename = "record.json"
const ignoredRecordFolders = [".git"]
function getRecordPath(localRepoPath: string, recordIdentifier: string): string {
    return path.join(localRepoPath, recordIdentifier)
}

function getRecordMetadataPath(localRepoPath: string, recordIdentifier: string): string {
    return path.join(getRecordPath(localRepoPath, recordIdentifier), recordMetadataFilename)
}

export async function cloneGitRepository(remoteRepoPath: string, localRepoPath: string, localRepoName: string) {
    await simpleGit({ baseDir: localRepoPath }).clone(remoteRepoPath, path.join(localRepoPath, localRepoName))
    return path.join(localRepoPath, localRepoName)
}

export async function repoHasPendingChanges(localRepoPath: string) {
    return (await simpleGit({ baseDir: localRepoPath }).status()).modified
}

export async function repoIsSynced(localRepoPath: string) {
    let gitStatus = await simpleGit({ baseDir: localRepoPath }).fetch().status()
    return gitStatus.ahead == 0 && gitStatus.behind == 0
}

async function merge(localRepoPath: string, options: TaskOptions) {
    try {
        const mergeSummary = await simpleGit({ baseDir: localRepoPath }).merge(options);
        return mergeSummary.conflicts;
    } catch (err) {
        const mergeSummary: MergeResult = (err as GitResponseError<MergeResult>).git;
        const conflicts = mergeSummary?.conflicts || [];
        return conflicts
    }
}

export async function syncLocalRepoWithRemote(localRepoPath: string) {
    return merge(localRepoPath, [])
}

export async function continueSyncLocalRepoWithRemote(localRepoPath: string) {
    return merge(localRepoPath, ["--continue"])
}

export async function abortSyncLocalRepoWithRemote(localRepoPath: string) {
    return merge(localRepoPath, ["--abort"])
}

export async function syncRemoteRepoWithLocal(localRepoPath: string) {
    return (await simpleGit({ baseDir: localRepoPath }).push()).remoteMessages
}

export async function save(localRepoPath: string, modificationNotes: string) {
    return (await simpleGit({ baseDir: localRepoPath }).add(".").commit(modificationNotes)).summary
}

export async function recordExists(localRepoPath: string, recordIdentifier: string): Promise<boolean> {
    let recordDirectory = getRecordPath(localRepoPath, recordIdentifier)
    try {
        await fs.access(recordDirectory)
    } catch (error) {
        return false
    }
    return (await (fs.stat(recordDirectory))).isDirectory()
}

export async function recordHasMetadata(localRepoPath: string, recordIdentifier: string): Promise<boolean> {
    let metadataPath = getRecordMetadataPath(localRepoPath, recordIdentifier)
    try {
        await fs.access(metadataPath)
    } catch (error) {
        return false
    }
    return (await (fs.stat(metadataPath))).isFile()
}

export async function createRecord(localRepoPath: string, recordIdentifier: string) {
    if (await recordExists(localRepoPath, recordIdentifier)) return
    return await fs.mkdir(getRecordPath(localRepoPath, recordIdentifier))
}

export async function deleteRecord(localRepoPath: string, recordIdentifier: string) {
    if (!await recordExists(localRepoPath, recordIdentifier)) return
    return await fs.rm(getRecordPath(localRepoPath, recordIdentifier), { recursive: true, force: true })
}

export async function getRecordMetadata(localRepoPath: string, recordIdentifier: string) {
    if (!(await recordExists(localRepoPath, recordIdentifier)) || !(await recordHasMetadata(localRepoPath, recordIdentifier))) return {}
    if (await recordHasMetadata(localRepoPath, recordIdentifier)) {
        return JSON.parse(await fs.readFile(getRecordMetadataPath(localRepoPath, recordIdentifier), 'utf-8'))
    }
}

export async function setRecord(localRepoPath: string, recordIdentifier: string, record: object) {
    return await fs.writeFile(getRecordMetadataPath(localRepoPath, recordIdentifier), JSON.stringify(record))
}

export async function repoExists(localRepoPath: string) {
    return (await fs.stat(localRepoPath)).isDirectory() && simpleGit({ baseDir: localRepoPath }).checkIsRepo()
}

export async function getAllRepoRecords(localRepoPath: string) {
    // TODO Perhaps in the future make this recursive for "nested records"?
    if (!repoExists(localRepoPath)) return [];
    return (await fs.readdir(localRepoPath, { withFileTypes: true })).filter(entry => {
        return entry.isDirectory() && !(ignoredRecordFolders.includes(entry.name))
    }).map((dir) => dir.name)
}