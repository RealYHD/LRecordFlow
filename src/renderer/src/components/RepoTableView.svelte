<script lang="ts">
  import { Table, TableBody, TableHead, TableHeadCell, Tooltip } from 'flowbite-svelte'
  import {
    ClipboardCheckOutline,
    ExclamationCircleOutline,
    FloppyDiskAltOutline,
    FloppyDiskOutline
  } from 'flowbite-svelte-icons'
  import RepoColumnHeader from './RepoColumnHeader.svelte'
  import RepoTableRow from './RepoTableRow.svelte'
  import RepoTablePagination from './RepoTablePagination.svelte'
  import type {
    LockStatus,
    MetadataDescriptor,
    RepositoryRecord,
    RepositoryRecordFilter
  } from '../../../common/types/models'

  let {
    columns,
    rows,
    sorting,
    filters,
    demoFilter,
    loadingRecords,
    totalIssueCount,
    modifiedCount,
    hasFlushTimers,
    currentPage,
    totalPages,
    maxPerPage,
    onPageChange,
    onMaxPerPageChange,
    displayCount,
    totalRecords,
    onSort,
    onRemoveFilter,
    onClearFilters,
    onEdit,
    onReload,
    onOpenDir,
    onDelete
  }: {
    columns: { displayName: string; key: string; valueType: MetadataDescriptor }[]
    rows: {
      record: RepositoryRecord
      liveRecordIndex: number
      localRepoPath: string
      lockStatus: LockStatus | null | undefined
      issues: Record<string, string[]>
      modified: boolean
      flushTimer: { delay: number; flushing: boolean } | undefined
    }[]
    sorting: Record<string, boolean>
    filters: Record<string, Record<string, RepositoryRecordFilter>>
    demoFilter?: RepositoryRecordFilter
    loadingRecords: boolean
    totalIssueCount: number
    modifiedCount: number
    hasFlushTimers: boolean
    currentPage: number
    totalPages: number
    maxPerPage: number
    onPageChange: (page: number) => void
    onMaxPerPageChange: (value: number) => void
    displayCount: number
    totalRecords: number
    localRepoPath: string
    onSort: (key: string) => void
    onRemoveFilter: (filter: RepositoryRecordFilter) => void
    onClearFilters: (key: string) => void
    onEdit: (index: number) => void
    onReload: (identifier: string) => void
    onOpenDir: (localRepoPath: string, identifier: string) => void
    onDelete: (index: number) => void
  } = $props()

  let metadataDescriptors: MetadataDescriptor[] = $derived(
    columns.filter(({ key }) => key != 'Identifier')
  )
</script>

<Table hoverable={true} border={true}>
  <TableHead class="normal-case">
    <TableHeadCell class="w-fit">
      {#if loadingRecords}
        <FloppyDiskAltOutline color="blue" />
        <Tooltip>Loading records from storage...</Tooltip>
      {:else if totalIssueCount}
        <ExclamationCircleOutline color="red" />
        <Tooltip>Validation failed for {totalIssueCount} (unsaved) records</Tooltip>
      {:else if modifiedCount && hasFlushTimers}
        <FloppyDiskOutline color="yellow" />
        <Tooltip>{modifiedCount} records still pending saving...</Tooltip>
      {:else}
        <ClipboardCheckOutline color="green" />
        <Tooltip>Everything looks good and is saved!</Tooltip>
      {/if}
    </TableHeadCell>
    <TableHeadCell>Actions</TableHeadCell>
    <TableHeadCell>
      <RepoColumnHeader
        key="identifier"
        displayName="Identifier"
        {sorting}
        {filters}
        {demoFilter}
        onSort={(key) => onSort(key)}
        {onRemoveFilter}
        {onClearFilters}
      />
    </TableHeadCell>
    {#each metadataDescriptors as { key } (key)}
      <TableHeadCell>
        <RepoColumnHeader
          {key}
          displayName={key}
          {sorting}
          {filters}
          {demoFilter}
          {onSort}
          {onRemoveFilter}
          {onClearFilters}
        />
      </TableHeadCell>
    {/each}
  </TableHead>
  <TableBody>
    {#each rows as row (row.liveRecordIndex)}
      <RepoTableRow
        record={row.record}
        liveRecordIndex={row.liveRecordIndex}
        localRepoPath={row.localRepoPath}
        lockStatus={row.lockStatus}
        issues={row.issues}
        modified={row.modified}
        flushTimer={row.flushTimer}
        {metadataDescriptors}
        {onEdit}
        {onReload}
        {onOpenDir}
        {onDelete}
      />
    {/each}
  </TableBody>
</Table>
<RepoTablePagination
  {currentPage}
  {totalPages}
  {maxPerPage}
  {onPageChange}
  {onMaxPerPageChange}
  {displayCount}
  {totalRecords}
/>
