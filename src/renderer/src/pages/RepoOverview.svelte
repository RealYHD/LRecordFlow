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
    validateRecordIdentifier,
    validateRecords,
    getAllRecordsForRepo,
    loadRecordFromRepo,
    getRecordDirStats,
    attemptLockRecord,
    attemptUnlockRecord,
    recordExists
  } from '../lib/repo.svelte'
  import {
    Badge,
    Button,
    ButtonGroup,
    Drawer,
    Input,
    Label,
    Modal,
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
    ChalkboardUserOutline,
    CheckCircleOutline,
    ClipboardCheckOutline,
    DotsVerticalOutline,
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
  import { appStateStore, loadAppState } from '../lib/state.svelte'
  import {
    MetadataValueType,
    type MetadataDescriptor,
    type RecordDirStatus,
    type RecordLockStatus,
    type RecordMetadata,
    type RepositoryConfiguration,
    type RepositoryRecord,
    type RepositoryRecordFilter
  } from '../../../common/types/models'
  import RecordFilterBuilder from '../components/RecordFilterBuilder.svelte'

  let liveRepoConfiguration: RepositoryConfiguration = $state({
    defined: [],
    exactKeys: false
  })
  let liveRepoRecords: RepositoryRecord[] = $state([])
  let liveMetadataDescriptors: MetadataDescriptor[] = $derived(
    aggregateMetadataDescriptors(liveRepoRecords, liveRepoConfiguration)
  )
  let liveColumns: { displayName: string; key: string; valueType: MetadataValueType }[] = $derived([
    { displayName: 'Identifier', key: 'identifier', valueType: MetadataValueType.Text },
    ...liveMetadataDescriptors.map((value) => ({
      displayName: value.key,
      key: value.key,
      valueType: value.value.valueType
    }))
  ])
  let liveRepoRecordsById: Record<string, RepositoryRecord> = $derived(
    Object.fromEntries(liveRepoRecords.map((recordData) => [recordData.identifier, recordData]))
  )

  let flushIntervalTimerId = -1
  let recordLockUpdateTimerId = -1
  const recordFlushTickInterval = 1000
  const recordFlushInterval = 5 * recordFlushTickInterval
  const recordStatTickInterval = 250
  const recordStatInterval = 0.5 * recordStatTickInterval
  let recordStatTimer = $state(recordStatInterval)
  let retrievingRecordStats = $state(false)
  const liveRecordStats: Record<string, RecordDirStatus> = $state({})
  const persistedRecordMetadata: Record<string, RecordMetadata> = $state({})
  const modifiedRecords: SvelteSet<string> = $derived(
    calcModifiedRecords(liveRepoRecords, persistedRecordMetadata)
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
  let filteredRecords: { record: RepositoryRecord; index: number }[] = $derived(
    filterRecords(liveRepoRecords, [...liveRecordFiltersList, demoFilter])
  )
  let sortedRecords: { record: RepositoryRecord; index: number }[] = $derived(filteredRecords)
  let displayedRecords: { record: RepositoryRecord; index: number }[] = $derived(sortedRecords)
  const displayedMetadata: MetadataDescriptor[] = $derived(liveMetadataDescriptors)
  let recordLocks: Record<string, RecordLockStatus | undefined> = $derived(
    Object.fromEntries(
      displayedRecords.map(({ record }) => [
        record.identifier,
        liveRecordStats[record.identifier] ? liveRecordStats[record.identifier].lockStatus : null
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

  let createRecordIdentifier = $state('')
  let createRecordIdentifierError = $derived(
    validateRecordIdentifier(createRecordIdentifier, Object.keys(liveRepoRecordsById))
  )
  let createPending: boolean = $state(false)
  let createDisabled: boolean = $derived(createRecordIdentifierError.length > 0 || createPending)

  function addRecord(): void {
    const identifier = $state.snapshot(createRecordIdentifier)
    liveRepoRecords.push({
      identifier: identifier,
      metadata: {},
      files: []
    })
    editingLiveIndex = liveRepoRecords.findLastIndex(
      (record) => record.identifier == createRecordIdentifier
    ) // probably O(1)?
    editRecord(editingLiveIndex)
    editRecordDataOpen = true
    createRecordIdentifier = ''
  }

  function editRecord(editRecordIndex: number): void {
    editingLiveIndex = editRecordIndex
    let recordIdentifier = liveRepoRecords[editRecordIndex].identifier
    attemptLockRecord(appStateStore.state.openedRepoPath, recordIdentifier).then((success) => {
      if (success) {
        editRecordDataOpen = true
      } else {
        // TODO display error message :)
      }
    })
  }

  function removeRecord(deleteRecordIndex: number): void {
    const recordIdentifier = liveRepoRecords[deleteRecordIndex].identifier
    deleteRecord(appStateStore.state.openedRepoPath, recordIdentifier).then(() => {
      liveRepoRecords.splice(deleteRecordIndex, 1)
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
    let modifiedRecord = liveRepoRecordsById[recordIdentifier]
    saveRecord(
      appStateStore.state.openedRepoPath,
      modifiedRecord.identifier,
      $state.snapshot(modifiedRecord.metadata)
    ).then(() => {
      delete recordFlushTimers[modifiedRecord.identifier]
      modifiedRecords.delete(modifiedRecord.identifier)
      persistedRecordMetadata[modifiedRecord.identifier] = $state.snapshot(modifiedRecord.metadata)
      if (
        !editRecordDataOpen ||
        liveRepoRecords[editingLiveIndex].identifier != modifiedRecord.identifier
      ) {
        attemptUnlockRecord(appStateStore.state.openedRepoPath, recordIdentifier).then(
          (success) => {
            if (success) {
              liveRecordStats[recordIdentifier].lockStatus = null
            }
          }
        )
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
    getAllRecordsForRepo(appStateStore.state.openedRepoPath).then((identifiers) => {
      reloadRecord(...identifiers)
    })
  }

  function reloadRecord(...identifiers: string[]): void {
    for (const identifier of identifiers) {
      loadRecordFromRepo(appStateStore.state.openedRepoPath, identifier).then((record) => {
        if (liveRepoRecordsById[identifier]) {
          Object.assign(liveRepoRecordsById[identifier], record)
        } else {
          liveRepoRecords.push(record)
        }
        persistedRecordMetadata[identifier] = record.metadata
      })
    }
  }

  function reloadRepoConfiguration(): void {
    liveRepoConfiguration.defined = []
    liveRepoConfiguration.exactKeys = false
    getRepoConfig(appStateStore.state.openedRepoPath).then((loadedConfig) => {
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
            $state.snapshot(liveRepoRecordsById[modifiedRecordId].metadata),
            recordFlushTimers[modifiedRecordId].snapshot
          )
        ) {
          recordFlushTimers[modifiedRecordId].delay = recordFlushInterval
          recordFlushTimers[modifiedRecordId].snapshot = $state.snapshot(
            liveRepoRecordsById[modifiedRecordId].metadata
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
          snapshot: $state.snapshot(liveRepoRecordsById[modifiedRecordId].metadata),
          flushing: false
        }
      }
    }
  }

  function updateRecordDirStats(...identifiers: string[]): void {
    retrievingRecordStats = true
    const promises = []
    for (const identifier of identifiers) {
      recordExists(appStateStore.state.openedRepoPath, identifier).then((recordExists) => {
        if (recordExists) {
          promises.push(
            getRecordDirStats(appStateStore.state.openedRepoPath, identifier).then(
              (recordDirStat) => {
                if (
                  (liveRecordStats[identifier] &&
                    liveRecordStats[identifier].lastModified < recordDirStat.lastModified) ||
                  !liveRecordStats[identifier]
                ) {
                  // TODO this is rather disorganized, and we should probably do this logic somewhere else.
                  reloadRecord(identifier)
                }
                liveRecordStats[identifier] = recordDirStat
              }
            )
          )
        }
      })
    }
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
        updateRecordDirStats(...displayedRecords.map(({ record }) => record.identifier))
      }
    }
  }

  function filterRecords(
    records: RepositoryRecord[],
    filters: RepositoryRecordFilter[]
  ): {
    record: RepositoryRecord
    index: number
  }[] {
    return records
      .map((record, index) => ({ record: record, index: index }))
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
    loadAppState().then(() => {
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
    currentRecordsById={liveRepoRecordsById}
    RecordImportCallback={importTabular}
  />
</Modal>

<Drawer
  bind:open={editRepoConfigOpen}
  placement="right"
  onclose={() => {
    setRepoConfig(appStateStore.state.openedRepoPath, $state.snapshot(liveRepoConfiguration))
  }}
>
  <ConfigureRepository bind:repoConfig={liveRepoConfiguration} />
</Drawer>

<Drawer
  bind:open={editRecordDataOpen}
  placement="right"
  onclose={() => {
    let recordId = liveRepoRecords[editingLiveIndex].identifier
    if (!modifiedRecords.has(liveRepoRecords[editingLiveIndex].identifier)) {
      attemptUnlockRecord(appStateStore.state.openedRepoPath, recordId).then((success) => {
        if (success) {
          liveRecordStats[recordId].lockStatus = null
        }
      })
    }
  }}
>
  <EditRecordData
    metadataDescriptors={liveMetadataDescriptors}
    bind:liveRecords={liveRepoRecords}
    bind:liveIssues={displayedRecordIssues}
    bind:editRecordIndex={editingLiveIndex}
    refreshRecordFn={reloadRecord}
  />
</Drawer>

<div class="w-full h-full px-4 sm:px-1 pt-4">
  <div class="mb-2 mx-1 flex flex-wrap justify-end items-end">
    <div class="w-fit h-fit mb-2 mx-2">
      <Label>Filter Configuration</Label>
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
    <div class="w-fit h-fit mb-2 mx-2">
      <Label>Add Record</Label>
      <ButtonGroup>
        <Input type="text" placeholder="Identifier" bind:value={createRecordIdentifier} />
        <Button onclick={() => addRecord()} disabled={createDisabled}><PlusOutline /></Button>
      </ButtonGroup>
    </div>
    <div class="w-fit h-fit mb-2 mx-2">
      <Label>Other Operations</Label>
      <ButtonGroup>
        <Button
          id="import-button"
          onclick={() => {
            importTabularOpen = true
          }}><FileImportOutline /></Button
        >
        <Button
          id="repo-configure-button"
          onclick={() => {
            editRepoConfigOpen = true
          }}
        >
          <AdjustmentsVerticalOutline />
        </Button>
      </ButtonGroup>
      <Tooltip triggeredBy="#import-button">Import data from Tabular</Tooltip>
      <Tooltip triggeredBy="#repo-configure-button">Configure Repository</Tooltip>
    </div>
  </div>
  <div>
    <div>
      <span class="pl-1 font-light text-sm"
        >Displaying {displayedRecords.length} records out of {liveRepoRecords.length}</span
      >
    </div>
    <Table hoverable={true} border={true} class="table-auto">
      <TableHead class="normal-case">
        <TableHeadCell class="w-fit">
          {#if totalDisplayedIssueCount}
            <ExclamationCircleOutline color="red" />
            <Tooltip
              >Validation failed for {Object.keys(displayedRecordIssueCount).length} (unsaved) records</Tooltip
            >
          {:else if modifiedRecords.size && Object.keys(recordFlushTimers).length}
            <FloppyDiskOutline />
            <Tooltip>{modifiedRecords.size} records still pending saving...</Tooltip>
          {:else}
            <ClipboardCheckOutline />
            <Tooltip>Everything looks good and is saved!</Tooltip>
          {/if}
        </TableHeadCell>
        <TableHeadCell>
          <div class="flex w-fit">
            <span>Identifier</span>

            {#if liveRecordFilters['identifier'] || (demoFilter && demoFilter.key == 'identifier')}
              <span class="relative pl-1">
                <FilterOutline color="orange" />
              </span>
              <Popover title="Identifier Filters">
                <div class="space-y-2">
                  <div class="mb-3 flex">
                    {#each Object.values(liveRecordFilters['identifier'] || {}) as filter (filter.key)}
                      <Badge
                        class="m-1"
                        dismissable
                        onclose={() => removeFilterForMetadataKey(filter)}
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
                      disabled={!liveRecordFilters['Identifier']}
                      onclick={() => (liveRecordFilters['Identifier'] = {})}>Clear Filters</Button
                    >
                  </div>
                </div>
              </Popover>
            {/if}
          </div>
        </TableHeadCell>
        {#each displayedMetadata.filter(({ key }) => key != 'Identifier') as { key } (key)}
          <TableHeadCell>
            <div class="flex w-fit">
              <span>{key}</span>
              {#if liveRecordFilters[key] || (demoFilter && demoFilter.key == key)}
                <span class="relative pl-1"><FilterOutline color="orange" /> </span>
                <Popover title={`Filter on "${key}"`}>
                  <div class="space-y-2">
                    <div class="mb-3 flex">
                      {#each Object.values(liveRecordFilters[key] || {}) as filter (filter.identifier)}
                        <Badge
                          class="m-1"
                          dismissable
                          onclose={() => removeFilterForMetadataKey(filter)}
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
                        onclick={() => (liveRecordFilters[key] = {})}>Clear Filters</Button
                      >
                    </div>
                  </div>
                </Popover>
              {/if}
            </div>
          </TableHeadCell>
        {/each}
        <TableHeadCell></TableHeadCell>
      </TableHead>
      <TableBody>
        {#each displayedRecords as { record: { identifier, metadata }, index: liveRecordIndex } (liveRecordIndex)}
          <TableBodyRow class="border-gray-200">
            <TableBodyCell>
              {#if displayedRecordIssueCount[identifier]}
                <ExclamationCircleOutline color="red" class="shrink-0" />
                <Tooltip>
                  {displayedRecordIssueCount[identifier]} issue(s) found with metadata associated with
                  this record. Updates will not be saved until fixed.
                </Tooltip>
              {:else if modifiedRecords.has(identifier) && recordFlushTimers[identifier]}
                <FloppyDiskOutline color="primary" class="shrink-0" />
                <Tooltip>
                  Saving record in {(recordFlushTimers[identifier].delay / 1000).toFixed(1)} seconds...
                </Tooltip>
              {:else if recordLocks[identifier]}
                <ChalkboardUserOutline color="cyan" />
                <Tooltip>
                  The record cannot be modified at this time as {liveRecordStats[identifier]
                    .lockStatus.currentUser} is editing this record.
                </Tooltip>
              {:else}
                <CheckCircleOutline class="shrink-0" color="green" />
                <Tooltip>No issues found and record is saved.</Tooltip>
              {/if}
            </TableBodyCell>
            <TableBodyCell>{identifier}</TableBodyCell>
            {#each displayedMetadata.filter(({ key }) => key != 'Identifier') as { key }, colIndex (colIndex)}
              <TableBodyCell>
                <div class="flex">
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
            <TableBodyCell>
              <Button outline size="sm" class="border-0 p-1!" color="dark">
                <DotsVerticalOutline />
              </Button>
              <Popover trigger="click">
                <Button
                  onclick={() => editRecord(liveRecordIndex)}
                  size="xs"
                  class="p-2!"
                  pill
                  outline
                  disabled={recordLocks[identifier] != null}
                  color="primary"><EditOutline size="xs" /></Button
                >
                <Tooltip>Edit Record Metadata</Tooltip>
                <Button
                  onclick={() => reloadRecord(identifier)}
                  size="xs"
                  pill
                  outline
                  color="secondary"
                  class="p-2!"><RefreshOutline size="xs" /></Button
                >
                <Tooltip>Reload from Disk</Tooltip>
                <Button
                  onclick={() =>
                    openRepoRecordDirectory(appStateStore.state.openedRepoPath, identifier)}
                  size="xs"
                  pill
                  outline
                  color="secondary"
                  class="p-2!"
                  disabled={recordLocks[identifier] != null}
                >
                  <FolderArrowRightOutline size="xs" />
                </Button>
                <Tooltip>Open Record Directory</Tooltip>
                <Button
                  onclick={() => removeRecord(liveRecordIndex)}
                  size="xs"
                  pill
                  outline
                  color="red"
                  disabled={recordLocks[identifier] != null}
                  class="p-2!"><TrashBinOutline size="xs" /></Button
                >
                <Tooltip>Delete Record</Tooltip>
              </Popover>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
