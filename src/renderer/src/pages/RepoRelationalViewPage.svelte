<script lang="ts">
  import { route } from '../lib/router.svelte'
  import {
    aggregateMetadataDescriptors,
    countIssues,
    deleteRecord,
    getRepoConfig,
    identifierKey,
    loadRecords as loadRecordsFromStorage,
    openRepoRecordDirectory,
    recordDataIsEqual,
    saveRecord,
    setRepoConfig,
    validateRecordIdentifier,
    validateRecords,
    type MetadataDescriptor,
    type RepositoryConfiguration,
    type RepositoryRecordData
  } from '../lib/repo.svelte'
  import {
    Button,
    ButtonGroup,
    Checkbox,
    Drawer,
    Input,
    Popover,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
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
    TrashBinOutline
  } from 'flowbite-svelte-icons'
  import { onMount } from 'svelte'
  import ConfigureRepository from '../components/ConfigureRepository.svelte'
  import { SvelteSet } from 'svelte/reactivity'

  const localRepoPath = route.params.repository

  let liveRepoConfiguration: RepositoryConfiguration = $state({
    defined: [],
    exactKeys: false
  })
  let liveRecordData: RepositoryRecordData[] = $state([])
  let liveMetadataDescriptors: MetadataDescriptor[] = $derived(
    aggregateMetadataDescriptors(liveRecordData, liveRepoConfiguration)
  )
  let liveRecordIdentifiers: Record<string, RepositoryRecordData> = $derived(
    Object.fromEntries(liveRecordData.map((recordData) => [recordData[identifierKey], recordData]))
  )

  const flushDelay = 2 * 1000
  const flushTickInterval = 1000
  const persistedRecordData: Record<string, RepositoryRecordData> = $state({})
  const modifiedRecords: SvelteSet<string> = $derived(
    calcModifiedRecords(liveRecordData, persistedRecordData)
  )
  const recordFlushDelays: Record<
    string,
    { delay: number; flushing: boolean; snapshot: RepositoryRecordData }
  > = $state({})
  let flushIntervalTimerId = -1

  const displayedRows: RepositoryRecordData[] = $derived(liveRecordData) // TODO do something with this...
  const displayedMetadata: MetadataDescriptor[] = $derived(liveMetadataDescriptors)

  let liveRecordIssues = $derived(validateRecords(liveRecordData, liveMetadataDescriptors))
  const liveRecordIssueCount = $derived(countIssues(liveRecordIssues))
  let totalIssueCount: number = $derived(
    Object.values(liveRecordIssueCount).reduce((total, current) => total + current, 0)
  )
  let editRecordDataOpen = $state(false)
  let editingLiveIndex: number = $state(0)
  let editRepoConfigOpen = $state(false)

  let createRecordIdentifier = $state('')
  let createRecordIdentifierError = $derived(
    validateRecordIdentifier(createRecordIdentifier, Object.keys(liveRecordIdentifiers))
  )
  let createPending: boolean = $state(false)
  let createDisabled: boolean = $derived(createRecordIdentifierError.length > 0 || createPending)

  function addRecord(): void {
    const identifier = $state.snapshot(createRecordIdentifier)
    liveRecordData.push({ Identifier: identifier })
    editingLiveIndex = liveRecordData.findLastIndex(
      (record) => record[identifierKey] == createRecordIdentifier
    ) // probably O(1)?
    editRecordDataOpen = true
  }

  function editRecord(editRecordIndex: number): void {
    editingLiveIndex = editRecordIndex
    editRecordDataOpen = true
  }

  function removeRecord(deleteRecordIndex: number): void {
    const recordIdentifier = liveRecordData[deleteRecordIndex][identifierKey]
    deleteRecord(localRepoPath, recordIdentifier).then(() => {
      liveRecordData.splice(deleteRecordIndex, 1)
      delete persistedRecordData[recordIdentifier]
    })
  }

  function calcModifiedRecords(
    liveRecords: RepositoryRecordData[],
    persistedRecordData: Record<string, RepositoryRecordData>
  ): SvelteSet<string> {
    let modifiedRecords: SvelteSet<string> = new SvelteSet()
    for (const liveRecord of liveRecords) {
      if (
        !recordDataIsEqual(
          $state.snapshot(liveRecord),
          $state.snapshot(persistedRecordData[liveRecord[identifierKey]])
        )
      ) {
        modifiedRecords.add(liveRecord[identifierKey])
      }
    }
    return modifiedRecords
  }

  function flushRecord(modifiedRecord: RepositoryRecordData): void {
    saveRecord(localRepoPath, modifiedRecord[identifierKey], $state.snapshot(modifiedRecord)).then(
      () => {
        delete recordFlushDelays[modifiedRecord[identifierKey]]
        modifiedRecords.delete(modifiedRecord[identifierKey])
        persistedRecordData[modifiedRecord[identifierKey]] = $state.snapshot(modifiedRecord)
      }
    )
  }

  function flushAllModifiedRecords(): void {
    for (const modifiedRecordId of modifiedRecords) {
      if (liveRecordIssueCount[modifiedRecordId]) continue
      flushRecord($state.snapshot(liveRecordIdentifiers[modifiedRecordId]))
    }
  }

  function loadRecords(): void {
    liveRecordData.length = 0
    loadRecordsFromStorage(localRepoPath).then((loadedRecords) => {
      for (const loadedRecord of loadedRecords) {
        console.log('set persistence')
        persistedRecordData[loadedRecord[identifierKey]] = $state.snapshot(loadedRecord)
      }
      liveRecordData.push(...loadedRecords)
    })
  }

  function loadRepoConfiguration(): void {
    liveRepoConfiguration.defined = []
    liveRepoConfiguration.exactKeys = false
    getRepoConfig(localRepoPath).then((loadedConfig) => {
      Object.assign(liveRepoConfiguration, loadedConfig)
    })
  }

  function recordFlushTick(): void {
    for (const modifiedRecordId of modifiedRecords) {
      if (liveRecordIssueCount[modifiedRecordId]) continue
      if (recordFlushDelays[modifiedRecordId]) {
        if (
          !recordDataIsEqual(
            $state.snapshot(liveRecordIdentifiers[modifiedRecordId]),
            recordFlushDelays[modifiedRecordId].snapshot
          )
        ) {
          recordFlushDelays[modifiedRecordId].delay = flushDelay
          recordFlushDelays[modifiedRecordId].snapshot = $state.snapshot(
            liveRecordIdentifiers[modifiedRecordId]
          )
          recordFlushDelays[modifiedRecordId].flushing = false
        } else if (
          recordFlushDelays[modifiedRecordId].delay <= 0 &&
          !recordFlushDelays[modifiedRecordId].flushing
        ) {
          recordFlushDelays[modifiedRecordId].flushing = true
          flushRecord($state.snapshot(liveRecordIdentifiers[modifiedRecordId]))
        } else {
          recordFlushDelays[modifiedRecordId].delay -= flushTickInterval
          if (recordFlushDelays[modifiedRecordId].delay <= 0)
            recordFlushDelays[modifiedRecordId].delay = 0
        }
      } else {
        recordFlushDelays[modifiedRecordId] = {
          delay: flushDelay,
          snapshot: $state.snapshot(liveRecordIdentifiers[modifiedRecordId]),
          flushing: false
        }
      }
    }
  }

  onMount(() => {
    loadRecords()
    loadRepoConfiguration()
    flushIntervalTimerId = window.setInterval(recordFlushTick, flushTickInterval)
  })

  function onWindowUnload(): void {
    flushAllModifiedRecords()
    window.clearInterval(flushIntervalTimerId)
  }
</script>

<svelte:window onbeforeunload={onWindowUnload} />

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
    bind:liveRecords={liveRecordData}
    bind:liveIssues={liveRecordIssues}
    bind:editRecordIndex={editingLiveIndex}
  />
</Drawer>

<div class="w-full h-full px-4 sm:px-1 pt-4">
  <div class="mb-2 flex justify-center">
    <span class="mx-2">
      <ButtonGroup>
        <Input type="text" placeholder="Identifier" bind:value={createRecordIdentifier} />
        <Button onclick={() => addRecord()} disabled={createDisabled}>Add</Button>
      </ButtonGroup>
    </span>
    <span class="mx-2">
      <ButtonGroup>
        <Button
          onclick={() => {
            editRepoConfigOpen = true
          }}
        >
          <AdjustmentsVerticalOutline />
          Settings
        </Button>
      </ButtonGroup>
    </span>
  </div>
  <div>
    <Table hoverable={true} border={true} shadow>
      <TableHead class="normal-case">
        <TableHeadCell class="w-fit">
          {#if totalIssueCount}
            <ExclamationCircleOutline class="shrink-0" />
          {:else if Object.keys(recordFlushDelays).length}
            <FloppyDiskOutline class="shrink-0" />
          {:else}
            <ClipboardCheckOutline class="shrink-0" />
          {/if}
        </TableHeadCell>
        <TableHeadCell>Modify</TableHeadCell>
        <TableHeadCell class="w-fit"><Checkbox /></TableHeadCell>
        <TableHeadCell>Identifier</TableHeadCell>
        {#each displayedMetadata.filter(({ key }) => key != identifierKey) as { key } (key)}
          <TableHeadCell>{key}</TableHeadCell>
        {/each}
      </TableHead>
      <TableBody>
        {#each displayedRows as row, rowIndex (row[identifierKey])}
          <TableBodyRow class="border-gray-200">
            <TableBodyCell>
              <!-- TODO fix the alignment issue here -->
              {#if liveRecordIssueCount[row[identifierKey]]}
                <ExclamationCircleOutline
                  color="red"
                  class="shrink-0"
                  id={`row-issues-indicator-${rowIndex}`}
                />
                <Popover triggeredBy={`#row-issues-indicator-${rowIndex}`}>
                  {liveRecordIssueCount[row[identifierKey]]} issue(s) found with metadata associated with
                  this record. Updates will not be saved until fixed.
                </Popover>
              {:else if recordFlushDelays[row[identifierKey]]}
                <FloppyDiskOutline
                  color="blue"
                  class="shrink-0"
                  id={`row-saving-indicator-${rowIndex}`}
                />
                <Popover triggeredBy={`#row-saving-indicator-${rowIndex}`}>
                  Saving record in {recordFlushDelays[row[identifierKey]].delay} seconds...
                </Popover>
              {:else}
                <CheckCircleOutline class="shrink-0" id={`row-saved-indicator-${rowIndex}`} />
                <Popover triggeredBy={`#row-saved-indicator-${rowIndex}`}>
                  No issues found and record is saved on local storage.
                </Popover>
              {/if}
            </TableBodyCell>
            <TableBodyCell>
              <ButtonGroup>
                <Button onclick={() => editRecord(rowIndex)}><EditOutline /></Button>
                <Button onclick={() => openRepoRecordDirectory(localRepoPath, row[identifierKey])}>
                  <FolderArrowRightOutline />
                </Button>
                <Button onclick={() => removeRecord(rowIndex)}><TrashBinOutline /></Button>
              </ButtonGroup>
            </TableBodyCell>
            <TableBodyCell><Checkbox /></TableBodyCell>
            <TableBodyCell>{row[identifierKey]}</TableBodyCell>
            {#each displayedMetadata.filter(({ key }) => key != identifierKey) as { key }, colIndex (colIndex)}
              <TableBodyCell>
                <div class="flex">
                  {#if liveRecordIssues[row[identifierKey]][key] && liveRecordIssues[row[identifierKey]][key].length}
                    <ExclamationCircleOutline
                      color="red"
                      class="shrink-0"
                      id={`cell-issues-${rowIndex}-${colIndex}`}
                    />
                    <Popover triggeredBy={`#cell-issues-${rowIndex}-${colIndex}`}>
                      <ul>
                        {#each liveRecordIssues[row[identifierKey]][key] as issue (issue)}
                          <li>{issue}</li>
                        {/each}
                      </ul>
                    </Popover>
                  {/if}
                  {row[key]}
                </div>
              </TableBodyCell>
            {/each}
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
