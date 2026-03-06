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
    MetadataValueType,
    type RepositoryConfiguration,
    type RepositoryRecordData
  } from '../lib/repo.svelte'

  let {
    repoConfig,
    liveRecords = $bindable(),
    liveIssues = $bindable(),
    editRecordIndex = $bindable()
  }: {
    repoConfig: RepositoryConfiguration
    liveRecords: RepositoryRecordData[]
    liveIssues: Record<string, string[]>[]
    editRecordIndex: number
  } = $props()
  let recordData = $derived(liveRecords[editRecordIndex])
  let requiredKeys = $derived(repoConfig.requiredMetadata.map(({ key }) => key))
  let metadataKeys: string[] = $derived(
    Array.from(
      new Set(repoConfig.requiredMetadata.map(({ key }) => key)).union(
        new Set(Object.keys(recordData))
      )
    )
  )
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
    Edit "{recordData['Identifier']}"
  </h5>

  <div class="flex flex-col">
    {#each metadataKeys.filter((key) => key != 'Identifier') as key, index (index)}
      <div class="mb-2">
        <Label>
          {key}
          {#if requiredKeys.includes(key)}
            (required by repository)
          {/if}
        </Label>
        {#if !repoConfig.requiredMetadata.find(({ key: configKey }) => configKey == key)}
          <ButtonGroup class="w-full">
            <Input name={key} type="text" bind:value={recordData[key]} required />
            <Button
              color="alternative"
              onclick={() => delete recordData[key]}
              disabled={requiredKeys.includes(key)}
            >
              <TrashBinOutline class="shrink-0" />
            </Button>
          </ButtonGroup>
        {:else if repoConfig.requiredMetadata.find(({ key: configKey }) => configKey == key).value.valueType == MetadataValueType.Number}
          <ButtonGroup class="w-full">
            <Input name={key} type="number" bind:value={recordData[key]} required />
            <Button
              color="alternative"
              onclick={() => delete recordData[key]}
              disabled={requiredKeys.includes(key)}
            >
              <TrashBinOutline class="shrink-0" />
            </Button>
          </ButtonGroup>
        {:else if repoConfig.requiredMetadata.find(({ key: configKey }) => configKey == key).value.valueType == MetadataValueType.Options}
          <ButtonGroup class="w-full">
            <Select
              name={key}
              items={repoConfig.requiredMetadata
                .find(({ key: configKey }) => configKey == key)
                .value.options.map((option) => ({ value: option, name: option }))}
              bind:value={recordData[key]}
              required
            />
            <Button
              color="alternative"
              onclick={() => delete recordData[key]}
              disabled={requiredKeys.includes(key)}
            >
              <TrashBinOutline class="shrink-0" />
            </Button>
          </ButtonGroup>
        {:else if repoConfig.requiredMetadata.find(({ key: configKey }) => configKey == key).value.valueType == MetadataValueType.Date}
          <Datepicker
            required
            bind:value={
              () => new Date(recordData[key]), (v) => (recordData[key] = v.toDateString())
            }
          />
          <div class="mt-2">
            <Button
              size="xs"
              class="w-full"
              color="alternative"
              onclick={() => delete recordData[key]}
              disabled={requiredKeys.includes(key)}
            >
              Delete
            </Button>
          </div>
        {:else if repoConfig.requiredMetadata.find(({ key: configKey }) => configKey == key).value.valueType == MetadataValueType.Text}
          <ButtonGroup class="w-full">
            <Input name={key} type="text" bind:value={recordData[key]} required />
            <Button
              color="alternative"
              onclick={() => delete recordData[key]}
              disabled={requiredKeys.includes(key)}
            >
              <TrashBinOutline class="shrink-0" />
            </Button>
          </ButtonGroup>
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
