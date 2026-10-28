<!--
  RepoTablePagination.svelte

  Pagination controls for the repository table. Displays the current page,
  total pages, records per page selector, and total record count.

  Props:
    - currentPage: number — current page number
    - totalPages: number — total number of pages
    - maxPerPage: number — records per page
    - displayCount: number — records on the current page
    - totalRecords: number — total record count
    - onPageChange: (page: number) => void — page change callback
    - onMaxPerPageChange: (value: number) => void — records per page change callback

  Usage:
    <RepoTablePagination {currentPage} {totalPages} {maxPerPage}
      {displayCount} {totalRecords}
      onPageChange={(p) => currentPage = p}
      onMaxPerPageChange={(v) => maxPerPage = v} />
-->

<script lang="ts">
  import { PaginationNav } from 'flowbite-svelte'
  import { ArrowLeftOutline, ArrowRightOutline } from 'flowbite-svelte-icons'

  let {
    currentPage,
    totalPages,
    maxPerPage,
    onPageChange,
    onMaxPerPageChange,
    displayCount,
    totalRecords
  }: {
    currentPage: number
    totalPages: number
    maxPerPage: number
    onPageChange: (page: number) => void
    onMaxPerPageChange: (value: number) => void
    displayCount: number
    totalRecords: number
  } = $props()
</script>

<div class="pl-1 mx-auto w-fit my-2">
  <div class="w-fit mb-2 font-light text-sm">
    Displaying {displayCount} records out of {totalRecords}. Showing maximum of
    <input
      class="w-10 text-sm border-0 border-b p-0 m-0 mx-1"
      type="number"
      min="1"
      bind:value={maxPerPage}
      onchange={(e) => onMaxPerPageChange(Number(e.target.value))}
    />
    per page. Currently on page {currentPage} of {totalPages}.
  </div>
  <div class="w-fit mx-auto">
    <PaginationNav {currentPage} {totalPages} onPageChange={(page) => onPageChange(page)}>
      {#snippet prevContent()}
        <span class="sr-only">Previous</span>
        <ArrowLeftOutline class="h-5 w-5" />
      {/snippet}
      {#snippet nextContent()}
        <span class="sr-only">Next</span>
        <ArrowRightOutline class="h-5 w-5" />
      {/snippet}
    </PaginationNav>
  </div>
</div>
