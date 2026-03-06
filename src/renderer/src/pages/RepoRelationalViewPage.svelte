<script lang="ts">
  import { route } from '../lib/router.svelte'
  import {
    countIssues,
    deleteRecord,
    getColumnsFromRecords as findColumnsFromRecords,
    getRepoConfig,
    loadRecords as loadRecordsFromStorage,
    saveRecord,
    setRepoConfig,
    validateRecordIdentifier,
    validateRecords,
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
    TrashBinOutline
  } from 'flowbite-svelte-icons'
  import { onMount } from 'svelte'
  import ConfigureRepository from '../components/ConfigureRepository.svelte'

  const localRepoPath = route.params.repository

  let liveRecordData: RepositoryRecordData[] = $state([])
  let liveRepoConfiguration: RepositoryConfiguration = $state({
    requiredMetadata: {},
    exactKeys: false
  })

  const saveDelay = 2
  const saveTickInterval = 100
  const persistedRecordData: Record<string, RepositoryRecordData> = $state({})
  const modifiedRecords: [string, number][] = $derived(
    calcModifiedRecords(liveRecordData, persistedRecordData)
  )
  const recordFlushState: Record<string, [number, string, boolean]> = $state({})
  let unsavedRecordsCount: number = $derived(Object.keys(recordFlushState).length)

  const displayedRows: RepositoryRecordData[] = $derived(liveRecordData) // TODO do something with this...
  const displayedCols: [string, string[]][] = $derived(findColumnsFromRecords(liveRecordData))
  const identifiers = $derived(liveRecordData.map((record) => record['Identifier']))

  let liveRecordIssues = $derived(validateRecords(liveRecordData))
  const liveRecordIssueCount: number[] = $derived(countIssues(liveRecordIssues))
  let totalIssueCount: number = $derived(
    liveRecordIssueCount.reduce((total, current) => total + current, 0)
  )
  let editRecordDataOpen = $state(false)
  let editingLiveIndex: number = $state(0)

  let editRepoConfigOpen = $state(false)

  let createRecordIdentifier = $state('')
  let createRecordIdentifierError = $derived(
    validateRecordIdentifier(createRecordIdentifier, identifiers)
  )
  let createPending: boolean = $state(false)
  let createDisabled: boolean = $derived(createRecordIdentifierError.length > 0 || createPending)

  function addRecord(): void {
    const identifier = $state.snapshot(createRecordIdentifier)
    liveRecordData.push({ Identifier: identifier })
    editingLiveIndex = liveRecordData.findLastIndex(
      (record) => record['Identifier'] == createRecordIdentifier
    ) // probably O(1)?
    saveRecord(localRepoPath, identifier, $state.snapshot(liveRecordData[editingLiveIndex])).then(
      () => {
        editRecordDataOpen = true
      }
    )
  }

  function editRecord(editRecordIndex: number): void {
    editingLiveIndex = editRecordIndex
    editRecordDataOpen = true
  }

  function removeRecord(deleteRecordIndex: number): void {
    const recordIdentifier = liveRecordData[deleteRecordIndex]['Identifier']
    deleteRecord(localRepoPath, recordIdentifier).then(() => {
      liveRecordData.splice(deleteRecordIndex, 1)
      delete persistedRecordData[recordIdentifier]
    })
  }

  function calcModifiedRecords(
    liveRecords: RepositoryRecordData[],
    flushedRecordsSnapshot: Record<string, RepositoryRecordData>
  ): [string, number][] {
    let changedRecordIdentifiers: [string, number][] = $state([])
    for (const [index, liveRecord] of liveRecords.entries()) {
      if (!Object.hasOwn(flushedRecordsSnapshot, liveRecord['Identifier'])) {
        // Accounts for new records
        changedRecordIdentifiers.push([liveRecord['Identifier'], index])
        continue
      }
      if (
        JSON.stringify(
          Object.entries(flushedRecordsSnapshot[liveRecord['Identifier']]).toSorted()
        ) != JSON.stringify(Object.entries($state.snapshot(liveRecord)).toSorted())
      ) {
        changedRecordIdentifiers.push([liveRecord['Identifier'], index])
        continue
      }
    }
    return changedRecordIdentifiers
  }

  function flushTick(): void {
    for (const identifier in recordFlushState) {
      if (!modifiedRecords.find(([modifiedIdentifier]) => modifiedIdentifier == identifier)) {
        // If it's no longer in modified records, remove it from recordFlushState
        // The only time it is no longer in modified records should be after the flush promise returns.
        delete recordFlushState[identifier]
      }
    }
    for (const [identifier, index] of modifiedRecords) {
      let liveRecordSerialized = JSON.stringify(Object.entries(liveRecordData[index]).sort())
      if (
        !Object.hasOwn(recordFlushState, identifier) ||
        recordFlushState[identifier][1] != liveRecordSerialized
      ) {
        recordFlushState[identifier] = [saveDelay, liveRecordSerialized, false]
      }
      if (liveRecordIssueCount[index] > 0) continue
      if (Object.hasOwn(recordFlushState, identifier)) {
        recordFlushState[identifier][0] -=
          recordFlushState[identifier][0] <= 0 ? 0 : saveTickInterval / 1000
      }
      if (recordFlushState[identifier][0] <= 0) {
        let recordDataSnapshot = $state.snapshot(liveRecordData[index])
        recordFlushState[identifier][0] = 0
        if (!recordFlushState[identifier][2]) {
          flushRecord(recordDataSnapshot)
          recordFlushState[identifier][2] = true
        }
      }
    }
  }

  function flushRecord(modifiedRecord: RepositoryRecordData): void {
    saveRecord(localRepoPath, modifiedRecord['Identifier'], modifiedRecord).then(() => {
      persistedRecordData[modifiedRecord['Identifier']] = modifiedRecord
    })
  }

  function loadRecords(): void {
    liveRecordData.length = 0
    loadRecordsFromStorage(localRepoPath).then((loadedRecords) => {
      liveRecordData.push(...loadedRecords)
      for (const loadedRecord of loadedRecords) {
        persistedRecordData[loadedRecord['Identifier']] = loadedRecord
      }
    })
  }

  function flushRepoConfiguration(): void {
    setRepoConfig(localRepoPath, liveRepoConfiguration)
  }

  function loadRepoConfiguration(): void {
    liveRepoConfiguration.requiredMetadata = {}
    liveRepoConfiguration.exactKeys = false
    getRepoConfig(localRepoPath).then((loadedConfig) => {
      Object.assign(liveRepoConfiguration, loadedConfig)
    })
  }
  onMount(() => {
    loadRecords()
    loadRepoConfiguration()
    setInterval(flushTick, saveTickInterval)
  })
</script>

<Drawer bind:open={editRepoConfigOpen} placement="right">
  <ConfigureRepository
    repoConfig={$state.snapshot(liveRepoConfiguration)}
    completionCallbackFn={(updatedRepoConfig) => {
      Object.assign(liveRepoConfiguration, updatedRepoConfig)
      editRepoConfigOpen = false
      flushRepoConfiguration()
    }}
  />
</Drawer>

<Drawer bind:open={editRecordDataOpen} placement="right">
  <EditRecordData
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
      <TableHead>
        <TableHeadCell class="w-fit">
          {#if totalIssueCount}
            <ExclamationCircleOutline class="shrink-0" />
          {:else if unsavedRecordsCount}
            <FloppyDiskOutline class="shrink-0" />
          {:else}
            <ClipboardCheckOutline class="shrink-0" />
          {/if}
        </TableHeadCell>
        <TableHeadCell>Modify</TableHeadCell>
        <TableHeadCell class="w-fit"><Checkbox /></TableHeadCell>
        <TableHeadCell>Identifier</TableHeadCell>
        {#each displayedCols.filter(([colName]) => colName != 'Identifier') as [colName] (colName)}
          <TableHeadCell>{colName}</TableHeadCell>
        {/each}
      </TableHead>
      <TableBody>
        {#each displayedRows as row, rowIndex (row['Identifier'])}
          <TableBodyRow class="border-gray-200" ondblclick={() => editRecord(rowIndex)}>
            <TableBodyCell>
              <!-- TODO fix the alignment issue here -->
              {#if liveRecordIssueCount[rowIndex]}
                <ExclamationCircleOutline color="red" class="shrink-0" />
              {:else if recordFlushState[row['Identifier']]}
                <FloppyDiskOutline color="blue" class="shrink-0" />
              {:else}
                <CheckCircleOutline class="shrink-0" />
              {/if}
            </TableBodyCell>
            <TableBodyCell>
              <ButtonGroup>
                <Button onclick={() => editRecord(rowIndex)}><EditOutline /></Button>
                <Button onclick={() => removeRecord(rowIndex)}><TrashBinOutline /></Button>
              </ButtonGroup>
            </TableBodyCell>
            <TableBodyCell><Checkbox /></TableBodyCell>
            <TableBodyCell>{row['Identifier']}</TableBodyCell>
            {#each displayedCols.filter(([colName]) => colName != 'Identifier') as [colName], colIndex (colName)}
              <TableBodyCell>
                <div class="flex">
                  {#if liveRecordIssues[rowIndex][colName] && liveRecordIssues[rowIndex][colName].length}
                    <ExclamationCircleOutline
                      color="red"
                      class="shrink-0"
                      id={`table-issue-${rowIndex}-${colIndex}`}
                    />
                    <Popover triggeredBy={`#table-issue-${rowIndex}-${colIndex}`}>
                      <ul>
                        {#each liveRecordIssues[rowIndex][colName] as issue (issue)}
                          <li>{issue}</li>
                        {/each}
                      </ul>
                    </Popover>
                  {/if}
                  {row[colName]}
                </div>
              </TableBodyCell>
            {/each}
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
