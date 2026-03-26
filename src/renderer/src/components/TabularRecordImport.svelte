<script lang="ts">
  import { Button, Label, Select } from 'flowbite-svelte'
  import { importLRecordFlowFromTabular } from '../lib/repo.svelte'
  import { selectSingleFileOfType } from '../lib/dialog.svelte'
  import { previewTabular } from '../lib/tabular.svelte'
  import ConfigureMetadataDescriptors from './ConfigureMetadataDescriptors.svelte'
  import { isTrackedPromiseDone, openedRepo, trackPromise } from '../lib/state.svelte'
  import {
    MetadataValueType,
    type MetadataDescriptor,
    type RepositoryRecord
  } from '../../../common/types/models'

  let {
    definedMetadataDescriptors,
    currentRecordsById,
    RecordImportCallback
  }: {
    definedMetadataDescriptors: MetadataDescriptor[]
    currentRecordsById: Record<string, RepositoryRecord>
    RecordImportCallback: (identifiers: string[], metadataDescriptors: MetadataDescriptor[]) => void
  } = $props()
  let tabularPath: string = $state('')
  let ImportPromiseDescId: string = $derived(`Import Tabular @ ${tabularPath}`)
  let definedMetadataDescriptorsByKey: Record<string, MetadataDescriptor> = $derived(
    Object.fromEntries(definedMetadataDescriptors.map((desc) => [desc.key, desc]))
  )
  let metadataValueOccurrences: Record<string, Record<string, number>> = $state({})
  let metadataUniqueValues: Record<string, string[]> = $derived(
    Object.fromEntries(
      Object.entries(metadataValueOccurrences).map(([key, values]) => [key, Object.keys(values)])
    )
  )
  let metadataDescriptors: MetadataDescriptor[] = $derived.by(() => {
    let descs: MetadataDescriptor[] = $state([])
    for (const tabularKey in metadataValueOccurrences) {
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
      desc.value.options.push(...Object.keys(metadataValueOccurrences[tabularKey]))
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
      new Set(Object.keys(metadataValueOccurrences[identifierCol])).intersection(
        new Set(Object.keys(currentRecordsById))
      )
    )
  )
  let duplicateIdentifiers: string[] = $derived(
    Object.entries(metadataValueOccurrences[identifierCol] || {})
      .filter(([, occurrence]) => occurrence > 1)
      .map(([val]) => val)
  )
  let metadataIssues: Record<string, string[]> = $derived.by(() => {
    // TODO show what records don't conform to current settings
    return {}
  })
  let working: boolean = $derived(!isTrackedPromiseDone(ImportPromiseDescId))

  function openTabular(path: string): void {
    if (!path.length) return
    tabularPath = path
    previewTabular(tabularPath).then((value) => {
      metadataValueOccurrences = value
    })
    identifierCol = ''
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
      selectSingleFileOfType([{ name: 'Comma separated value', extensions: ['csv'] }]).then(
        (path) => {
          openTabular(path)
        }
      )
    }}>{tabularPath.length ? 'Change' : 'Open'} Tabular</Button
  >
  {#if tabularPath.length}
    <div>
      <Label>Select Identifier Column</Label>
      <Select
        disabled={working}
        items={metadataDescriptors.map((desc) => ({ name: desc.key, value: desc.key }))}
        bind:value={identifierCol}
      />
    </div>
    {#if identifierCol != ''}
      {#if duplicateIdentifiers.length}
        <div>
          The selected column to act as record identifiers has repeated values. Identifiers within a
          repository must be unique. The following identifiers are not unique:
          <ul class="flex-1 list-disc list-inside max-h-96 overflow-y-auto">
            {#each duplicateIdentifiers as identifier, index (index)}
              <li>"{identifier}"</li>
            {/each}
          </ul>
        </div>
      {:else}
        <div>
          {#if overlappingIdentifiers.length}
            The following record identifiers already exist within the repository and <strong
              >will be overwritten</strong
            >:
            <ul class="flex-1 list-disc list-inside max-h-96 overflow-y-auto">
              {#each overlappingIdentifiers as identifier, index (index)}
                <li>{identifier}</li>
              {/each}
            </ul>
          {/if}
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
            trackPromise($state.snapshot(ImportPromiseDescId), (message) => {
              message.title = 'Importing "${tabularPath}"'
              message.description = 'Importing tabular Dataset'
              return importLRecordFlowFromTabular(
                openedRepo.repo.local,
                tabularPath,
                identifierCol,
                pathCols
              ).then((identifiers) => {
                RecordImportCallback(
                  identifiers,
                  metadataDescriptors.filter((desc) => desc.key != identifierCol)
                )
              })
            })
          }}>Import</Button
        >
      {/if}
    {/if}
  {:else}
    <div class="m-8 text-center">
      Nothing to show! Begin by opening a tabular file for exploration and metadata mapping.
    </div>
  {/if}
</div>
