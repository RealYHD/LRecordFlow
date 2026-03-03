<script lang="ts">
  import { Grid, Toolbar, type IColumnConfig, type IRow } from '@svar-ui/svelte-grid'
  import { appStateStore } from '../../state.svelte'
  import { SvelteSet } from 'svelte/reactivity'

  async function loadRecords(): Promise<{
    columns: IColumnConfig[]
    records: IRow[]
  }> {
    let localRepoPath: string = appStateStore.state.activeRepository.local
    let columns: IColumnConfig[] = []
    let records: IRow[] = []
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
          header: [
            key,
            {
              filter: {
                type: 'text', // Type of filter
                config: {
                  icon: 'wxi-search', // Optional icon for the filter input
                  clear: true // Allow clearing the input
                }
              }
            }
          ],
          resize: true,
          sort: true
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
