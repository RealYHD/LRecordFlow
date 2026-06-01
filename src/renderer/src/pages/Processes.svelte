<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte'
  import { appConfig } from '../lib/state.svelte'
</script>

<Table>
  <TableHead>
    <TableHeadCell>Process</TableHeadCell>
    <TableHeadCell>Process ID</TableHeadCell>
    <TableHeadCell>Start Time</TableHeadCell>
    <TableHeadCell>Completion Time</TableHeadCell>
    <TableHeadCell>Status</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each Object.values(appConfig.watchedProcesses) as process (process.pid)}
      <TableBodyRow>
        <TableBodyCell>{process.title}</TableBodyCell>
        <TableBodyCell>{process.pid}</TableBodyCell>
        <TableBodyCell>{process.startTime}</TableBodyCell>
        <TableBodyCell>{process.endTime}</TableBodyCell>
        <TableBodyCell>{process.status}</TableBodyCell>
      </TableBodyRow>
    {:else}
      <TableBodyRow>
        <TableBodyCell><span class="mx-auto">No ongoing processes!</span></TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
