import simpleGit, { GitResponseError, MergeResult, TaskOptions } from "simple-git";
import fs, { copyFile, mkdir, rm } from 'fs/promises';
import path from "path";
import { shell } from "electron";

const recordMetadataFilename = "record.json"
const repoConfigurationFilename = "configuration.json"
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

export async function getRecordMetadata(localRepoPath: string, recordIdentifier: string): Promise<Record<string, string>> {
    if (!(await recordExists(localRepoPath, recordIdentifier)) || !(await recordHasMetadata(localRepoPath, recordIdentifier))) return {}
    if (await recordHasMetadata(localRepoPath, recordIdentifier)) {
        return JSON.parse(await fs.readFile(getRecordMetadataPath(localRepoPath, recordIdentifier), 'utf-8'))
    }
    return {}
}

export async function setRecord(localRepoPath: string, recordIdentifier: string, recordData: object) {
    if (!localRepoPath.trim().length) return
    if (!recordIdentifier.trim().length) return
    await mkdir(path.join(localRepoPath, recordIdentifier), { recursive: true })
    return await fs.writeFile(getRecordMetadataPath(localRepoPath, recordIdentifier), JSON.stringify(recordData))
}

export async function repoExists(localRepoPath: string) {
    try {
        await fs.access(localRepoPath)
    } catch (error) {
        return false
    }
    return (await fs.stat(localRepoPath)).isDirectory() && (await simpleGit({ baseDir: localRepoPath }).checkIsRepo())
}

export async function getAllRepoRecords(localRepoPath: string) {
    // TODO Perhaps in the future make this recursive for "nested records"?
    if (!await repoExists(localRepoPath)) return [];
    return (await fs.readdir(localRepoPath, { withFileTypes: true })).filter(entry => {
        return entry.isDirectory() && !(ignoredRecordFolders.includes(entry.name))
    }).map((dir) => dir.name)
}

export async function repoConfigurationExists(localRepoPath: string) {
    if (!await repoExists(localRepoPath)) return [];
    try {
        await fs.access(path.join(localRepoPath, repoConfigurationFilename))
    } catch (error) {
        return false
    }
    return true
}

export async function getRepoConfiguration(localRepoPath: string) {
    if (!await repoExists(localRepoPath) || !await repoConfigurationExists(localRepoPath)) return {};
    return JSON.parse(await fs.readFile(path.join(localRepoPath, repoConfigurationFilename), 'utf-8'))
}

export async function setRepoConfiguration(localRepoPath: string, repoConfiguration: object) {
    if (!await repoExists(localRepoPath)) return
    return await fs.writeFile(path.join(localRepoPath, repoConfigurationFilename), JSON.stringify(repoConfiguration))
}

export async function openRepoDirectory(localRepoPath: string) {
    return await shell.openPath(localRepoPath)
}

export async function openRepoRecordDirectory(localRepoPath: string, recordIdentifier: string) {
    return await shell.openPath(path.join(localRepoPath, recordIdentifier))
}

export async function getFilesAssociatedWithRecord(localRepoPath: string, recordIdentifier: string) {
    return (await fs.readdir(path.join(localRepoPath, recordIdentifier), { recursive: false, withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name != recordMetadataFilename)
        .map((entry) => entry.name)
}

export async function putFileInRecord(localRepoPath: string, recordIdentifier: string, filepath: string) {
    return await copyFile(filepath, path.join(localRepoPath, recordIdentifier, path.basename(filepath)))
}

export async function removeFileInRecord(localRepoPath: string, recordIdentifier: string, filepath: string) {
    return await rm(path.join(localRepoPath, recordIdentifier, filepath))
}

export async function openFileInRecord(localRepoPath: string, recordIdentifier: string, filepath: string) {
    return await shell.openPath(path.join(localRepoPath, recordIdentifier, filepath))
}