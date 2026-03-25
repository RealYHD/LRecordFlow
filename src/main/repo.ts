import simpleGit, { GitResponseError, MergeResult, TaskOptions } from 'simple-git'
import { access, copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises'
import path from 'path'
import { shell } from 'electron'
import Papa from 'papaparse'
import { createReadStream } from 'fs'
import { check, lock, unlock } from 'proper-lockfile'
import { userInfo } from 'os'
import { PathStatus, lockStatus } from '../common/types/models'

const recordMetadataFilename = '.lrf.record.json'
const repoConfigurationFilename = '.lrf.config.json'
const lockInfoName = '.lrf.lock-info.json'

const ignoredRecordExtensions = ['.git', '.lock']
function getRecordPath(localRepoPath: string, recordIdentifier: string): string {
  return path.join(localRepoPath, recordIdentifier)
}

function getRecordMetadataPath(localRepoPath: string, recordIdentifier: string): string {
  return path.join(getRecordPath(localRepoPath, recordIdentifier), recordMetadataFilename)
}

export async function cloneGitRepository(
  remoteRepoPath: string,
  localRepoPath: string,
  localRepoName: string
) {
  await simpleGit({ baseDir: localRepoPath }).clone(
    remoteRepoPath,
    path.join(localRepoPath, localRepoName)
  )
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
    const mergeSummary = await simpleGit({ baseDir: localRepoPath }).merge(options)
    return mergeSummary.conflicts
  } catch (err) {
    const mergeSummary: MergeResult = (err as GitResponseError<MergeResult>).git
    const conflicts = mergeSummary?.conflicts || []
    return conflicts
  }
}

export async function syncLocalRepoWithRemote(localRepoPath: string) {
  return merge(localRepoPath, [])
}

export async function continueSyncLocalRepoWithRemote(localRepoPath: string) {
  return merge(localRepoPath, ['--continue'])
}

export async function abortSyncLocalRepoWithRemote(localRepoPath: string) {
  return merge(localRepoPath, ['--abort'])
}

export async function syncRemoteRepoWithLocal(localRepoPath: string) {
  return (await simpleGit({ baseDir: localRepoPath }).push()).remoteMessages
}

export async function save(localRepoPath: string, modificationNotes: string) {
  return (await simpleGit({ baseDir: localRepoPath }).add('.').commit(modificationNotes)).summary
}

export async function recordExists(
  localRepoPath: string,
  recordIdentifier: string
): Promise<boolean> {
  let recordDirectory = getRecordPath(localRepoPath, recordIdentifier)
  try {
    await access(recordDirectory)
  } catch (error) {
    return false
  }
  return (await stat(recordDirectory)).isDirectory()
}

export async function attemptLockRecord(localRepoPath: string, recordIdentifier: string) {
  return await attemptLockPath(path.join(localRepoPath, recordIdentifier))
}

export async function attemptUnlockRecord(localRepoPath: string, recordIdentifier: string) {
  return await attemptUnlockPath(path.join(localRepoPath, recordIdentifier))
}

export async function statRecord(localRepoPath: string, recordIdentifier: string) {
  return await getPathStats(path.join(localRepoPath, recordIdentifier))
}

export async function attemptLockRepoConfig(localRepoPath) {
  return await attemptLockPath(path.join(localRepoPath, repoConfigurationFilename))
}

export async function attemptUnlockRepoConfig(localRepoPath) {
  return await attemptUnlockPath(path.join(localRepoPath, repoConfigurationFilename))
}

export async function statRepoConfig(localRepoPath) {
  return await getPathStats(path.join(localRepoPath, repoConfigurationFilename))
}

export async function attemptLockPath(pathToLock: string): Promise<boolean> {
  let pathStat = await stat(pathToLock)
  let pathIsDir = pathStat.isDirectory()
  let basename = path.basename(pathToLock)
  let lockInfoPath = pathIsDir
    ? path.join(pathToLock, lockInfoName)
    : path.join(
        path.dirname(pathToLock),
        (basename.startsWith('.') ? basename : '.' + basename) + lockInfoName
      )
  let lockInfo = {
    currentUser: userInfo().username,
    lockDate: new Date()
  }
  try {
    await lock(pathToLock)
    await writeFile(lockInfoPath, JSON.stringify(lockInfo))
    return true
  } catch (error) {
    // TODO check if it exists, if not, return generic message
    // TODO check if it's the same user as the one currently trying to edit (indicates multiple instances of the software is open)
    return false
  }
}

export async function attemptUnlockPath(pathToUnlock: string) {
  let pathStat = await stat(pathToUnlock)
  let pathIsDir = pathStat.isDirectory()
  let basename = path.basename(pathToUnlock)
  let lockInfoPath = pathIsDir
    ? path.join(pathToUnlock, lockInfoName)
    : path.join(
        path.dirname(pathToUnlock),
        (basename.startsWith('.') ? basename : '.' + basename) + lockInfoName
      )
  try {
    await rm(lockInfoPath, { force: true })
    await unlock(pathToUnlock)
    return true
  } catch (error) {
    if (await check(pathToUnlock)) {
      throw error
    } else {
      return false
    }
  }
}

export async function getPathStats(pathToStat: string): Promise<PathStatus> {
  let pathStat = await stat(pathToStat)
  let pathIsDir = pathStat.isDirectory()
  let basename = path.basename(pathToStat)
  let lockInfoPath = pathIsDir
    ? path.join(pathToStat, lockInfoName)
    : path.dirname(pathToStat) +
      (basename.startsWith('.') ? basename : '.' + basename) +
      lockInfoName
  let lockStatus: lockStatus = {
    currentUser: userInfo().username,
    lockDate: new Date()
  }
  let lastModifiedTime: Date | undefined = undefined
  try {
    lastModifiedTime = (await stat(pathToStat)).mtime
  } catch (error) {
    return { lastModified: null, lockStatus: null }
  }
  if (await check(pathToStat)) {
    // Has ownership over lock
    try {
      await access(lockInfoPath)
      lockStatus = JSON.parse(await readFile(lockInfoPath, 'utf-8'))
    } catch (error) {
      await writeFile(lockInfoPath, JSON.stringify(lockStatus))
    }
    return { lastModified: lastModifiedTime, lockStatus: lockStatus }
  } else {
    return { lastModified: lastModifiedTime, lockStatus: null }
  }
}

export async function getRepoLastModified(localRepoPath: string): Promise<Date | null> {
  let recordIdentifiers: string[] = await getAllRepoRecords(localRepoPath)
  let lastModified: Date | null = null
  for (const recordIdentifier of recordIdentifiers) {
    let recordStats: PathStatus = await statRecord(localRepoPath, recordIdentifier)
    if (recordStats.lastModified == null) continue
    if (lastModified == undefined || recordStats.lastModified > lastModified) {
      lastModified = recordStats.lastModified
    }
  }
  let repoStat = await statRepoConfig(localRepoPath)
  if (
    lastModified == null ||
    (repoStat.lastModified != null && repoStat.lastModified > lastModified)
  ) {
    lastModified = repoStat.lastModified
  }
  return lastModified
}

export async function recordHasMetadata(
  localRepoPath: string,
  recordIdentifier: string
): Promise<boolean> {
  let metadataPath = getRecordMetadataPath(localRepoPath, recordIdentifier)
  try {
    await access(metadataPath)
  } catch (error) {
    return false
  }
  return (await stat(metadataPath)).isFile()
}

export async function createRecord(localRepoPath: string, recordIdentifier: string) {
  if (await recordExists(localRepoPath, recordIdentifier)) return
  return await mkdir(getRecordPath(localRepoPath, recordIdentifier))
}

export async function deleteRecord(localRepoPath: string, recordIdentifier: string) {
  if (!(await recordExists(localRepoPath, recordIdentifier))) return
  return await rm(getRecordPath(localRepoPath, recordIdentifier), { recursive: true, force: true })
}

export async function getRecordMetadata(
  localRepoPath: string,
  recordIdentifier: string
): Promise<Record<string, string>> {
  if (
    !(await recordExists(localRepoPath, recordIdentifier)) ||
    !(await recordHasMetadata(localRepoPath, recordIdentifier))
  )
    return {}
  if (await recordHasMetadata(localRepoPath, recordIdentifier)) {
    return JSON.parse(
      await readFile(getRecordMetadataPath(localRepoPath, recordIdentifier), 'utf-8')
    )
  }
  return {}
}

export async function setRecord(
  localRepoPath: string,
  recordIdentifier: string,
  recordData: object
) {
  if (!localRepoPath.trim().length) return
  if (!recordIdentifier.trim().length) return
  await mkdir(path.join(localRepoPath, recordIdentifier), { recursive: true })
  return await writeFile(
    getRecordMetadataPath(localRepoPath, recordIdentifier),
    JSON.stringify(recordData)
  )
}

export async function repoExists(localRepoPath: string) {
  try {
    await access(localRepoPath)
  } catch (error) {
    return false
  }
  return (await stat(localRepoPath)).isDirectory()
}

export async function getAllRepoRecords(localRepoPath: string): Promise<string[]> {
  // TODO Perhaps in the future make this recursive for "nested records"?
  if (!(await repoExists(localRepoPath))) return []
  return (await readdir(localRepoPath, { withFileTypes: true }))
    .filter((entry) => {
      return (
        entry.isDirectory() &&
        !ignoredRecordExtensions.includes(path.extname(entry.name)) &&
        !ignoredRecordExtensions.includes(entry.name)
      )
    })
    .map((dir) => dir.name)
}

export async function repoConfigurationExists(localRepoPath: string) {
  if (!(await repoExists(localRepoPath))) return []
  try {
    await access(path.join(localRepoPath, repoConfigurationFilename))
  } catch (error) {
    return false
  }
  return true
}

export async function getRepoConfiguration(localRepoPath: string) {
  if (!(await repoExists(localRepoPath)) || !(await repoConfigurationExists(localRepoPath)))
    return {}
  return JSON.parse(await readFile(path.join(localRepoPath, repoConfigurationFilename), 'utf-8'))
}

export async function setRepoConfiguration(localRepoPath: string, repoConfiguration: object) {
  if (!(await repoExists(localRepoPath))) return
  return await writeFile(
    path.join(localRepoPath, repoConfigurationFilename),
    JSON.stringify(repoConfiguration)
  )
}

export async function openRepoDirectory(localRepoPath: string) {
  return await shell.openPath(localRepoPath)
}

export async function openRepoRecordDirectory(localRepoPath: string, recordIdentifier: string) {
  return await shell.openPath(path.join(localRepoPath, recordIdentifier))
}

export async function getFilesAssociatedWithRecord(
  localRepoPath: string,
  recordIdentifier: string
) {
  return (
    await readdir(path.join(localRepoPath, recordIdentifier), {
      recursive: false,
      withFileTypes: true
    })
  )
    .filter((entry) => entry.isFile() && entry.name != recordMetadataFilename)
    .map((entry) => entry.name)
}

export async function putFileInRecord(
  localRepoPath: string,
  recordIdentifier: string,
  filepath: string
) {
  return await copyFile(
    filepath,
    path.join(localRepoPath, recordIdentifier, path.basename(filepath))
  )
}

export async function removeFileInRecord(
  localRepoPath: string,
  recordIdentifier: string,
  filepath: string
) {
  return await rm(path.join(localRepoPath, recordIdentifier, filepath))
}

export async function openFileInRecord(
  localRepoPath: string,
  recordIdentifier: string,
  filepath: string
) {
  return await shell.openPath(path.join(localRepoPath, recordIdentifier, filepath))
}

export async function importRepoRecordsFromTabular(
  localRepoPath: string,
  tabularPath: string,
  identifierCol: string,
  pathColumns: string[]
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    let identifiers: string[] = []
    let promises: Promise<void>[] = []
    Papa.parse<Record<string, string>>(createReadStream(tabularPath), {
      header: true,
      step: (results) => {
        if (results.errors.length) reject(results.errors)
        identifiers.push(results.data[identifierCol])
        promises.push(
          mkdir(path.join(localRepoPath, results.data[identifierCol])).then(() => {
            let recordMetadata = {}
            Object.assign(recordMetadata, results.data)
            delete recordMetadata[identifierCol]
            console.log(recordMetadata)
            for (const pathCol of pathColumns) {
              recordMetadata[pathCol] = path.basename(results.data[pathCol])
              promises.push(
                copyFile(
                  results.data[pathCol],
                  path.join(localRepoPath, results.data[identifierCol], recordMetadata[pathCol])
                )
              )
            }
            promises.push(
              writeFile(
                path.join(localRepoPath, results.data[identifierCol], recordMetadataFilename),
                JSON.stringify(recordMetadata)
              )
            )
          })
        )
      },
      complete: (results) => {
        console.log('results')
        if (results.errors.length) reject(results.errors)
        Promise.all(promises).then(() => {
          resolve(identifiers)
        })
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

export async function createRepositoryDirectory(repoPath: string) {
  return await mkdir(repoPath, { recursive: true })
}
