<script lang="ts">
  import { route } from '../lib/router.svelte'
  import {
    findColumns as findColumnsFromRecords,
    loadRecords as loadRecordsFromStorage,
    setRecord,
    validateRecordIdentifier,
    validateRecords
  } from '../lib/repo.svelte'
  import {
    Button,
    ButtonGroup,
    Checkbox,
    Input,
    Popover,
    Progressradial,
    Span,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte'
  import EditRecordModal from '../components/EditRecordModal.svelte'
  import {
    CheckCircleOutline,
    ExclamationCircleOutline,
    FloppyDiskAltOutline
  } from 'flowbite-svelte-icons'
  import { onMount } from 'svelte'
  import { SvelteMap } from 'svelte/reactivity'

  const saveDelay = 5
  const saveTickInterval = 100
  const savedRecordData: Record<string, Record<string, string>> = $state({})
  const localRepoPath = route.params.repository
  const liveRecordData: Record<string, string>[] = $state([])
  const modifiedRecords: string[] = $derived(calcModifiedRecords(liveRecordData, savedRecordData))
  const recordFlushTimers: Record<string, number> = $state({})
  const rows: Record<string, string>[] = $derived(liveRecordData) // TODO do something with this...
  const cols: [string, string[]][] = $derived(findColumnsFromRecords(liveRecordData))
  const identifiers = $derived(liveRecordData.map((record) => record['Identifier']))
  const { issues, issuesCount } = $derived(validateRecords(liveRecordData))
  let editingRecordData: Record<string, string> = $state({ Identifier: '' })
  let editModalOpen = $state(false)
  let createRecordIdentifier = $state('')
  let createRecordIdentifierError = $derived(
    validateRecordIdentifier(createRecordIdentifier, identifiers)
  )
  let createPending: boolean = $state(false)
  let createDisabled: boolean = $derived(createRecordIdentifierError.length > 0 || createPending)

  function editRecord(record: Record<string, string>): void {
    editingRecordData = record
    editModalOpen = true
  }

  function addRecord(): void {
    const identifier = $state.snapshot(createRecordIdentifier)
    liveRecordData.push({ Identifier: identifier })
    editingRecordData = liveRecordData.findLast(
      (record) => record['Identifier'] == createRecordIdentifier
    ) // probably O(1)?
    setRecord(localRepoPath, identifier, editingRecordData).then(() => {
      editModalOpen = true
    })
  }

  function calcModifiedRecords(
    liveRecords: Record<string, string>[],
    flushedRecordsSnapshot: Record<string, Record<string, string>>
  ): string[] {
    console.log('diffing')
    let changedRecordIdentifiers: string[] = $state([])
    for (const liveRecord of liveRecords) {
      if (!Object.hasOwn(flushedRecordsSnapshot, liveRecord['Identifier'])) {
        // Accounts for new records
        changedRecordIdentifiers.push(liveRecord['Identifier'])
        continue
      }
      if (
        JSON.stringify(
          Object.entries(flushedRecordsSnapshot[liveRecord['Identifier']]).toSorted()
        ) != JSON.stringify(Object.entries($state.snapshot(liveRecord)).toSorted())
      ) {
        changedRecordIdentifiers.push(liveRecord['Identifier'])
        continue
      }
    }
    return changedRecordIdentifiers
  }

  function flushTick(): void {
    // In case something was modified and returned, this removes any dangling timers that aren't ticked
    for (const identifier in recordFlushTimers) {
      if (!modifiedRecords.includes(identifier)) delete recordFlushTimers[identifier]
    }
    for (const identifier of modifiedRecords) {
      if (!Object.hasOwn(recordFlushTimers, identifier)) {
        recordFlushTimers[identifier] = saveDelay
      } else {
        recordFlushTimers[identifier] -=
          recordFlushTimers[identifier] <= 0 ? 0 : saveTickInterval / 1000
      }
      if (recordFlushTimers[identifier] <= 0) {
        flushRecord(
          $state.snapshot(
            liveRecordData.find((liveRecord) => liveRecord['Identifier'] == identifier)
          )
        )
      }
    }
  }

  function flushRecord(modifiedRecord: Record<string, string>): void {
    setRecord(localRepoPath, modifiedRecord['Identifier'], modifiedRecord)
    savedRecordData[modifiedRecord['Identifier']] = modifiedRecord
  }

  function loadRecords(): void {
    liveRecordData.length = 0
    loadRecordsFromStorage(localRepoPath).then((loadedRecords) => {
      liveRecordData.push(...loadedRecords)
      for (const loadedRecord of loadedRecords) {
        savedRecordData[loadedRecord['Identifier']] = loadedRecord
      }
    })
  }
  onMount(() => {
    loadRecords()
    setInterval(flushTick, saveTickInterval)
  })
</script>

<EditRecordModal
  bind:modalOpen={editModalOpen}
  {localRepoPath}
  bind:recordData={editingRecordData}
/>

<div class="w-full h-full px-4 sm:px-1">
  <div class="mb-2">
    <ButtonGroup>
      <Input type="text" placeholder="Identifier" bind:value={createRecordIdentifier} />
      <Button onclick={() => addRecord()} disabled={createDisabled}>Add</Button>
    </ButtonGroup>
  </div>
  <div>
    <Table hoverable={true} border={true} shadow>
      <TableHead>
        <TableHeadCell><FloppyDiskAltOutline class="shrink-0" /></TableHeadCell>
        <TableHeadCell class="w-fit"><Checkbox /></TableHeadCell>
        {#each cols as [colName] (colName)}
          <TableHeadCell>{colName}</TableHeadCell>
        {/each}
      </TableHead>
      <TableBody>
        {#each rows as row, rowIndex (row['Identifier'])}
          <TableBodyRow class="border-gray-200" ondblclick={() => editRecord(row)}>
            <TableBodyCell>
              <!-- TODO fix the alignment issue here -->
              <Progressradial
                progress={recordFlushTimers[row['Identifier']]
                  ? 100 * ((saveDelay - recordFlushTimers[row['Identifier']]) / saveDelay)
                  : 100}
                class="h-5 w-5"
                color="gray"
              />
            </TableBodyCell>
            <TableBodyCell><Checkbox /></TableBodyCell>
            {#each cols as [colName], colIndex (colName)}
              <TableBodyCell>
                <div class="flex">
                  {#if colName == 'Identifier'}{/if}
                  {#if issues[rowIndex][colName] && issues[rowIndex][colName].length}
                    <ExclamationCircleOutline
                      color="red"
                      class="shrink-0"
                      id={`table-issue-${rowIndex}-${colIndex}`}
                    />
                    <Popover triggeredBy={`#table-issue-${rowIndex}-${colIndex}`}>
                      <ul>
                        {#each issues[rowIndex][colName] as issue (issue)}
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
