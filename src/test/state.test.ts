import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  appConfig,
  saveConfiguration,
  guaranteeConfiguration,
  openedRepo
} from '../renderer/src/lib/state.svelte'
import type { Repository } from '../common/types/models'

interface MockPersistence {
  flush: (key: string, value: unknown) => void
  load: (key: string, value: unknown) => Promise<unknown>
}

interface MockWindow {
  persistence: MockPersistence
}

describe('state management', () => {
  beforeEach(() => {
    // Reset state to clean values
    appConfig.knownRepos = []
    openedRepo.repo = undefined
  })

  describe('appConfig.knownRepos', () => {
    it('starts empty', () => {
      expect(appConfig.knownRepos).toHaveLength(0)
    })

    it('can add a repo', () => {
      const repo: Repository = { name: 'TestRepo', local: '/path/to/repo' }
      appConfig.knownRepos.push(repo)
      expect(appConfig.knownRepos).toHaveLength(1)
      expect(appConfig.knownRepos[0].name).toBe('TestRepo')
      expect(appConfig.knownRepos[0].local).toBe('/path/to/repo')
    })

    it('can remove a repo', () => {
      const repos: Repository[] = [
        { name: 'Repo1', local: '/path1' },
        { name: 'Repo2', local: '/path2' }
      ]
      appConfig.knownRepos = repos
      appConfig.knownRepos.splice(1, 1)
      expect(appConfig.knownRepos).toHaveLength(1)
      expect(appConfig.knownRepos[0].name).toBe('Repo1')
    })
  })

  describe('openedRepo', () => {
    it('starts with undefined repo', () => {
      expect(openedRepo.repo).toBeUndefined()
    })

    it('can open a repo', () => {
      const repo: Repository = { name: 'TestRepo', local: '/path/to/repo' }
      openedRepo.repo = repo
      expect(openedRepo.repo).toEqual(repo)
    })

    it('can close a repo', () => {
      openedRepo.repo = { name: 'TestRepo', local: '/path' }
      openedRepo.repo = undefined
      expect(openedRepo.repo).toBeUndefined()
    })
  })

  describe('saveConfiguration', () => {
    it('persists config to window.persistence.flush', () => {
      const repo: Repository = { name: 'TestRepo', local: '/path/to/repo' }
      appConfig.knownRepos.push(repo)

      const mockFlush = vi.fn()
      const mockLoad = vi.fn()
      globalThis.window = {
        persistence: {
          flush: mockFlush,
          load: mockLoad
        }
      } as MockWindow

      saveConfiguration()

      expect(mockFlush).toHaveBeenCalledWith('config', {
        knownRepos: [repo],
        watchedProcesses: {},
        connections: []
      })
    })
  })

  describe('guaranteeConfiguration', () => {
    it('loads config from window.persistence.load', async () => {
      const mockLoad = vi.fn().mockResolvedValue({
        knownRepos: [{ name: 'LoadedRepo', local: '/loaded/path' }],
        watchedProcesses: {},
        connections: []
      })
      globalThis.window = {
        persistence: {
          flush: vi.fn(),
          load: mockLoad
        }
      } as MockWindow

      const result = await guaranteeConfiguration()

      expect(mockLoad).toHaveBeenCalledWith('config', expect.any(Object))
      expect(result).toBeUndefined()
      expect(appConfig.knownRepos).toHaveLength(1)
      expect(appConfig.knownRepos[0].name).toBe('LoadedRepo')
    })

    it('handles load failure (rejects are swallowed by .then)', async () => {
      globalThis.window = {
        persistence: {
          flush: vi.fn(),
          load: vi.fn().mockRejectedValue(new Error('Load failed'))
        }
      } as MockWindow

      // guaranteeConfiguration does not throw because .then() without rejection
      // handler converts rejection to undefined resolution
      const result = await guaranteeConfiguration()
      expect(result).toBeUndefined()
    })
  })
})
