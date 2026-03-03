<script lang="ts">
  import { appStateStore } from '../../state.svelte'

  let columns: string[] = $state([])
  let records: Record<string, Record<string, object>> = $state({})

  function refreshRecords(): void {
    let localRepoPath: string = appStateStore.state.activeRepository.local
    window['repo'].getAllRepoRecords(localRepoPath).then((recordNames: string[]) => {
      recordNames.forEach((recordName) => {
        window['repo']
          .getRecordMetadata(localRepoPath, recordName)
          .then((recordMetadata: Record<string, object>) => {
            console.log(recordMetadata)
            records[recordName] = recordMetadata
            Object.keys(recordMetadata).forEach((key) => {
              console.log(key)
              if (columns.includes(key)) return
              columns.push(key)
            })
          })
      })
    })
  }
  refreshRecords()
</script>

<div class="container mx-auto my-2">
  <div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
    <table class="table">
      <!-- head -->
      <thead>
        <tr>
          <th>Identifier</th>
          {#each columns as column (column)}
            <th>{column}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each Object.entries(records) as [key, record] (key)}
          <tr>
            <th>{key}</th>
            {#each columns as column (column)}
              <td>{column in record ? record[column] : 'N/A'}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
