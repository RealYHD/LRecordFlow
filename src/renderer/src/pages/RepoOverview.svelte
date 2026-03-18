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
    type MetadataDescriptor,
    type RepositoryConfiguration,
    type RecordMetadata,
    type RepositoryRecord,
    getAllRecordsForRepo,
    loadRecordFromRepo,
    remoteSyncStatus,
    syncPromiseId as gitFetchPromiseId
  } from '../lib/repo.svelte'
  import {
    Button,
    ButtonGroup,
    Drawer,
    Input,
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
    CheckCircleOutline,
    ClipboardCheckOutline,
    EditOutline,
    ExclamationCircleOutline,
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
  import { appStateStore, isTrackedPromiseComplete } from '../lib/state.svelte'

  const localRepoPath = appStateStore.state.openedRepoPath

  let liveRepoConfiguration: RepositoryConfiguration = $state({
    defined: [],
    exactKeys: false
  })
  let liveRepoRecords: RepositoryRecord[] = $state([])
  let liveMetadataDescriptors: MetadataDescriptor[] = $derived(
    aggregateMetadataDescriptors(liveRepoRecords, liveRepoConfiguration)
  )
  let liveRepoRecordsById: Record<string, RepositoryRecord> = $derived(
    Object.fromEntries(liveRepoRecords.map((recordData) => [recordData.identifier, recordData]))
  )

  const flushDelay = 2 * 1000
  const tickInterval = 1000
  const remoteSyncDelay = 10000
  let remoteSyncTimer = $state(remoteSyncDelay)
  const persistedRecordMetadata: Record<string, RecordMetadata> = $state({})
  const modifiedRecords: SvelteSet<string> = $derived(
    calcModifiedRecords(liveRepoRecords, persistedRecordMetadata)
  )
  const recordFlushDelays: Record<
    string,
    { delay: number; flushing: boolean; snapshot: RecordMetadata }
  > = $state({})
  let flushIntervalTimerId = -1
  let remoteSyncIntervalTimerId = -1

  const displayedRows: RepositoryRecord[] = $derived(liveRepoRecords) // TODO do something with this...
  const displayedMetadata: MetadataDescriptor[] = $derived(liveMetadataDescriptors)

  let gitDistanceFromRemote: { ahead: number; behind: number; files: string[] } = $state({
    ahead: 0,
    behind: 0,
    files: []
  })
  let syncingWithRemote: boolean = $derived(!isTrackedPromiseComplete(gitFetchPromiseId))
  let remoteSyncIssues: string = $state('')
  let liveRecordIssues = $derived(validateRecords(liveRepoRecords, liveMetadataDescriptors))
  const liveRecordIssueCount = $derived(countIssues(liveRecordIssues))
  let totalIssueCount: number = $derived(
    Object.values(liveRecordIssueCount).reduce((total, current) => total + current, 0)
  )
  let editRecordDataOpen = $state(false)
  let editingLiveIndex: number = $state(0)
  let editRepoConfigOpen = $state(false)

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
    editRecordDataOpen = true
  }

  function editRecord(editRecordIndex: number): void {
    editingLiveIndex = editRecordIndex
    editRecordDataOpen = true
  }

  function removeRecord(deleteRecordIndex: number): void {
    const recordIdentifier = liveRepoRecords[deleteRecordIndex].identifier
    deleteRecord(localRepoPath, recordIdentifier).then(() => {
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
      localRepoPath,
      modifiedRecord.identifier,
      $state.snapshot(modifiedRecord.metadata)
    ).then(() => {
      delete recordFlushDelays[modifiedRecord.identifier]
      modifiedRecords.delete(modifiedRecord.identifier)
      persistedRecordMetadata[modifiedRecord.identifier] = $state.snapshot(modifiedRecord.metadata)
    })
  }

  function flushAllModifiedRecords(): void {
    for (const modifiedRecordId of modifiedRecords) {
      if (liveRecordIssueCount[modifiedRecordId]) continue
      flushRecord(modifiedRecordId)
    }
  }

  function loadAllRecords(): void {
    flushAllModifiedRecords()
    getAllRecordsForRepo(localRepoPath).then((identifiers) => {
      loadRecords(...identifiers)
    })
  }

  function loadRecords(...identifiers: string[]): void {
    for (const identifier of identifiers) {
      loadRecordFromRepo(localRepoPath, identifier).then((record) => {
        if (liveRepoRecordsById[identifier]) {
          Object.assign(liveRepoRecordsById[identifier], record)
        } else {
          liveRepoRecords.push(record)
        }
        persistedRecordMetadata[identifier] = record.metadata
      })
    }
  }

  function loadRepoConfiguration(): void {
    liveRepoConfiguration.defined = []
    liveRepoConfiguration.exactKeys = false
    getRepoConfig(localRepoPath).then((loadedConfig) => {
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
    loadRecords(...importedIdentifiers)
  }

  function recordFlushTick(): void {
    for (const modifiedRecordId in recordFlushDelays) {
      if (!modifiedRecords.has(modifiedRecordId)) {
        delete recordFlushDelays[modifiedRecordId]
      }
    }
    for (const modifiedRecordId of modifiedRecords) {
      if (liveRecordIssueCount[modifiedRecordId]) continue
      if (recordFlushDelays[modifiedRecordId]) {
        if (
          !recordDataIsEqual(
            $state.snapshot(liveRepoRecordsById[modifiedRecordId].metadata),
            recordFlushDelays[modifiedRecordId].snapshot
          )
        ) {
          recordFlushDelays[modifiedRecordId].delay = flushDelay
          recordFlushDelays[modifiedRecordId].snapshot = $state.snapshot(
            liveRepoRecordsById[modifiedRecordId].metadata
          )
          recordFlushDelays[modifiedRecordId].flushing = false
        } else if (
          recordFlushDelays[modifiedRecordId].delay <= 0 &&
          !recordFlushDelays[modifiedRecordId].flushing
        ) {
          recordFlushDelays[modifiedRecordId].flushing = true
          flushRecord(modifiedRecordId)
        } else {
          recordFlushDelays[modifiedRecordId].delay -= tickInterval
          if (recordFlushDelays[modifiedRecordId].delay <= 0)
            recordFlushDelays[modifiedRecordId].delay = 0
        }
      } else {
        recordFlushDelays[modifiedRecordId] = {
          delay: flushDelay,
          snapshot: $state.snapshot(liveRepoRecordsById[modifiedRecordId].metadata),
          flushing: false
        }
      }
    }
  }

  function remoteSyncTick(): void {
    // TODO finish this
    // Think about the non-git user experience
    // Press save to commit and immediately try to push
    // On fetch, if conflicts, show what is conflicting
    // If no conflicts, automatically pull
    // Rudimentary file browser
    // Show diffs for files if possible
    remoteSyncTimer -= tickInterval
    if (remoteSyncTimer <= 0) {
      remoteSyncTimer = 0
      let promise = remoteSyncStatus(localRepoPath)
      if (promise == null) return
      promise
        .then((distances) => {
          gitDistanceFromRemote.ahead = distances.ahead
          gitDistanceFromRemote.behind = distances.behind
          gitDistanceFromRemote.files = distances.files
          remoteSyncTimer = remoteSyncDelay
        })
        .catch((err) => {
          // TODO improve type definitions for IPC processes
          remoteSyncIssues = err.message
        })
    }
  }

  onMount(() => {
    loadRepoConfiguration()
    loadAllRecords()
    flushIntervalTimerId = window.setInterval(recordFlushTick, tickInterval)
    remoteSyncIntervalTimerId = window.setInterval(remoteSyncTick, tickInterval)
  })

  function onWindowUnload(): void {
    flushAllModifiedRecords()
    if (flushIntervalTimerId != -1) {
      window.clearInterval(flushIntervalTimerId)
    }
    if (remoteSyncIntervalTimerId != -1) {
      window.clearInterval(remoteSyncIntervalTimerId)
    }
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
    setRepoConfig(localRepoPath, $state.snapshot(liveRepoConfiguration))
  }}
>
  <ConfigureRepository bind:repoConfig={liveRepoConfiguration} />
</Drawer>

<Drawer bind:open={editRecordDataOpen} placement="right">
  <EditRecordData
    metadataDescriptors={liveMetadataDescriptors}
    bind:liveRecords={liveRepoRecords}
    bind:liveIssues={liveRecordIssues}
    bind:editRecordIndex={editingLiveIndex}
    refreshRecordFn={loadRecords}
  />
</Drawer>

<div class="w-full h-full px-4 sm:px-1 pt-4">
  <div class="mb-2 flex justify-center space-x-1">
    <ButtonGroup>
      <Input type="text" placeholder="Identifier" bind:value={createRecordIdentifier} />
      <Button onclick={() => addRecord()} disabled={createDisabled}><PlusOutline /></Button>
    </ButtonGroup>
    <Tooltip>Add Record</Tooltip>
    <Button
      outline
      color="secondary"
      onclick={() => {
        importTabularOpen = true
      }}>Import</Button
    >
    <Button
      outline
      color="secondary"
      onclick={() => {
        editRepoConfigOpen = true
      }}
    >
      <AdjustmentsVerticalOutline />
      Settings
    </Button>
    <Button outline color="secondary" onclick={() => {}}>Sync</Button>
    <Popover>{gitDistanceFromRemote.ahead}</Popover>
  </div>
  <div>
    <Table hoverable={true} border={true}>
      <TableHead class="normal-case">
        <TableHeadCell class="w-fit">
          {#if totalIssueCount}
            <ExclamationCircleOutline class="shrink-0" color="red" />
            <Popover
              >Validation failed for {Object.keys(liveRecordIssueCount).length} (unsaved) records</Popover
            >
          {:else if modifiedRecords.size && Object.keys(recordFlushDelays).length}
            <FloppyDiskOutline class="shrink-0" />
            <Popover>{modifiedRecords.size} records still pending saving...</Popover>
          {:else}
            <ClipboardCheckOutline class="shrink-0" />
            <Popover>Everything looks good and is saved!</Popover>
          {/if}
        </TableHeadCell>
        <TableHeadCell>Modify</TableHeadCell>
        <TableHeadCell>Identifier</TableHeadCell>
        {#each displayedMetadata.filter(({ key }) => key != 'Identifier') as { key } (key)}
          <TableHeadCell>{key}</TableHeadCell>
        {/each}
      </TableHead>
      <TableBody>
        {#each displayedRows as { identifier, metadata }, rowIndex (rowIndex)}
          <TableBodyRow class="border-gray-200">
            <TableBodyCell>
              <!-- TODO fix the alignment issue here -->
              {#if liveRecordIssueCount[identifier]}
                <ExclamationCircleOutline color="red" class="shrink-0" />
                <Popover>
                  {liveRecordIssueCount[identifier]} issue(s) found with metadata associated with this
                  record. Updates will not be saved until fixed.
                </Popover>
              {:else if modifiedRecords.has(identifier) && recordFlushDelays[identifier]}
                <FloppyDiskOutline color="primary" class="shrink-0" />
                <Popover>
                  Saving record in {recordFlushDelays[identifier].delay} seconds...
                </Popover>
              {:else}
                <CheckCircleOutline class="shrink-0" color="green" />
                <Popover>No issues found and record is saved on local storage.</Popover>
              {/if}
            </TableBodyCell>
            <TableBodyCell>
              <Button
                onclick={() => editRecord(rowIndex)}
                size="xs"
                class="p-2!"
                pill
                outline
                color="primary"><EditOutline size="xs" /></Button
              >
              <Tooltip>Edit Record Metadata</Tooltip>
              <Button
                onclick={() => loadRecords(identifier)}
                size="xs"
                pill
                outline
                color="secondary"
                class="p-2!"><RefreshOutline size="xs" /></Button
              >
              <Tooltip>Reload from Disk</Tooltip>
              <Button
                onclick={() => openRepoRecordDirectory(localRepoPath, identifier)}
                size="xs"
                pill
                outline
                color="secondary"
                class="p-2!"
              >
                <FolderArrowRightOutline size="xs" />
              </Button>
              <Tooltip>Open Record Directory</Tooltip>
              <Button
                onclick={() => removeRecord(rowIndex)}
                size="xs"
                pill
                outline
                color="red"
                class="p-2!"><TrashBinOutline size="xs" /></Button
              >
              <Tooltip>Delete Record</Tooltip>
            </TableBodyCell>
            <TableBodyCell>{identifier}</TableBodyCell>
            {#each displayedMetadata.filter(({ key }) => key != 'Identifier') as { key }, colIndex (colIndex)}
              <TableBodyCell>
                <div class="flex">
                  {#if liveRecordIssues[identifier][key] && liveRecordIssues[identifier][key].length}
                    <ExclamationCircleOutline color="red" class="shrink-0" />
                    <Popover>
                      <ul>
                        {#each liveRecordIssues[identifier][key] as issue (issue)}
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
  </div>
</div>
