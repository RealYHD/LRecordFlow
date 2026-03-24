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
    Span,
    Tooltip
  } from 'flowbite-svelte'
  import { CirclePlusOutline, RefreshOutline, TrashBinOutline } from 'flowbite-svelte-icons'
  import {
    MetadataValueType,
    type MetadataDescriptor,
    type RepositoryRecord
  } from '../../../common/types/models'

  let {
    metadataDescriptors,
    liveRecords = $bindable(),
    liveIssues = $bindable(),
    editRecordIndex = $bindable(),
    refreshRecordFn
  }: {
    metadataDescriptors: MetadataDescriptor[]
    liveRecords: RepositoryRecord[]
    liveIssues: Record<string, Record<string, string[]>>
    editRecordIndex: number
    refreshRecordFn: (identifier) => void
  } = $props()
  let recordData = $derived(liveRecords[editRecordIndex])

  let recordIssues = $derived(liveIssues[liveRecords[editRecordIndex].identifier])
  let createMetadata = $state({
    key: '',
    value: ''
  })
  function onAddMetadata(): void {
    recordData.metadata[createMetadata.key] = createMetadata.value
    createMetadata.key = ''
    createMetadata.value = ''
  }
</script>

<div>
  <h5
    id="drawer-label"
    class="mb-6 inline-flex items-center text-base font-semibold text-gray-500 uppercase dark:text-gray-400"
  >
    <span class="mr-2">
      <Button
        size="xs"
        onclick={() => refreshRecordFn(recordData.identifier)}
        color="secondary"
        pill
        outline><RefreshOutline size="xs" /></Button
      >
      <Tooltip class="normal-case">Reload from Disk</Tooltip>
    </span>
    Edit "{recordData.identifier}"
  </h5>

  <div class="flex flex-col">
    <div class="mb-2"></div>
    {#each metadataDescriptors.filter(({ key }) => key != 'Identifier') as { key, required, value }, index (index)}
      <div class="mb-2">
        <Label>
          {key}
          {#if required}
            (Required by Repository)
          {:else if !recordData.metadata[key]}
            (Defined by Other Record)
          {/if}
        </Label>
        {#if value.valueType == MetadataValueType.Number}
          <Input name={key} type="number" bind:value={recordData.metadata[key]} required />
        {:else if value.valueType == MetadataValueType.Options}
          <Select
            name={key}
            items={value.options.map((option) => ({ value: option, name: option }))}
            bind:value={recordData.metadata[key]}
            required
          />
        {:else if value.valueType == MetadataValueType.Date}
          <Datepicker
            required
            bind:value={
              () =>
                isNaN(Date.parse(recordData.metadata[key]))
                  ? undefined
                  : new Date(recordData.metadata[key]),
              (v) => (recordData.metadata[key] = v.toDateString())
            }
          />
        {:else if value.valueType == MetadataValueType.Text}
          <Input name={key} type="text" bind:value={recordData.metadata[key]} required />
        {:else if value.valueType == MetadataValueType.File}
          <Select
            name={key}
            items={recordData.files.map((filename) => ({ value: filename, name: filename }))}
            bind:value={recordData.metadata[key]}
            required
          />
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
        {#if recordData.metadata[key]}
          <div class="mt-2">
            <Button
              size="xs"
              class="w-full"
              color="alternative"
              onclick={() => delete recordData.metadata[key]}
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
