<script lang="ts">
  import {
    Button,
    ButtonGroup,
    Helper,
    Input,
    InputAddon,
    Label,
    Modal,
    Span
  } from 'flowbite-svelte'
  import { CirclePlusOutline, TrashBinOutline } from 'flowbite-svelte-icons'

  let {
    modalOpen = $bindable(false),
    liveRecords = $bindable(),
    liveIssues = $bindable(),
    editRecordIndex = $bindable()
  }: {
    modalOpen: boolean
    liveRecords: Record<string, string>[]
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

<Modal
  title={recordData ? `Update "${recordData['Identifier']}"` : 'Not Ready'}
  form
  bind:open={modalOpen}
>
  <div class="flex flex-col px-5 sm:px-1">
    {#each Object.entries(recordData).filter(([key]) => key != 'Identifier') as [key] (key)}
      <ButtonGroup class="w-full" color={issue[key] ? 'red' : ''}>
        <InputAddon>{key}</InputAddon>
        <InputAddon>:</InputAddon>
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
    {:else}
      <!-- TODO add indication that there's no metadata here! -->
      <Span class="mx-auto py-5 px-3">No metadata associated with this record yet!</Span>
    {/each}
    <Label class="mb-2">Add Metadata</Label>
    <ButtonGroup class="w-full">
      <Input name="add-metadata-key" type="text" bind:value={createMetadata.key} />
      <InputAddon>:</InputAddon>
      <Input name="add-metadata-value" type="text" bind:value={createMetadata.value} />
      <Button color="secondary" onclick={onAddMetadata}
        ><CirclePlusOutline class="shrink-0" /></Button
      >
    </ButtonGroup>
  </div>
</Modal>
