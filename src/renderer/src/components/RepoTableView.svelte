<!--
  RepoTableView.svelte

  The table wrapper that composes the column headers, table body (rows),
  and pagination controls. It delegates rendering to RepoColumnHeader,
  RepoTableRow, and RepoTablePagination while managing the table structure.

  Props:
    - columns: MetadataDescriptor[] — table columns
    - rows: { record: RepositoryRecord; liveRecordIndex: number }[] — table rows
    - sorting: Record<string, 'asc' | 'desc'> — sort state per column
    - filters: RepositoryRecordFilter[] — active filters
    - demoFilter: RepositoryRecordFilter | null — demo/filter hint
    - loadingRecords: boolean — loading state
    - totalIssueCount: number — total issue count
    - modifiedCount: number — count of modified records
    - hasFlushTimers: boolean — whether flush timers are active
    - currentPage: number — current page
    - totalPages: number — total pages
    - maxPerPage: number — records per page
    - displayCount: number — records on current page
    - totalRecords: number — total records
    - localRepoPath: string — local repo path
    - onSort: (key: string) => void — sort callback
    - onRemoveFilter: (filter: RepositoryRecordFilter) => void — remove filter callback
    - onClearFilters: (key: string) => void — clear filters callback
    - onEdit: (record: RepositoryRecord) => void — edit callback
    - onReload: (record: RepositoryRecord) => void — reload callback
    - onOpenDir: (record: RepositoryRecord) => void — open directory callback
    - onDelete: (record: RepositoryRecord) => void — delete callback
    - onPageChange: (page: number) => void — page change callback
    - onMaxPerPageChange: (value: number) => void — records per page change callback

  Usage:
    <RepoTableView {columns} {rows} {sorting} {filters} {demoFilter}
      {loadingRecords} {totalIssueCount} {modifiedCount} {hasFlushTimers}
      {currentPage} {totalPages} {maxPerPage} {displayCount} {totalRecords}
      {localRepoPath} {onSort} {onRemoveFilter} {onClearFilters}
      {onEdit} {onReload} {onOpenDir} {onDelete}
      onPagChange={(p) => currentPage = p} onMaxPerPageChange={(v) => maxPerPage = v} />
-->

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
