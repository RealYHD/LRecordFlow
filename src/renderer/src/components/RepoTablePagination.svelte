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
