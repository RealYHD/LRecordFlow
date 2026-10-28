import { describe, it, expect, vi, beforeEach } from 'vitest'
import { appConfig, saveConfiguration, openedRepo } from '../renderer/src/lib/state.svelte'
import type { Repository } from '../common/types/models'

interface MockPersistence {
  flush: (key: string, value: unknown) => void
  load: (key: string, value: unknown) => Promise<unknown>
}

interface MockWindow {
  persistence: MockPersistence
}

describe('repo persistence (SelectRepoPage flow)', () => {
  beforeEach(() => {
    appConfig.knownRepos = []
    openedRepo.repo = undefined
  })

  it('saveConfiguration persists knownRepos to window.persistence.flush', () => {
    const mockFlush = vi.fn()
    const mockLoad = vi.fn()
    globalThis.window = {
      persistence: {
        flush: mockFlush,
        load: mockLoad
      }
    } as MockWindow

    const repo: Repository = { name: 'MyRepo', local: '/path/to/repo' }
    appConfig.knownRepos.push(repo)
    saveConfiguration()

    expect(mockFlush).toHaveBeenCalledWith('config', {
      knownRepos: [repo],
      watchedProcesses: {},
      connections: []
    })
  })

  it('adding a repo should persist to storage', () => {
    const mockFlush = vi.fn()
    const mockLoad = vi.fn().mockResolvedValue({
      knownRepos: [],
      watchedProcesses: {},
      connections: []
    })
    globalThis.window = {
      persistence: {
        flush: mockFlush,
        load: mockLoad
      }
    } as MockWindow

    // Simulate the SelectRepoPage addRepositoryPath callback
    const newRepo: Repository = { name: 'NewRepo', local: '/new/repo/path' }
    appConfig.knownRepos.push(newRepo)
    saveConfiguration()

    // Verify the repo is in state
    expect(appConfig.knownRepos).toHaveLength(1)
    expect(appConfig.knownRepos[0].name).toBe('NewRepo')

    // Verify it was persisted
    expect(mockFlush).toHaveBeenCalledWith(
      'config',
      expect.objectContaining({
        knownRepos: [newRepo]
      })
    )
  })

  it('deleting a repo should persist to storage', () => {
    const mockFlush = vi.fn()
    const mockLoad = vi.fn().mockResolvedValue({
      knownRepos: [
        { name: 'Repo1', local: '/path1' },
        { name: 'Repo2', local: '/path2' }
      ],
      watchedProcesses: {},
      connections: []
    })
    globalThis.window = {
      persistence: {
        flush: mockFlush,
        load: mockLoad
      }
    } as MockWindow

    // Simulate loading initial state from persistence
    const loadedRepos: Repository[] = [
      { name: 'Repo1', local: '/path1' },
      { name: 'Repo2', local: '/path2' }
    ]
    appConfig.knownRepos = loadedRepos

    // Simulate deleting Repo2 (index 1)
    appConfig.knownRepos.splice(1, 1)
    saveConfiguration()

    expect(appConfig.knownRepos).toHaveLength(1)
    expect(appConfig.knownRepos[0].name).toBe('Repo1')
    expect(mockFlush).toHaveBeenCalledWith(
      'config',
      expect.objectContaining({
        knownRepos: [{ name: 'Repo1', local: '/path1' }]
      })
    )
  })
})
