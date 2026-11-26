import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fsPromises from 'fs/promises'
import * as path from 'path'
import os from 'os'
import fs from 'fs'

const mockIsRunning = vi.hoisted(() => vi.fn().mockResolvedValue(true))
const mockFetchOutput = vi.hoisted(() => vi.fn().mockResolvedValue(null))
const mockApplyOutput = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('../main/lib/script', () => ({
  isProcessRunning: mockIsRunning,
  fetchScriptOutput: mockFetchOutput,
  applyScriptOutput: mockApplyOutput,
  getRecordMetadata: vi.fn().mockResolvedValue({ sample_id: 'record1' })
}))

vi.mock('../main/lib/repo', () => ({
  getRepoConfiguration: vi.fn().mockResolvedValue({
    connection: { host: 'host', port: 22, username: 'user', privateKeyPath: undefined, password: undefined }
  }),
  getAllRecordsForRepo: vi.fn().mockResolvedValue(['record1'])
}))

vi.mock('../main/lib/persistence', () => ({
  load: vi.fn().mockResolvedValue({ knownRepos: [{ name: 'test-repo', local: '/repo' }] })
}))

describe('reconcileJobs (main/lib/jobTracker)', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lrf-test-'))
    vi.clearAllMocks()
  })

  it('should mark a completed job and apply its output', async () => {
    mockIsRunning.mockResolvedValue(false)
    mockFetchOutput.mockResolvedValue({ coverage: '35' })

    const state = {
      script: 'pipeline.py',
      jobId: '12345',
      status: 'pending' as const,
      lastSubmitted: new Date(),
      lastChecked: null,
      output: null
    }
    await fsPromises.mkdir(path.join(tempDir, 'record1'), { recursive: true })
    await fsPromises.writeFile(
      path.join(tempDir, 'record1', '.lrf.script-state.json'),
      JSON.stringify(state)
    )

    const scriptModule = await import('../main/lib/jobTracker')
    await scriptModule.reconcileJobs(tempDir)

    expect(mockIsRunning).toHaveBeenCalled()
    expect(mockFetchOutput).toHaveBeenCalledWith(expect.anything(), 'record1', 'pipeline.py')
    expect(mockApplyOutput).toHaveBeenCalledWith(tempDir, 'record1', { coverage: '35' }, 'pipeline.py')

    mockIsRunning.mockResolvedValue(true)
    mockFetchOutput.mockResolvedValue(null)
  })

  it('should mark a failed job when no output exists', async () => {
    mockIsRunning.mockResolvedValue(false)
    mockFetchOutput.mockResolvedValue(null)

    const state = {
      script: 'pipeline.py',
      jobId: '12345',
      status: 'pending' as const,
      lastSubmitted: new Date(),
      lastChecked: null,
      output: null
    }
    await fsPromises.mkdir(path.join(tempDir, 'record1'), { recursive: true })
    await fsPromises.writeFile(
      path.join(tempDir, 'record1', '.lrf.script-state.json'),
      JSON.stringify(state)
    )

    const scriptModule = await import('../main/lib/jobTracker')
    await scriptModule.reconcileJobs(tempDir)

    const updated = JSON.parse(
      await fsPromises.readFile(path.join(tempDir, 'record1', '.lrf.script-state.json'), 'utf8')
    )
    expect(updated.status).toBe('failed')
    expect(updated.output).toBeNull()

    mockIsRunning.mockResolvedValue(true)
  })

  it('should keep a running job as pending and update lastChecked', async () => {
    mockIsRunning.mockResolvedValue(true)

    const state = {
      script: 'pipeline.py',
      jobId: '12345',
      status: 'pending' as const,
      lastSubmitted: new Date(),
      lastChecked: null,
      output: null
    }
    await fsPromises.mkdir(path.join(tempDir, 'record1'), { recursive: true })
    await fsPromises.writeFile(
      path.join(tempDir, 'record1', '.lrf.script-state.json'),
      JSON.stringify(state)
    )

    const scriptModule = await import('../main/lib/jobTracker')
    await scriptModule.reconcileJobs(tempDir)

    const updated = JSON.parse(
      await fsPromises.readFile(path.join(tempDir, 'record1', '.lrf.script-state.json'), 'utf8')
    )
    expect(updated.status).toBe('pending')
    expect(updated.lastChecked).not.toBeNull()
  })
})
