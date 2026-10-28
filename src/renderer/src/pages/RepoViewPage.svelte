<script lang="ts">
  import {
    aggregateMetadataDescriptors,
    attemptLockRecord,
    attemptLockRepoConfig,
    attemptUnlockRecord,
    attemptUnlockRepoConfig,
    calcModifiedRecords,
    countIssues,
    deleteRecord,
    filterRecords,
    getAllRecordsForRepo,
    getRepoConfig,
    loadRecordFromRepo,
    openRepoRecordDirectory,
    recordDataIsEqual,
    recordExists,
    saveRecord,
    setRepoConfig,
    statRecord,
    statRepoConfig,
    validateCreatedRecordIdentifier,
    validateRecords
  } from '../lib/repo.svelte'
  import { onMount } from 'svelte'
  import {
    guaranteeConfiguration,
    openedRepo,
    trackedPromises,
    trackPromise
  } from '../lib/state.svelte'
  import {
    MetadataValueType,
    type MetadataDescriptor,
    type PathStatus,
    type RecordMetadata,
    type RepositoryConfiguration,
    type RepositoryRecord,
    type RepositoryRecordFilter,
    type lockStatus
  } from '../../../common/types/models'
  import { SvelteSet } from 'svelte/reactivity'
  import RepoViewToolbar from '../components/RepoViewToolbar.svelte'
  import RepoTableView from '../components/RepoTableView.svelte'
  import EditRecordData from '../components/EditRecordData.svelte'
  import ConfigureRepository from '../components/ConfigureRepository.svelte'
  import TabularImport from '../components/TabularRecordImport.svelte'
  import { Modal, Drawer } from 'flowbite-svelte'

  const RECORD_RELOAD_PROMISE_ID = 'reload records'

  let liveRepoConfiguration: RepositoryConfiguration = $state({
    defined: [],
    exactKeys: false
  })
  let liveRecords: RepositoryRecord[] = $state([])
  let liveMetadataDescriptors: MetadataDescriptor[] = $derived(
    aggregateMetadataDescriptors(liveRecords, liveRepoConfiguration)
  )
  let liveColumns: { displayName: string; key: string; valueType: MetadataValueType }[] = $derived([
    { displayName: 'Identifier', key: 'identifier', valueType: MetadataValueType.Text },
    ...liveMetadataDescriptors.map((value) => ({
      displayName: value.key,
      key: value.key,
      valueType: value.value.valueType
    }))
  ])
  let liveRecordsByIds: Record<string, RepositoryRecord> = $derived(
    Object.fromEntries(liveRecords.map((recordData) => [recordData.identifier, recordData]))
  )

  let flushIntervalTimerId = -1
  let recordLockUpdateTimerId = -1
  const recordFlushTickInterval = 1000
  const recordFlushInterval = 5 * recordFlushTickInterval
  const recordStatTickInterval = 250
  const recordStatInterval = 0.5 * recordStatTickInterval
  let recordStatTimer = $state(recordStatInterval)
  let retrievingRecordStats = $state(false)
  const liveRecordDirStats: Record<string, PathStatus> = $state({})
  let liveRepoConfFileStats: PathStatus = $state(undefined)
  const persistedRecordMetadata: Record<string, RecordMetadata> = $state({})
  const modifiedRecords: SvelteSet<string> = $derived(
    calcModifiedRecords(liveRecords, persistedRecordMetadata)
  )
  const recordFlushTimers: Record<
    string,
    { delay: number; flushing: boolean; snapshot: RecordMetadata }
  > = $state({})
  let demoFilter: RepositoryRecordFilter = $state(undefined)
  let liveRecordFilters: Record<string, Record<string, RepositoryRecordFilter>> = $state({})
  let liveRecordFiltersList: RepositoryRecordFilter[] = $derived(
    Object.values(liveRecordFilters).flatMap((val) => Object.values(val))
  )
  let liveSortingColumns: Record<string, boolean> = $state({})
  let maxPerPage: number = $state(25)
  let currentPage: number = $state(1)
  let totalPages: number = $derived(Math.ceil(liveRecords.length / maxPerPage))
  let filteredRecords: { record: RepositoryRecord; liveRecordIndex: number }[] = $derived(
    filterRecords(liveRecords, [...liveRecordFiltersList, demoFilter])
  )
  let sortedRecords: { record: RepositoryRecord; liveRecordIndex: number }[] = $derived.by(() => {
    let orderedRecords = filteredRecords
    for (const columnName in liveSortingColumns) {
      let ascending = liveSortingColumns[columnName]
      orderedRecords = orderedRecords.toSorted((a, b) => {
        let valueA = a.record.metadata[columnName] || a.record[columnName]
        let valueB = b.record.metadata[columnName] || b.record[columnName]
        let configuredMetadataDesc = liveRepoConfiguration.defined.find(
          (desc) => desc.key == columnName
        )
        try {
          switch (configuredMetadataDesc.value.valueType) {
            case MetadataValueType.Date:
              return Date.parse(valueA) - Date.parse(valueB)
            case MetadataValueType.Number:
              return Number(valueA) - Number(valueB)
            default:
              if (valueA == valueB) return 0
              return (valueA > valueB ? 1 : -1) * (ascending ? 1 : -1)
          }
        } catch {
          if (valueA == valueB) return 0
          return (valueA > valueB ? 1 : -1) * (ascending ? 1 : -1)
        }
      })
    }
    return orderedRecords
  })
  let displayedRecords: { record: RepositoryRecord; liveRecordIndex: number }[] = $derived(
    sortedRecords.slice((currentPage - 1) * maxPerPage, currentPage * maxPerPage)
  )
  const displayedMetadata: MetadataDescriptor[] = $derived(liveMetadataDescriptors)
  let displayedRecordIssues: Record<string, Record<string, string[]>> = $derived(
    validateRecords(
      displayedRecords.map(({ record }) => record),
      displayedMetadata
    )
  )
  const displayedRecordIssueCount: Record<string, number> = $derived(
    countIssues(displayedRecordIssues)
  )
  let totalDisplayedIssueCount: number = $derived(
    Object.values(displayedRecordIssueCount).reduce((total, current) => total + current, 0)
  )
  let editRecordDataOpen: boolean = $state(false)
  let editingLiveIndex: number = $state(0)
  let editRepoConfigOpen: boolean = $state(false)
  let importTabularOpen = $state(false)
  let loadingRecords = $derived(
    trackedPromises.values().find((desc) => desc.id.startsWith('load record')) !== undefined
  )

  // Computed row data for the table component
  let rows: {
    record: RepositoryRecord
    liveRecordIndex: number
    localRepoPath: string
    lockStatus: lockStatus | null | undefined
    issues: Record<string, string[]>
    modified: boolean
    flushTimer: { delay: number; flushing: boolean } | undefined
  }[] = $derived(
    displayedRecords.map(({ record, liveRecordIndex }) => ({
      record: record,
      liveRecordIndex: liveRecordIndex,
      localRepoPath: openedRepo.repo.local,
      lockStatus: liveRecordDirStats[record.identifier]
        ? liveRecordDirStats[record.identifier].lockStatus
        : null,
      issues: displayedRecordIssues[record.identifier] || {},
      modified: modifiedRecords.has(record.identifier),
      flushTimer: recordFlushTimers[record.identifier]
    }))
  )

  let displayCount: number = $derived(displayedRecords.length)
  let hasFlushTimers: boolean = $derived(Object.keys(recordFlushTimers).length > 0)

  function sortColumn(key: string): void {
    if (liveSortingColumns[key] == undefined) liveSortingColumns[key] = true
    else if (liveSortingColumns[key] == true) liveSortingColumns[key] = false
    else if (liveSortingColumns[key] == false) delete liveSortingColumns[key]
  }

  async function addRecord(identifier: string): Promise<void> {
    liveRecords.push({
      identifier: identifier,
      metadata: {},
      files: []
    })
    editingLiveIndex = liveRecords.findLastIndex((record) => record.identifier == identifier)
    editRecord(editingLiveIndex)
    editRecordDataOpen = true
  }

  function editRecord(editRecordIndex: number): void {
    editingLiveIndex = editRecordIndex
    let recordIdentifier = liveRecords[editRecordIndex].identifier
    attemptLockRecord(openedRepo.repo.local, recordIdentifier).then((success) => {
      if (success) {
        editRecordDataOpen = true
      } else {
        // TODO display error message :)
      }
    })
  }

  function removeRecord(deleteRecordIndex: number): void {
    const recordIdentifier = liveRecords[deleteRecordIndex].identifier
    deleteRecord(openedRepo.repo.local, recordIdentifier).then(() => {
      liveRecords.splice(deleteRecordIndex, 1)
      delete persistedRecordMetadata[recordIdentifier]
    })
  }

  function flushRecord(recordIdentifier: string): void {
    let modifiedRecord = liveRecordsByIds[recordIdentifier]
    saveRecord(
      openedRepo.repo.local,
      modifiedRecord.identifier,
      $state.snapshot(modifiedRecord.metadata)
    ).then(() => {
      delete recordFlushTimers[modifiedRecord.identifier]
      modifiedRecords.delete(modifiedRecord.identifier)
      persistedRecordMetadata[modifiedRecord.identifier] = $state.snapshot(modifiedRecord.metadata)
      if (
        !editRecordDataOpen ||
        liveRecords[editingLiveIndex].identifier != modifiedRecord.identifier
      ) {
        attemptUnlockRecord(openedRepo.repo.local, recordIdentifier).then((success) => {
          if (success) {
            liveRecordDirStats[recordIdentifier].lockStatus = null
          }
        })
      }
    })
  }

  function flushAllModifiedRecords(): void {
    for (const modifiedRecordId of modifiedRecords) {
      if (displayedRecordIssueCount[modifiedRecordId]) continue
      flushRecord(modifiedRecordId)
    }
  }

  function reloadAllRecords(): void {
    flushAllModifiedRecords()
    getAllRecordsForRepo(openedRepo.repo.local).then((identifiers) => {
      reloadRecord(...identifiers)
    })
  }
  function reloadRecord(...identifiers: string[]): void {
    trackPromise(RECORD_RELOAD_PROMISE_ID, async (status) => {
      status.title = 'Loading Records'
      status.description = 'Loading Records'
      let recordsLoaded = 0
      for (const identifier of identifiers) {
        loadRecordFromRepo(openedRepo.repo.local, identifier).then((record) => {
          if (liveRecordsByIds[identifier]) {
            Object.assign(liveRecordsByIds[identifier], record)
          } else {
            liveRecords.push(record)
          }
          persistedRecordMetadata[identifier] = record.metadata
          recordsLoaded += 1
          status.progress = recordsLoaded / identifiers.length
        })
      }
    })
  }

  function reloadRepoConfiguration(): void {
    getRepoConfig(openedRepo.repo.local).then((loadedConfig) => {
      Object.assign(liveRepoConfiguration, loadedConfig)
    })
  }

  function importTabular(
    importedIdentifiers: string[],
    metadataDescriptors: MetadataDescriptor[]
  ): void {
    importTabularOpen = false
    for (const descriptor of metadataDescriptors) {
      let matchingRepoConfigDesc = liveRepoConfiguration.defined.find(
        (configDesc) => configDesc.key == descriptor.key
      )
      if (matchingRepoConfigDesc) {
        Object.assign(matchingRepoConfigDesc, descriptor)
      } else {
        liveRepoConfiguration.defined.push(descriptor)
      }
    }
    reloadRecord(...importedIdentifiers)
  }

  function recordFlushTick(): void {
    for (const modifiedRecordId in recordFlushTimers) {
      if (!modifiedRecords.has(modifiedRecordId)) {
        delete recordFlushTimers[modifiedRecordId]
      }
    }
    for (const modifiedRecordId of modifiedRecords) {
      if (displayedRecordIssueCount[modifiedRecordId]) continue
      if (recordFlushTimers[modifiedRecordId]) {
        if (
          !recordDataIsEqual(
            $state.snapshot(liveRecordsByIds[modifiedRecordId].metadata),
            recordFlushTimers[modifiedRecordId].snapshot
          )
        ) {
          recordFlushTimers[modifiedRecordId].delay = recordFlushInterval
          recordFlushTimers[modifiedRecordId].snapshot = $state.snapshot(
            liveRecordsByIds[modifiedRecordId].metadata
          )
          recordFlushTimers[modifiedRecordId].flushing = false
        } else if (
          recordFlushTimers[modifiedRecordId].delay <= 0 &&
          !recordFlushTimers[modifiedRecordId].flushing
        ) {
          recordFlushTimers[modifiedRecordId].flushing = true
          flushRecord(modifiedRecordId)
        } else {
          recordFlushTimers[modifiedRecordId].delay -= recordFlushTickInterval
          if (recordFlushTimers[modifiedRecordId].delay <= 0)
            recordFlushTimers[modifiedRecordId].delay = 0
        }
      } else {
        recordFlushTimers[modifiedRecordId] = {
          delay: recordFlushInterval,
          snapshot: $state.snapshot(liveRecordsByIds[modifiedRecordId].metadata),
          flushing: false
        }
      }
    }
  }

  function updateStats(...identifiers: string[]): void {
    retrievingRecordStats = true
    const promises = []
    for (const identifier of identifiers) {
      recordExists(openedRepo.repo.local, identifier).then((recordExists) => {
        if (recordExists) {
          promises.push(
            statRecord(openedRepo.repo.local, identifier).then((recordDirStat) => {
              if (recordDirStat.lastModified == null) {
                let liveRecordIndex = liveRecords.findIndex(
                  (value) => value.identifier == identifier
                )
                if (liveRecordIndex >= 0) {
                  removeRecord(liveRecordIndex)
                }
                return // It was deleted
              }
              if (
                (liveRecordDirStats[identifier] &&
                  liveRecordDirStats[identifier].lastModified < recordDirStat.lastModified) ||
                !liveRecordDirStats[identifier]
              ) {
                reloadRecord(identifier)
              }
              liveRecordDirStats[identifier] = recordDirStat
            })
          )
        }
      })
    }
    promises.push(
      statRepoConfig(openedRepo.repo.local).then((stat) => {
        liveRepoConfFileStats = stat
      })
    )
    Promise.all(promises).then(() => {
      retrievingRecordStats = false
      recordStatTimer = recordStatInterval
    })
  }

  function addFilterForMetadataKey(filter: RepositoryRecordFilter): void {
    if (!liveRecordFilters[filter.key]) liveRecordFilters[filter.key] = {}
    liveRecordFilters[filter.key][filter.identifier] = filter
  }

  function removeFilterForMetadataKey(filter: RepositoryRecordFilter): void {
    if (!liveRecordFilters[filter.key]) return
    delete liveRecordFilters[filter.key][filter.identifier]
    if (Object.entries(liveRecordFilters[filter.key]).length == 0) {
      delete liveRecordFilters[filter.key]
    }
  }

  function clearFilters(key: string): void {
    delete liveRecordFilters[key]
  }

  function recordDirStatsUpdateTick(): void {
    recordStatTimer -= recordStatTickInterval
    if (recordStatTimer <= 0) {
      recordStatTimer = 0
      if (!retrievingRecordStats) {
        updateStats(...displayedRecords.map(({ record }) => record.identifier))
      }
    }
  }

  onMount(() => {
    guaranteeConfiguration().then(() => {
      reloadRepoConfiguration()
      reloadAllRecords()
    })
    flushIntervalTimerId = window.setInterval(recordFlushTick, recordFlushTickInterval)
    recordLockUpdateTimerId = window.setInterval(recordDirStatsUpdateTick, recordStatInterval)
  })

  function onWindowUnload(): void {
    flushAllModifiedRecords()
    window.clearInterval(flushIntervalTimerId)
    window.clearInterval(recordLockUpdateTimerId)
  }

  // Import and config callbacks
  function openImportTabular(): void {
    importTabularOpen = true
  }

  function openConfigureRepo(): void {
    attemptLockRepoConfig(openedRepo.repo.local).then((success) => {
      if (success) {
        editRepoConfigOpen = true
      } else {
        // TODO display error about it being locked
      }
    })
  }

  function validateRepoIdentifier(identifier: string): string[] {
    return validateCreatedRecordIdentifier(identifier, Object.keys(liveRecordsByIds))
  }

  let repoConfLockStatus: lockStatus | null | undefined = $derived(
    liveRepoConfFileStats?.lockStatus
  )
</script>

<svelte:window onbeforeunload={onWindowUnload} />

<Modal bind:open={importTabularOpen}>
  <TabularImport
    definedMetadataDescriptors={liveRepoConfiguration.defined}
    currentRecordsById={liveRecordsByIds}
    RecordImportCallback={importTabular}
  />
</Modal>

<Drawer
  bind:open={editRepoConfigOpen}
  placement="right"
  onclose={() => {
    setRepoConfig(openedRepo.repo.local, $state.snapshot(liveRepoConfiguration))
    attemptUnlockRepoConfig(openedRepo.repo.local)
  }}
>
  <ConfigureRepository bind:repoConfig={liveRepoConfiguration} />
</Drawer>

<Drawer
  bind:open={editRecordDataOpen}
  placement="right"
  onclose={() => {
    let recordId = liveRecords[editingLiveIndex].identifier
    if (!modifiedRecords.has(liveRecords[editingLiveIndex].identifier)) {
      attemptUnlockRecord(openedRepo.repo.local, recordId).then((success) => {
        if (success) {
          liveRecordDirStats[recordId].lockStatus = null
        }
      })
    }
  }}
>
  <EditRecordData
    metadataDescriptors={liveMetadataDescriptors}
    bind:liveRecords
    bind:liveIssues={displayedRecordIssues}
    bind:editRecordIndex={editingLiveIndex}
    refreshRecordFn={reloadRecord}
  />
</Drawer>

<div class="flex-1 flex shrink flex-col overflow-y-auto">
  <RepoViewToolbar
    columns={liveColumns}
    onFilterCreated={addFilterForMetadataKey}
    bind:filter={demoFilter}
    onImportTabular={openImportTabular}
    onConfigure={openConfigureRepo}
    {addRecord}
    validateIdentifier={validateRepoIdentifier}
    {repoConfLockStatus}
  />
  <RepoTableView
    columns={liveColumns}
    {rows}
    sorting={liveSortingColumns}
    filters={liveRecordFilters}
    {demoFilter}
    {loadingRecords}
    totalIssueCount={totalDisplayedIssueCount}
    modifiedCount={modifiedRecords.size}
    {hasFlushTimers}
    {currentPage}
    {totalPages}
    {maxPerPage}
    onPageChange={(page) => (currentPage = page)}
    onMaxPerPageChange={(value) => (maxPerPage = value)}
    {displayCount}
    totalRecords={liveRecords.length}
    localRepoPath={openedRepo.repo.local}
    onSort={sortColumn}
    onRemoveFilter={removeFilterForMetadataKey}
    onClearFilters={clearFilters}
    onEdit={editRecord}
    onReload={reloadRecord}
    onOpenDir={openRepoRecordDirectory}
    onDelete={removeRecord}
  />
</div>
