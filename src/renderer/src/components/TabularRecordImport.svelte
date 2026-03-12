<script lang="ts">
  import { Button, Label, Select } from 'flowbite-svelte'
  import {
    importRepoRecordsFromTabular,
    MetadataValueType,
    type MetadataDescriptor,
    type RepositoryRecord
  } from '../lib/repo.svelte'
  import { selectSingleFileOfType } from '../lib/dialog.svelte'
  import { previewTabular } from '../lib/tabular.svelte'
  import ConfigureMetadataDescriptors from './ConfigureMetadataDescriptors.svelte'
  import { appStateStore, trackPromise } from '../lib/state.svelte'

  let {
    definedMetadataDescriptors,
    currentRecordsById,
    RecordImportCallback
  }: {
    definedMetadataDescriptors: MetadataDescriptor[]
    currentRecordsById: Record<string, RepositoryRecord>
    RecordImportCallback: (identifiers: string[], metadataDescriptors: MetadataDescriptor[]) => void
  } = $props()
  $inspect(definedMetadataDescriptors)
  let tabularPath: string = $state('')
  let ImportPromiseDescId: string = $derived(`Import Tabular @ ${tabularPath}`)
  let definedMetadataDescriptorsByKey: Record<string, MetadataDescriptor> = $derived(
    Object.fromEntries(definedMetadataDescriptors.map((desc) => [desc.key, desc]))
  )
  let metadataUniqueValues: Record<string, string[]> = $state({})
  let metadataDescriptors: MetadataDescriptor[] = $derived.by(() => {
    let descs: MetadataDescriptor[] = $state([])
    for (const tabularKey in metadataUniqueValues) {
      descs.push({
        key: tabularKey,
        required: false,
        value: {
          valueType: MetadataValueType.Text,
          options: []
        }
      })
      let desc = descs[descs.length - 1]
      if (definedMetadataDescriptorsByKey[tabularKey]) {
        Object.assign(desc, $state.snapshot(definedMetadataDescriptorsByKey[tabularKey]))
      }
      let uniqueValuesForKey = metadataUniqueValues[tabularKey].filter(
        (val) => val.trim() != '' && !desc.value.options.includes(val)
      )
      if (uniqueValuesForKey.length > 0) desc.value.options.push(...uniqueValuesForKey)
    }
    return descs
  })
  let identifierCol: string = $state('')
  let pathCols: string[] = $derived(
    metadataDescriptors
      .filter((desc) => desc.value.valueType == MetadataValueType.File)
      .map((desc) => desc.key)
  )
  let overlappingIdentifiers = $derived(
    Array.from(
      new Set(metadataUniqueValues[identifierCol]).intersection(
        new Set(Object.keys(currentRecordsById))
      )
    )
  )
  let metadataIssues: Record<string, string[]> = $derived.by(() => {
    // TODO show what records don't conform to current settings
    return {}
  })
  let working: boolean = $derived(
    tabularPath.length ? Boolean(appStateStore.promises.get(ImportPromiseDescId)) : false
  )

  function openTabular(path: string): void {
    if (!path.length) return
    tabularPath = path
    previewTabular(tabularPath).then((value) => {
      metadataUniqueValues = {}
      Object.assign(metadataUniqueValues, value)
    })
  }
</script>

<div>Import Records from Tabular</div>
<div
  class="flex flex-col justify-center items-center align-middle content-center flex-wrap space-y-4"
>
  <Button
    class="w-fit"
    disabled={working}
    onclick={() => {
      working = true
      selectSingleFileOfType([{ name: 'Comma separated value', extensions: ['csv'] }]).then(
        (path) => {
          working = false
          openTabular(path)
        }
      )
    }}>{metadataDescriptors.length ? 'Change' : 'Open'} Tabular</Button
  >
  {#if metadataDescriptors.length}
    <Label>Select Identifier Column</Label>
    <Select
      disabled={working}
      items={metadataDescriptors.map((desc) => ({ name: desc.key, value: desc.key }))}
      bind:value={identifierCol}
    />
  {/if}
  {#if identifierCol != '' && metadataDescriptors.length}
    <div>
      The following record identifiers already exist within the repository:
      <ul class="flex-1 list-disc list-inside max-h-96 overflow-y-auto">
        {#each overlappingIdentifiers as identifier, index (index)}
          <li>{identifier}</li>
        {/each}
      </ul>
    </div>
    <ConfigureMetadataDescriptors
      bind:metadataDescriptors
      valueExamples={metadataUniqueValues}
      {metadataIssues}
      maxExamples={10}
      hideMetadataKeys={[identifierCol]}
    />
    <Button
      class="w-fit"
      disabled={working}
      onclick={() => {
        working = true
        trackPromise({
          id: $state.snapshot(ImportPromiseDescId),
          title: `Import "${tabularPath}"`,
          startTime: new Date(),
          promise: importRepoRecordsFromTabular(
            appStateStore.state.openedRepoPath,
            tabularPath,
            identifierCol,
            pathCols
          ).then((identifiers) => {
            console.log('adding...')
            console.log(identifiers)
            RecordImportCallback(
              identifiers,
              metadataDescriptors.filter((desc) => desc.key != identifierCol)
            )
            working = false
          }),
          status: `Importing "${tabularPath}"`,
          endTime: null
        })
      }}>Import</Button
    >
  {:else}
    <div class="m-8 text-center">
      Nothing to show! Begin by opening a tabular file for exploration and metadata mapping.
    </div>
  {/if}
</div>
