<script lang="ts">
  import {
    aggregateMetadataDescriptors,
    countIssues,
    deleteRecord,
    getRepoConfig,
    openRepoRecordDirectory,
    recordDataIsEqual,
    saveRecord,
    setRepoConfig,
    validateRecords,
    getAllRecordsForRepo,
    loadRecordFromRepo,
    statRecord,
    attemptLockRecord,
    attemptUnlockRecord,
    recordExists,
    statRepoConfig,
    attemptLockRepoConfig,
    attemptUnlockRepoConfig,
    validateCreatedRecordIdentifier
  } from '../lib/repo.svelte'
  import {
    Badge,
    Button,
    ButtonGroup,
    Drawer,
    Label,
    Modal,
    PaginationNav,
    Popover,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Tooltip
  } from 'flowbite-svelte'
  import EditRecordData from '../components/EditRecordData.svelte'
  import {
    AdjustmentsVerticalOutline,
    AngleDownOutline,
    AngleUpOutline,
    ArrowLeftOutline,
    ArrowRightOutline,
    ChalkboardUserOutline,
    CheckCircleOutline,
    ClipboardCheckOutline,
    EditOutline,
    ExclamationCircleOutline,
    FileImportOutline,
    FilterOutline,
    FloppyDiskOutline,
    FolderArrowRightOutline,
    PlusOutline,
    RefreshOutline,
    TrashBinOutline
  } from 'flowbite-svelte-icons'
  import { onMount } from 'svelte'
  import ConfigureRepository from '../components/ConfigureRepository.svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import TabularImport from '../components/TabularRecordImport.svelte'
  import { guaranteeConfiguration, openedRepo, trackPromise } from '../lib/state.svelte'
  import {
    MetadataValueType,
    type MetadataDescriptor,
    type PathStatus,
    type lockStatus,
    type RecordMetadata,
    type RepositoryConfiguration,
    type RepositoryRecord,
    type RepositoryRecordFilter
  } from '../../../common/types/models'
  import RecordFilterBuilder from '../components/RecordFilterBuilder.svelte'
  import AddRecord from '../components/AddRecord.svelte'

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
  let recordLocks: Record<string, lockStatus | undefined> = $derived(
    Object.fromEntries(
      displayedRecords.map(({ record }) => [
        record.identifier,
        liveRecordDirStats[record.identifier]
          ? liveRecordDirStats[record.identifier].lockStatus
          : null
      ])
    )
  )
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

  async function addRecord(identifier: string): Promise<void> {
    liveRecords.push({
      identifier: identifier,
      metadata: {},
      files: []
    })
    editingLiveIndex = liveRecords.findLastIndex((record) => record.identifier == identifier) // probably O(1)?
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

  function calcModifiedRecords(
    liveRecords: RepositoryRecord[],
    persistedRecordData: Record<string, RecordMetadata>
  ): SvelteSet<string> {
    let modifiedRecords: SvelteSet<string> = new SvelteSet()
    for (const liveRecord of liveRecords) {
      if (
        !recordDataIsEqual(
          $state.snapshot(liveRecord.metadata),
          $state.snapshot(persistedRecordData[liveRecord.identifier])
        )
      ) {
        modifiedRecords.add(liveRecord.identifier)
      }
    }
    return modifiedRecords
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
    trackPromise('reload records', async (status) => {
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
                // TODO this is rather disorganized, and we should probably do this logic somewhere else.
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

  function recordDirStatsUpdateTick(): void {
    recordStatTimer -= recordStatTickInterval
    if (recordStatTimer <= 0) {
      recordStatTimer = 0
      if (!retrievingRecordStats) {
        updateStats(...displayedRecords.map(({ record }) => record.identifier))
      }
    }
  }

  function filterRecords(
    records: RepositoryRecord[],
    filters: RepositoryRecordFilter[]
  ): {
    record: RepositoryRecord
    liveRecordIndex: number
  }[] {
    return records
      .map((record, index) => ({ record: record, liveRecordIndex: index }))
      .filter(({ record }) => {
        let passed = false
        if (filters.length == 1 && !filters[0]) return true
        for (const filter of filters) {
          if (!filter) {
            continue
          }
          let currentFilterPassed = filter.predicate(
            record.metadata[filter.key] || record[filter.key] || ''
          )
          passed = currentFilterPassed ? true : passed
          if (filter.must && !currentFilterPassed) return false
        }
        return passed || filters.length == 0
      })
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

<div class="px-4 sm:px-1 pt-4">
  <div class="mb-2 mx-1 flex flex-wrap justify-between items-end">
    <div class="mb-2 mx-2">
      <Label>Search/Filter</Label>
      <RecordFilterBuilder
        columns={liveColumns}
        onFilterCreated={addFilterForMetadataKey}
        bind:filter={demoFilter}
      />
      {#if demoFilter}
        <Popover>
          <Badge>{demoFilter.displayName}</Badge>
        </Popover>
      {/if}
    </div>
    <div class="flex flex-wrap items-end">
      <div class="w-fit h-fit mb-2 mx-2">
        <Button id="add-record-button">
          <PlusOutline />
        </Button>
        <Button
          id="import-button"
          onclick={() => {
            importTabularOpen = true
          }}><FileImportOutline /></Button
        >
        <Button
          id="repo-configure-button"
          disabled={liveRepoConfFileStats ? liveRepoConfFileStats.lockStatus != null : true}
          onclick={() => {
            attemptLockRepoConfig(openedRepo.repo.local).then((success) => {
              if (success) {
                editRepoConfigOpen = true
              } else {
                // TODO display error about it being locked
              }
            })
          }}
        >
          <AdjustmentsVerticalOutline />
        </Button>
        <Popover trigger="hover" triggeredBy="#add-record-button" title="Create Record">
          <AddRecord
            {addRecord}
            validateIdentifier={(identifier) =>
              validateCreatedRecordIdentifier(identifier, Object.keys(liveRecordsByIds))}
          />
        </Popover>
        <Tooltip triggeredBy="#import-button">Import data from Tabular</Tooltip>
        <Tooltip triggeredBy="#repo-configure-button">
          {#if liveRepoConfFileStats ? liveRepoConfFileStats.lockStatus != null : true}
            Waiting for {liveRepoConfFileStats.lockStatus.currentUser} to Finish Editing...
          {:else}
            Configure Repository
          {/if}
        </Tooltip>
      </div>
    </div>
  </div>
  <div>
    {#if displayedRecords.length > 5}
      {@render tableNavigation()}
    {/if}
    <Table hoverable={true} border={true} class="table-auto">
      <TableHead class="normal-case">
        <TableHeadCell class="w-fit">
          {#if totalDisplayedIssueCount}
            <ExclamationCircleOutline color="red" />
            <Tooltip
              >Validation failed for {Object.keys(displayedRecordIssueCount).length} (unsaved) records</Tooltip
            >
          {:else if modifiedRecords.size && Object.keys(recordFlushTimers).length}
            <FloppyDiskOutline color="yellow" />
            <Tooltip>{modifiedRecords.size} records still pending saving...</Tooltip>
          {:else}
            <ClipboardCheckOutline color="green" />
            <Tooltip>Everything looks good and is saved!</Tooltip>
          {/if}
        </TableHeadCell>
        <TableHeadCell>Actions</TableHeadCell>
        <TableHeadCell>
          {@render columnHeaderDisplay('identifier', 'Identifier')}
        </TableHeadCell>
        {#each displayedMetadata.filter(({ key }) => key != 'Identifier') as { key } (key)}
          <TableHeadCell>
            {@render columnHeaderDisplay(key, key)}
          </TableHeadCell>
        {/each}
      </TableHead>
      <TableBody>
        {#each displayedRecords as { record: { identifier, metadata }, liveRecordIndex }, index (index)}
          <TableBodyRow class="border-gray-200">
            <TableBodyCell>
              <div class="flex justify-start items-center space-x-2">
                <span>
                  {#if displayedRecordIssueCount[identifier]}
                    <ExclamationCircleOutline color="red" />
                    <Tooltip>
                      {displayedRecordIssueCount[identifier]} issue(s) found with metadata associated
                      with this record. Updates will not be saved until fixed.
                    </Tooltip>
                  {:else if modifiedRecords.has(identifier) && recordFlushTimers[identifier]}
                    <FloppyDiskOutline color="cyan" />
                    <Tooltip>
                      Saving record in {(recordFlushTimers[identifier].delay / 1000).toFixed(0)} seconds...
                    </Tooltip>
                  {:else if recordLocks[identifier]}
                    <ChalkboardUserOutline color="purple" />
                    <Tooltip>
                      The record cannot be modified at this time as {liveRecordDirStats[identifier]
                        .lockStatus.currentUser} is editing this record.
                    </Tooltip>
                  {:else}
                    <CheckCircleOutline class="shrink-0" color="green" />
                    <Tooltip>No issues found and record is saved.</Tooltip>
                  {/if}
                </span>
              </div>
            </TableBodyCell>
            <TableBodyCell>
              <span>
                <ButtonGroup>
                  <Button
                    id={`edit-record-${liveRecordIndex}-btn`}
                    onclick={() => editRecord(liveRecordIndex)}
                    size="xs"
                    class="p-2!"
                    pill
                    outline
                    disabled={recordLocks[identifier] != null}><EditOutline size="xs" /></Button
                  >
                  <Button
                    id={`reload-record-${liveRecordIndex}-btn`}
                    onclick={() => reloadRecord(identifier)}
                    size="xs"
                    pill
                    outline
                    class="p-2!"><RefreshOutline size="xs" /></Button
                  >
                  <Button
                    id={`open-dir-record-${liveRecordIndex}-btn`}
                    onclick={() => openRepoRecordDirectory(openedRepo.repo.local, identifier)}
                    size="xs"
                    pill
                    outline
                    class="p-2!"
                    disabled={recordLocks[identifier] != null}
                  >
                    <FolderArrowRightOutline size="xs" />
                  </Button>
                  <Button
                    id={`delete-record-${liveRecordIndex}-btn`}
                    onclick={() => {
                      removeRecord(liveRecordIndex)
                    }}
                    size="xs"
                    pill
                    outline
                    color="red"
                    disabled={recordLocks[identifier] != null}
                    class="p-2!"><TrashBinOutline size="xs" /></Button
                  >
                </ButtonGroup>
                <Tooltip triggeredBy={`#edit-record-${liveRecordIndex}-btn`}
                  >Edit Record Metadata</Tooltip
                >
                <Tooltip triggeredBy={`#reload-record-${liveRecordIndex}-btn`}
                  >Reload from Disk</Tooltip
                >
                <Tooltip triggeredBy={`#open-dir-record-${liveRecordIndex}-btn`}
                  >Open Record Directory</Tooltip
                >
                <Tooltip triggeredBy={`#delete-record-${liveRecordIndex}-btn`}
                  >Delete Record</Tooltip
                >
              </span>
            </TableBodyCell>
            <TableBodyCell>{identifier}</TableBodyCell>
            {#each displayedMetadata.filter(({ key }) => key != 'Identifier') as { key }, colIndex (colIndex)}
              <TableBodyCell>
                <div class="flex items-center">
                  {#if displayedRecordIssues[identifier][key] && displayedRecordIssues[identifier][key].length}
                    <ExclamationCircleOutline color="red" class="shrink-0" />
                    <Popover>
                      <ul>
                        {#each displayedRecordIssues[identifier][key] as issue (issue)}
                          <li>{issue}</li>
                        {/each}
                      </ul>
                    </Popover>
                  {/if}
                  {metadata[key]}
                </div>
              </TableBodyCell>
            {/each}
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
    {@render tableNavigation()}
  </div>
</div>

{#snippet tableNavigation()}
  <div class="pl-1 mx-auto w-fit my-2">
    <div class="w-fit mb-2 font-light text-sm">
      Displaying {displayedRecords.length} records out of {liveRecords.length}. Showing maximum of
      <input
        class="w-10 text-sm border-0 border-b p-0 m-0 mx-1"
        type="number"
        min="1"
        bind:value={maxPerPage}
      />
      per page. Currently on page {currentPage} of {totalPages}.
    </div>
    <div class="w-fit mx-auto">
      <PaginationNav {currentPage} {totalPages} onPageChange={(page) => (currentPage = page)}>
        {#snippet prevContent()}
          <span class="sr-only">Previous</span>
          <ArrowLeftOutline class="h-5 w-5" />
        {/snippet}
        {#snippet nextContent()}
          <span class="sr-only">Next</span>
          <ArrowRightOutline class="h-5 w-5" />
        {/snippet}
      </PaginationNav>
    </div>
  </div>
{/snippet}

{#snippet columnHeaderDisplay(key: string, displayName: string)}
  <div class="flex items-center">
    <Button
      class="py-1! px-2! m-1 border-0"
      outline
      size="xs"
      onclick={() => {
        if (liveSortingColumns[key] == undefined) liveSortingColumns[key] = true
        else if (liveSortingColumns[key] == true) liveSortingColumns[key] = false
        else if (liveSortingColumns[key] == false) delete liveSortingColumns[key]
      }}
      >{displayName}
      <span class="pl-1">
        {#if liveSortingColumns[key] != undefined}
          {#if liveSortingColumns[key]}
            <AngleUpOutline size="xs" />
          {:else}
            <AngleDownOutline size="xs" />
          {/if}
        {/if}
      </span>
    </Button>
    {#if liveRecordFilters[key] || (demoFilter && demoFilter.key == key)}
      <span class="relative"><FilterOutline color="orange" /> </span>
      <Popover title={`Filter on "${displayName}"`}>
        <div class="space-y-2">
          <div class="mb-3 flex">
            {#each Object.values(liveRecordFilters[key] || {}) as filter (filter.identifier)}
              <Badge class="m-1" dismissable onclose={() => removeFilterForMetadataKey(filter)}
                >{filter.displayName}</Badge
              >
            {:else}
              <span class="font-light text-sm">No filters added!</span>
            {/each}
          </div>
          <div class="flex">
            <Button
              size="xs"
              class="p-1!"
              color="alternative"
              disabled={!liveRecordFilters[key]}
              onclick={() => delete liveRecordFilters[key]}>Clear Filters</Button
            >
          </div>
        </div>
      </Popover>
    {/if}
  </div>
{/snippet}
