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
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons'
  import { onMount } from 'svelte'
  import { SvelteMap } from 'svelte/reactivity'

  const saveDelay = 10
  const savedRecords: Record<string, Record<string, string>> = $state({})
  const localRepoPath = route.params.repository
  const liveRecords: Record<string, string>[] = $state([])
  const recordSaveTimers: Record<string, number> = $derived(
    setSaveTimers(liveRecords, savedRecords)
  )
  const rows: Record<string, string>[] = $derived(liveRecords) // TODO do something with this...
  const cols: [string, string[]][] = $derived(findColumnsFromRecords(liveRecords))
  const identifiers = $derived(liveRecords.map((record) => record['Identifier']))
  const { issues, issuesCount } = $derived(validateRecords(liveRecords))
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
    liveRecords.push({ Identifier: identifier })
    editingRecordData = liveRecords.findLast(
      (record) => record['Identifier'] == createRecordIdentifier
    ) // probably O(1)?
    setRecord(localRepoPath, identifier, editingRecordData).then(() => {
      editModalOpen = true
    })
  }

  function setSaveTimers(
    liveRecords: Record<string, string>[],
    flushedRecordsSnapshot: Record<string, Record<string, string>>
  ): Record<string, number> {
    console.log('diffing')
    let changedRecordIdentifiers: Record<string, number> = $state({})
    for (const liveRecord of liveRecords) {
      if (!Object.hasOwn(flushedRecordsSnapshot, liveRecord['Identifier'])) {
        // Accounts for new records
        changedRecordIdentifiers[liveRecord['Identifier']] = saveDelay
        continue
      }
      if (
        JSON.stringify(
          Object.entries(flushedRecordsSnapshot[liveRecord['Identifier']]).toSorted()
        ) != JSON.stringify(Object.entries($state.snapshot(liveRecord)).toSorted())
      ) {
        changedRecordIdentifiers[liveRecord['Identifier']] = saveDelay
        continue
      }
    }
    return changedRecordIdentifiers
  }

  function saveTick(): void {
    for (const identifier in recordSaveTimers) {
      if (!Object.hasOwn(recordSaveTimers, identifier)) continue
      recordSaveTimers[identifier] -= recordSaveTimers[identifier] == 0 ? 0 : 1
      if (recordSaveTimers[identifier] == 0) {
        flushRecord(
          $state.snapshot(liveRecords.find((liveRecord) => liveRecord['Identifier'] == identifier))
        )
      }
    }
  }

  function flushRecord(modifiedRecord: Record<string, string>): void {
    setRecord(localRepoPath, modifiedRecord['Identifier'], modifiedRecord)
    savedRecords[modifiedRecord['Identifier']] = modifiedRecord
    console.log(`Flushed ${modifiedRecord['Identifier']}`)
    console.log($state.snapshot(savedRecords))
  }

  function loadRecords(): void {
    liveRecords.length = 0
    loadRecordsFromStorage(localRepoPath).then((loadedRecords) => {
      liveRecords.push(...loadedRecords)
      for (const loadedRecord of loadedRecords) {
        savedRecords[loadedRecord['Identifier']] = loadedRecord
      }
      console.log('load')
      console.log($state.snapshot(savedRecords))
      console.log($state.snapshot(liveRecords))
    })
  }
  onMount(() => {
    loadRecords()
    setInterval(saveTick, 1000)
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
        <TableHeadCell><Checkbox /></TableHeadCell>
        {#each cols as [colName] (colName)}
          <TableHeadCell>{colName}</TableHeadCell>
        {/each}
      </TableHead>
      <TableBody>
        {#each rows as row, rowIndex (row['Identifier'])}
          <TableBodyRow class="border-gray-200" ondblclick={() => editRecord(row)}>
            <TableBodyCell><Checkbox /></TableBodyCell>
            {#each cols as [colName], colIndex (colName)}
              <TableBodyCell>
                <div class="flex">
                  {#if colName == 'Identifier'}
                    {#if Object.hasOwn(recordSaveTimers, row['Identifier'])}
                      <Span>
                        {recordSaveTimers[row['Identifiers']]}
                      </Span>
                    {/if}
                  {/if}
                  {#if issues[rowIndex][colName] && issues[rowIndex][colName].length}
                    <Span class="inline">
                      <ExclamationCircleOutline
                        color="red"
                        class="shrink-0"
                        id={`table-issue-${rowIndex}-${colIndex}`}
                      />
                    </Span>
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
