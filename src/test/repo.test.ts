import { describe, it, expect } from 'vitest'
import {
  recordDataIsEqual,
  aggregateMetadataDescriptors,
  calcModifiedRecords,
  filterRecords,
  recordFiltersEqual
} from '../renderer/src/lib/repo.svelte'
import {
  MetadataValueType,
  type RepositoryRecord,
  type RecordMetadata,
  type RepositoryRecordFilter
} from '../common/types/models'

describe('recordDataIsEqual', () => {
  it('returns true for identical records', () => {
    const a: RecordMetadata = { name: 'Alice', age: '30' }
    const b: RecordMetadata = { name: 'Alice', age: '30' }
    expect(recordDataIsEqual(a, b)).toBe(true)
  })

  it('returns false for different records', () => {
    const a: RecordMetadata = { name: 'Alice', age: '30' }
    const b: RecordMetadata = { name: 'Bob', age: '30' }
    expect(recordDataIsEqual(a, b)).toBe(false)
  })

  it('handles different key orderings (sorted comparison)', () => {
    const a: RecordMetadata = { name: 'Alice', age: '30', city: 'Toronto' }
    const b: RecordMetadata = { city: 'Toronto', name: 'Alice', age: '30' }
    expect(recordDataIsEqual(a, b)).toBe(true)
  })

  it('returns false when one is null', () => {
    const a: RecordMetadata = { name: 'Alice' }
    expect(recordDataIsEqual(a, null as unknown as RecordMetadata)).toBe(false)
  })

  it('returns true for two nulls', () => {
    expect(
      recordDataIsEqual(null as unknown as RecordMetadata, null as unknown as RecordMetadata)
    ).toBe(true)
  })

  it('returns true for same reference', () => {
    const a: RecordMetadata = { name: 'Alice' }
    expect(recordDataIsEqual(a, a)).toBe(true)
  })
})

describe('aggregateMetadataDescriptors', () => {
  function makeRecord(identifier: string, metadata: RecordMetadata): RepositoryRecord {
    return { identifier, metadata, files: [] }
  }

  const config: RepositoryConfiguration = {
    defined: [
      {
        key: 'Identifier',
        value: { valueType: MetadataValueType.Text, options: [] },
        required: true
      },
      { key: 'Name', value: { valueType: MetadataValueType.Text, options: [] }, required: false }
    ],
    exactKeys: false
  }

  it('includes defined descriptors (except Identifier)', () => {
    const records: RepositoryRecord[] = []
    const descriptors = aggregateMetadataDescriptors(records, config)
    const keys = descriptors.map((d) => d.key)
    expect(keys).toContain('Name')
    expect(keys).not.toContain('Identifier')
  })

  it('adds new keys from records', () => {
    const records: RepositoryRecord[] = [
      makeRecord('r1', { Name: 'Alice', Department: 'Engineering' })
    ]
    const descriptors = aggregateMetadataDescriptors(records, config)
    const keys = descriptors.map((d) => d.key)
    expect(keys).toContain('Name')
    expect(keys).toContain('Department')
  })

  it('does not duplicate keys', () => {
    const records: RepositoryRecord[] = [
      makeRecord('r1', { Name: 'Alice', Department: 'Engineering' }),
      makeRecord('r2', { Name: 'Bob', Department: 'Engineering' })
    ]
    const descriptors = aggregateMetadataDescriptors(records, config)
    const keys = descriptors.map((d) => d.key)
    expect(keys.filter((k) => k === 'Department').length).toBe(1)
    expect(keys.filter((k) => k === 'Name').length).toBe(1)
  })
})

describe('calcModifiedRecords', () => {
  function makeRecord(identifier: string, metadata: RecordMetadata): RepositoryRecord {
    return { identifier, metadata, files: [] }
  }

  it('returns empty set when no records are modified', () => {
    const records: RepositoryRecord[] = [
      makeRecord('r1', { Name: 'Alice' }),
      makeRecord('r2', { Name: 'Bob' })
    ]
    const persisted: Record<string, RecordMetadata> = {
      r1: { Name: 'Alice' },
      r2: { Name: 'Bob' }
    }
    const modified = calcModifiedRecords(records, persisted)
    expect(modified.size).toBe(0)
    expect(modified.has('r1')).toBe(false)
    expect(modified.has('r2')).toBe(false)
  })

  it('detects modified records', () => {
    const records: RepositoryRecord[] = [
      makeRecord('r1', { Name: 'Alice', Age: '31' }), // changed
      makeRecord('r2', { Name: 'Bob' }) // unchanged
    ]
    const persisted: Record<string, RecordMetadata> = {
      r1: { Name: 'Alice', Age: '30' },
      r2: { Name: 'Bob' }
    }
    const modified = calcModifiedRecords(records, persisted)
    expect(modified.size).toBe(1)
    expect(modified.has('r1')).toBe(true)
    expect(modified.has('r2')).toBe(false)
  })

  it('detects added records (not in persisted)', () => {
    const records: RepositoryRecord[] = [makeRecord('r1', { Name: 'Alice' })]
    const persisted: Record<string, RecordMetadata> = {}
    const modified = calcModifiedRecords(records, persisted)
    expect(modified.size).toBe(1)
    expect(modified.has('r1')).toBe(true)
  })
})

describe('filterRecords', () => {
  function makeRecord(identifier: string, metadata: RecordMetadata): RepositoryRecord {
    return { identifier, metadata, files: [] }
  }

  const records: RepositoryRecord[] = [
    makeRecord('r1', { Name: 'Alice', Department: 'Engineering' }),
    makeRecord('r2', { Name: 'Bob', Department: 'Sales' }),
    makeRecord('r3', { Name: 'Carol', Department: 'Engineering' })
  ]

  const nameFilter: RepositoryRecordFilter = {
    key: 'Name',
    displayName: 'Name',
    predicate: (value: string) => value.includes('A'),
    must: false,
    identifier: 'f1'
  }

  const deptFilter: RepositoryRecordFilter = {
    key: 'Department',
    displayName: 'Department',
    predicate: (value: string) => value === 'Engineering',
    must: true,
    identifier: 'f2'
  }

  it('returns all records when no filters', () => {
    const result = filterRecords(records, [])
    expect(result.length).toBe(3)
  })

  it('applies OR logic for must=false filters', () => {
    const result = filterRecords(records, [nameFilter])
    expect(result.length).toBe(1) // only Alice
    expect(result[0].record.identifier).toBe('r1')
  })

  it('applies AND logic for must=true filters', () => {
    const result = filterRecords(records, [deptFilter])
    expect(result.length).toBe(2) // Engineering
    expect(result.every((r) => r.record.metadata.Department === 'Engineering')).toBe(true)
  })

  it('applies must=false as OR and must=true as AND combined', () => {
    const result = filterRecords(records, [nameFilter, deptFilter])
    // Alice (Engineering + name contains A) and Carol (Engineering + name contains A) pass
    expect(result.length).toBe(2)
    const identifiers = result.map((r) => r.record.identifier).sort()
    expect(identifiers).toEqual(['r1', 'r3'])
  })

  it('handles single null filter', () => {
    const result = filterRecords(records, [null as unknown as RecordMetadata])
    expect(result.length).toBe(3)
  })

  it('uses record[key] fallback when metadata key missing', () => {
    const deptFilter2: RepositoryRecordFilter = {
      key: 'Department',
      displayName: 'Department',
      predicate: (value: string) => value === 'Sales',
      must: true,
      identifier: 'f3'
    }
    const result = filterRecords(records, [deptFilter2])
    expect(result.length).toBe(1)
    expect(result[0].record.identifier).toBe('r2')
  })
})

describe('recordFiltersEqual', () => {
  const f1: RepositoryRecordFilter = {
    key: 'Name',
    displayName: 'Name',
    predicate: () => true,
    must: false,
    identifier: 'abc'
  }
  const f2: RepositoryRecordFilter = {
    key: 'Name',
    displayName: 'Name',
    predicate: () => false,
    must: true,
    identifier: 'abc'
  }

  it('returns true for same identifier', () => {
    expect(recordFiltersEqual(f1, f2)).toBe(true)
  })

  it('returns false for different identifiers', () => {
    const f3: RepositoryRecordFilter = { ...f1, identifier: 'def' }
    expect(recordFiltersEqual(f1, f3)).toBe(false)
  })

  it('returns true for two nulls', () => {
    expect(
      recordFiltersEqual(null as unknown as RecordMetadata, null as unknown as RecordMetadata)
    ).toBe(true)
  })

  it('returns false for one null', () => {
    expect(recordFiltersEqual(f1, null as unknown as RecordMetadata)).toBe(false)
  })
})
