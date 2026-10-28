import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fsPromises from 'fs/promises'
import * as repoModule from '../main/lib/repo'
import * as path from 'path'
import os from 'os'
import fs from 'fs'
import { simpleGit } from 'simple-git'

vi.mock('electron', () => ({
  shell: {
    openPath: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('simple-git', () => {
  const mockGitInstance = {
    init: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    status: vi.fn().mockResolvedValue({ isClean: () => false })
  }
  const mockGit = vi.fn(() => mockGitInstance)
  return { simpleGit: mockGit }
})

const mockLock = vi.hoisted(() => vi.fn().mockResolvedValue(() => {}))
const mockUnlock = vi.hoisted(() => vi.fn().mockResolvedValue())

vi.mock('proper-lockfile', () => ({
  lock: mockLock,
  unlock: mockUnlock,
  check: vi.fn().mockResolvedValue(false)
}))

describe('createRepositoryDirectory (main/lib/repo)', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lrf-test-'))
    vi.clearAllMocks()
  })

  it('should create the repository directory', async () => {
    const repoPath = path.join(tempDir, 'test-repo')
    await repoModule.createRepositoryDirectory(repoPath)

    const stat = await fsPromises.stat(repoPath)
    expect(stat.isDirectory()).toBe(true)
  })

  it('should create a .gitignore file', async () => {
    const repoPath = path.join(tempDir, 'test-repo')
    await repoModule.createRepositoryDirectory(repoPath)

    const gitignorePath = path.join(repoPath, '.gitignore')
    const content = await fsPromises.readFile(gitignorePath, 'utf8')
    expect(content).toContain('.lrf.record.json')
    expect(content).toContain('.lrf.config.json')
    expect(content).toContain('.lrf.lock-info.json')
    expect(content).toContain('*.lock')
  })

  it('should call git.init to initialize a repository', async () => {
    const repoPath = path.join(tempDir, 'test-repo')
    await repoModule.createRepositoryDirectory(repoPath)

    const mockGit = simpleGit as vi.MockedFunction<typeof simpleGit>
    expect(mockGit).toHaveBeenCalledWith(repoPath)
    expect(mockGit(repoPath).init).toHaveBeenCalled()
    expect(mockGit(repoPath).add).toHaveBeenCalledWith('.gitignore')
    expect(mockGit(repoPath).commit).toHaveBeenCalledWith('Initial LRF repository setup')
  })

  it('should return the repo path', async () => {
    const repoPath = path.join(tempDir, 'test-repo')
    const result = await repoModule.createRepositoryDirectory(repoPath)
    expect(result).toBe(repoPath)
  })
})

describe('commitRepo (main/lib/repo)', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lrf-test-'))
    vi.clearAllMocks()
    fs.mkdirSync(path.join(tempDir, 'test-repo'), { recursive: true })
  })

  it('should call git.add and git.commit', async () => {
    const repoPath = path.join(tempDir, 'test-repo')
    await repoModule.commitRepo(repoPath, 'commit message')
    const mockGit = simpleGit as vi.MockedFunction<typeof simpleGit>
    expect(mockGit).toHaveBeenCalledWith(repoPath)
    expect(mockGit(repoPath).status).toHaveBeenCalled()
    expect(mockGit(repoPath).add).toHaveBeenCalledWith('-A')
    expect(mockGit(repoPath).commit).toHaveBeenCalledWith('commit message')
  })

  it('should return success message', async () => {
    const repoPath = path.join(tempDir, 'test-repo')
    const result = await repoModule.commitRepo(repoPath, 'commit message')
    expect(result).toBe('Commit successful')
  })
})
