<script lang="ts">
  import { Button, ButtonGroup, Helper, Input, InputAddon, Label, Span } from 'flowbite-svelte'
  import { CirclePlusOutline, TrashBinOutline } from 'flowbite-svelte-icons'
  import type { RepositoryRecordData } from '../lib/repo.svelte'

  let {
    liveRecords = $bindable(),
    liveIssues = $bindable(),
    editRecordIndex = $bindable()
  }: {
    liveRecords: RepositoryRecordData[]
    liveIssues: Record<string, string[]>[]
    editRecordIndex: number
  } = $props()
  let recordData = $derived(liveRecords[editRecordIndex])
  let issue = $derived(liveIssues[editRecordIndex])
  let createMetadata = $state({
    key: '',
    value: ''
  })
  function onAddMetadata(): void {
    recordData[createMetadata.key] = createMetadata.value
    createMetadata.key = ''
    createMetadata.value = ''
  }
</script>

<div>
  <h5
    id="drawer-label"
    class="mb-6 inline-flex items-center text-base font-semibold text-gray-500 uppercase dark:text-gray-400"
  >
    Edit "{recordData['Identifier']}"
  </h5>

  <div class="flex flex-col">
    {#each Object.entries(recordData).filter(([key]) => key != 'Identifier') as [key] (key)}
      <div class="mb-2">
        <Label>{key}</Label>
        <ButtonGroup class="w-full">
          <Input name={key} type="text" bind:value={recordData[key]} required />
          <Button color="alternative" onclick={() => delete recordData[key]}
            ><TrashBinOutline class="shrink-0" /></Button
          >
        </ButtonGroup>
        {#if issue[key].length}
          <Helper color="red">
            The following issues were found with the metadata entry:
            <ul>
              {#each issue[key] as recordKeyIssues (recordKeyIssues)}
                <li>{recordKeyIssues}</li>
              {/each}
            </ul>
          </Helper>
        {/if}
      </div>
    {:else}
      <!-- TODO add indication that there's no metadata here! -->
      <Span class="mx-auto py-5 px-3">No metadata associated with this record yet!</Span>
    {/each}
    <Label class="mb-2">Add Metadata</Label>
    <ButtonGroup class="w-full">
      <Input class="w-3/12" name="add-metadata-key" type="text" bind:value={createMetadata.key} />
      <InputAddon>:</InputAddon>
      <Input name="add-metadata-value" type="text" bind:value={createMetadata.value} />
      <Button color="secondary" onclick={onAddMetadata}
        ><CirclePlusOutline class="shrink-0" /></Button
      >
    </ButtonGroup>
  </div>
</div>
