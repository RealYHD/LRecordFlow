<!--
  RepoColumnHeader.svelte

  A sortable column header with filter popover support. Each column can be
  sorted (ascending/descending) and filtered via a dropdown menu.

  Props:
    - column: MetadataDescriptor — the column metadata
    - onSort: (key: string) => void — sort callback
    - onFilterCreated: (filter: RepositoryRecordFilter) => void — filter creation callback
    - filter: RepositoryRecordFilter | null — active filter for this column
    - isSortedAsc: boolean — whether the column is sorted ascending
    - isSortedDesc: boolean — whether the column is sorted descending

  Usage:
    <RepoColumnHeader {column} {onSort} {onFilterCreated} bind:filter
      {isSortedAsc} {isSortedDesc} />
-->

<script lang="ts">
  import { Badge, Button, Popover } from 'flowbite-svelte'
  import { AngleDownOutline, AngleUpOutline, FilterOutline } from 'flowbite-svelte-icons'
  import type { RepositoryRecordFilter } from '../../../common/types/models'

  let {
    key,
    displayName,
    sorting,
    filters,
    demoFilter,
    onSort,
    onRemoveFilter,
    onClearFilters
  }: {
    key: string
    displayName: string
    sorting: Record<string, boolean>
    filters: Record<string, Record<string, RepositoryRecordFilter>>
    demoFilter?: RepositoryRecordFilter
    onSort: (key: string) => void
    onRemoveFilter: (filter: RepositoryRecordFilter) => void
    onClearFilters: (key: string) => void
  } = $props()

  let filterList: RepositoryRecordFilter[] = $derived(
    filters[key] ? Object.values(filters[key]) : []
  )
</script>

<div class="flex items-center">
  <Button class="py-1! px-2! m-1 border-0" outline size="xs" onclick={() => onSort(key)}
    >{displayName}
    <span class="pl-1">
      {#if sorting[key] != undefined}
        {#if sorting[key]}
          <AngleUpOutline size="xs" />
        {:else}
          <AngleDownOutline size="xs" />
        {/if}
      {/if}
    </span>
  </Button>
  {#if filterList.length || (demoFilter && demoFilter.key == key)}
    <span class="relative"><FilterOutline color="orange" /> </span>
    <Popover title={`Filter on "${displayName}"`}>
      <div class="space-y-2">
        <div class="mb-3 flex">
          {#each filterList as filter (filter.identifier)}
            <Badge class="m-1" dismissable onclose={() => onRemoveFilter(filter)}
              >{filter.displayName}</Badge
            >
          {:else}
            <span class="font-light text-sm">No filters added!</span>
          {/each}
        </div>
        <div class="flex">
          <Button
            size="xs"
            class="p-1!"
            color="alternative"
            disabled={!filterList.length}
            onclick={() => onClearFilters(key)}>Clear Filters</Button
          >
        </div>
      </div>
    </Popover>
  {/if}
</div>
