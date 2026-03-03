<script lang="ts">
  import { Grid, Toolbar } from '@svar-ui/svelte-grid'
  import { appStateStore } from '../../state.svelte'
  import { SvelteSet } from 'svelte/reactivity'

  async function loadRecords(): Promise<{
    columns: Record<string, string>[]
    records: Record<string, string>[]
  }> {
    let localRepoPath: string = appStateStore.state.activeRepository.local
    let records: Record<string, string>[] = []
    let columns: Record<string, string>[] = []
    let includedColumnIds = new SvelteSet()
    let recordNames: string[] = await window['repo'].getAllRepoRecords(localRepoPath)
    for (const recordName of recordNames) {
      let recordMetadata: Record<string, string> = await window['repo'].getRecordMetadata(
        localRepoPath,
        recordName
      )
      recordMetadata['id'] = recordName
      records.push(recordMetadata)
      for (const key in recordMetadata) {
        if (includedColumnIds.has(key)) continue
        includedColumnIds.add(key)
        columns.push({
          id: key,
          header: key,
          resize: 'true'
        })
      }
    }
    return { columns, records }
  }
  let gridApi
</script>

{#await loadRecords() then { columns, records }}
  <div class="container">
    <Toolbar api={gridApi} />
    <Grid bind:this={gridApi} data={records} {columns} reorder={true} />
  </div>
{/await}
