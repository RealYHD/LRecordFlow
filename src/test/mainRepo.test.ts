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
    commit: vi.fn().mockResolvedValue(undefined)
  }
  const mockGit = vi.fn(() => mockGitInstance)
  return { simpleGit: mockGit }
})

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
