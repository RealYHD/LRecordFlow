import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fsPromises from 'fs/promises'
import * as scriptModule from '../main/lib/script'
import * as path from 'path'
import os from 'os'
import fs from 'fs'

const mockExecute = vi.hoisted(() => vi.fn().mockResolvedValue({
  stdout: [],
  stderr: [],
  code: 0,
  signal: 0
}))

vi.mock('../main/lib/shell', () => ({
  SshShellExecutor: class {
    constructor(connectionDetails) {
      this.connectionDetails = connectionDetails
    }
    execute(command) {
      return mockExecute(command)
    }
  }
}))

vi.mock('../main/lib/repo', () => ({
  getRecordMetadata: vi.fn().mockResolvedValue({ sample_id: 'record1' })
}))

describe('parseScriptOutput (main/lib/script)', () => {
  it('should parse JSON dictionary output', async () => {
    const output = scriptModule.parseScriptOutput('{"coverage": "35", "n_contigs": "12"}')
    expect(output).toEqual({ coverage: '35', n_contigs: '12' })
  })

  it('should fall back to key=value parsing', async () => {
    const output = scriptModule.parseScriptOutput('coverage=35\nn_contigs=12')
    expect(output).toEqual({ coverage: '35', n_contigs: '12' })
  })
})

describe('buildScriptCommand (main/lib/script)', () => {
  it('should build a command with substituted parameters', async () => {
    const command = scriptModule.buildScriptCommand(
      'scripts/pipeline.py',
      [{ key: '--sample', value: '{sample_id}' }],
      'cache/output.json',
      { sample_id: 'record1' }
    )

    expect(command).toContain("python3 \"scripts/pipeline.py\" --sample=record1")
    expect(command).toContain('> "cache/output.json"')
  })

  it('should throw when a column value is missing', async () => {
    expect(() =>
      scriptModule.buildScriptCommand(
        'scripts/pipeline.py',
        [{ key: '--sample', value: '{missing}' }],
        'cache/output.json',
        {}
      )
    ).toThrow('Missing column value for placeholder {missing}')
  })
})

describe('applyScriptOutput (main/lib/script)', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lrf-test-'))
  })

  it('should write namespaced output to record metadata', async () => {
    await scriptModule.applyScriptOutput(
      tempDir,
      'record1',
      { coverage: '35' },
      'pipeline.py'
    )

    const statePath = path.join(tempDir, 'record1', '.lrf.script-state.json')
    const content = await fsPromises.readFile(statePath, 'utf8')
    const state = JSON.parse(content)

    expect(state.status).toBe('completed')
    expect(state.output).toEqual({ 'pipeline.py:coverage': '35' })
  })
})

describe('fetchScriptOutput (main/lib/script)', () => {
  it('should fetch output over SSH', async () => {
    mockExecute.mockResolvedValueOnce({
      stdout: ['{"coverage": "35"}'],
      stderr: [],
      code: 0,
      signal: 0
    })

    const output = await scriptModule.fetchScriptOutput(
      { host: 'host', port: 22, username: 'user', privateKeyPath: undefined, password: undefined },
      'record1',
      'pipeline.py'
    )

    expect(output).toEqual({ coverage: '35' })
    expect(mockExecute).toHaveBeenCalledWith('cat ".lrf/scripts/cache/record1_pipeline.py.json"')
  })

  it('should return null when no output exists', async () => {
    mockExecute.mockResolvedValueOnce({
      stdout: [],
      stderr: ['cat: no such file'],
      code: 1,
      signal: 0
    })

    const output = await scriptModule.fetchScriptOutput(
      { host: 'host', port: 22, username: 'user', privateKeyPath: undefined, password: undefined },
      '/repo',
      'record1',
      'pipeline.py'
    )

    expect(output).toBeNull()
  })
})

describe('runScriptOnRecord (main/lib/script)', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lrf-test-'))
  })

  it('should persist pending state when the script is still running', async () => {
    mockExecute.mockResolvedValueOnce({
      stdout: ['12345'],
      stderr: [],
      code: 0,
      signal: 0
    })

    await scriptModule.runScriptOnRecord(
      tempDir,
      'record1',
      { host: 'host', port: 22, username: 'user', privateKeyPath: undefined, password: undefined },
      'scripts/pipeline.py',
      [{ key: '--sample', value: '{sample_id}' }],
      '.lrf/scripts/cache/record1_pipeline.py.json'
    )

    const statePath = path.join(tempDir, 'record1', '.lrf.script-state.json')
    const content = await fsPromises.readFile(statePath, 'utf8')
    const state = JSON.parse(content)

    expect(state.status).toBe('pending')
    expect(state.script).toBe('scripts/pipeline.py')
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('--sample=record1'))
  })

  it('should fail when the script cannot start', async () => {
    mockExecute.mockResolvedValueOnce({
      stdout: [],
      stderr: ['python3: command not found'],
      code: 127,
      signal: 0
    })

    await expect(
      scriptModule.runScriptOnRecord(
        tempDir,
        'record1',
        { host: 'host', port: 22, username: 'user', privateKeyPath: undefined, password: undefined },
        'scripts/pipeline.py',
        [{ key: '--sample', value: '{sample_id}' }],
        '.lrf/scripts/cache/record1_pipeline.py.json'
      )
    ).rejects.toThrow('Script failed to start')

    const statePath = path.join(tempDir, 'record1', '.lrf.script-state.json')
    const content = await fsPromises.readFile(statePath, 'utf8')
    const state = JSON.parse(content)
    expect(state.status).toBe('failed')
  })
})
