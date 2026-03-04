<script lang="ts">
  import { route } from '../../lib/router.svelte'
  import { findColumns, loadRecords } from '../../lib/repo.svelte'
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte'

  const cols: [string, string[]][] = $state([])
  const rows: Record<string, string>[] = $state([])

  loadRecords(route.params.repository).then((records) => {
    findColumns(records).then((columns) => {
      cols.push(...columns)
    })
    rows.push(...records)
  })
  $inspect(cols).with(console.log)
  $inspect(rows).with(console.log)
</script>

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
        <TableBodyRow>
          {#each cols as [colName] (colName)}
            <TableBodyCell>{row[colName]}</TableBodyCell>
          {/each}
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
