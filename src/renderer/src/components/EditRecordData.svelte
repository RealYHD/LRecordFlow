<script lang="ts">
  import {
    Button,
    ButtonGroup,
    Datepicker,
    Helper,
    Input,
    InputAddon,
    Label,
    Select,
    Span
  } from 'flowbite-svelte'
  import { CirclePlusOutline, TrashBinOutline } from 'flowbite-svelte-icons'
  import {
    identifierKey,
    MetadataValueType,
    type MetadataDescriptor,
    type RepositoryRecordData
  } from '../lib/repo.svelte'

  let {
    metadataDescriptors,
    liveRecords = $bindable(),
    liveIssues = $bindable(),
    editRecordIndex = $bindable()
  }: {
    metadataDescriptors: MetadataDescriptor[]
    liveRecords: RepositoryRecordData[]
    liveIssues: Record<string, string[]>[]
    editRecordIndex: number
  } = $props()
  let recordData = $derived(liveRecords[editRecordIndex])

  let recordIssues = $derived(liveIssues[editRecordIndex])
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
    Edit "{recordData[identifierKey]}"
  </h5>

  <div class="flex flex-col">
    {#each metadataDescriptors.filter(({ key }) => key != identifierKey) as { key, required, value }, index (index)}
      <div class="mb-2">
        <Label>
          {key}
          {#if required}
            (Required by Repository)
          {:else if !recordData[key]}
            (Defined by Other Record)
          {/if}
        </Label>
        {#if value.valueType == MetadataValueType.Number}
          <Input name={key} type="number" bind:value={recordData[key]} required />
        {:else if value.valueType == MetadataValueType.Options}
          <Select
            name={key}
            items={value.options.map((option) => ({ value: option, name: option }))}
            bind:value={recordData[key]}
            required
          />
        {:else if value.valueType == MetadataValueType.Date}
          <Datepicker
            required
            bind:value={
              () => (isNaN(Date.parse(recordData[key])) ? undefined : new Date(recordData[key])),
              (v) => (recordData[key] = v.toDateString())
            }
          />
        {:else if value.valueType == MetadataValueType.Text}
          <Input name={key} type="text" bind:value={recordData[key]} required />
        {/if}

        {#if recordIssues[key].length}
          <Helper color="red">
            <ul>
              {#each recordIssues[key] as recordKeyIssues (recordKeyIssues)}
                <li>{recordKeyIssues}</li>
              {/each}
            </ul>
          </Helper>
        {/if}
        {#if recordData[key]}
          <div class="mt-2">
            <Button
              size="xs"
              class="w-full"
              color="alternative"
              onclick={() => delete recordData[key]}
              disabled={required}
            >
              <TrashBinOutline /> Delete
            </Button>
          </div>
        {/if}
      </div>
    {:else}
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
