<script lang="ts">
  import { route } from '../lib/router.svelte'
  import { findColumns as findColumnsFromRecords, loadRecords } from '../lib/repo.svelte'
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte'
  import EditRecordModal from '../components/EditRecordModal.svelte'

  const localRepoPath = route.params.repository
  const rows: Record<string, string>[] = $state([])
  const cols: [string, string[]][] = $derived(findColumnsFromRecords(rows))
  let editingRecordData: Record<string, string> = $state({ Identifier: '' })
  let editModalOpen = $state(false)
  loadRecords(localRepoPath).then((records) => {
    rows.push(...records)
  })

  function edit(record: Record<string, string>): void {
    editingRecordData = record
    editModalOpen = true
  }
</script>

<EditRecordModal
  bind:modalOpen={editModalOpen}
  {localRepoPath}
  bind:recordData={editingRecordData}
/>

<div class="w-full h-full px-4">
  <Table hoverable={true} border={true} shadow>
    <caption
      class="bg-white p-5 text-left text-lg font-semibold text-gray-900 dark:bg-gray-800 dark:text-white"
    >
      Records
    </caption>
    <TableHead>
      {#each cols as [colName] (colName)}
        <TableHeadCell>{colName}</TableHeadCell>
      {/each}
    </TableHead>
    <TableBody>
      {#each rows as row (row['Identifier'])}
        <TableBodyRow ondblclick={() => edit(row)}>
          {#each cols as [colName] (colName)}
            <TableBodyCell>{row[colName]}</TableBodyCell>
          {/each}
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
