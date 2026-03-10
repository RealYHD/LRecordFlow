<script lang="ts">
  import { Button } from 'flowbite-svelte'
  import {
    MetadataValueType,
    type MetadataDescriptor,
    type RepositoryConfiguration
  } from '../lib/repo.svelte'
  import { selectSingleFileOfType } from '../lib/dialog.svelte'
  import { getCSVDataSample } from '../lib/tabular.svelte'
  import ConfigureMetadataDescriptors from './ConfigureMetadataDescriptors.svelte'

  let {
    repoConfig = $bindable(),
    definedMetadataDescriptors,
    addMetadataDescriptorCallback
  }: {
    repoConfig: RepositoryConfiguration
    definedMetadataDescriptors: MetadataDescriptor[]
    addMetadataDescriptorCallback: (metadataDescriptors: MetadataDescriptor[]) => void
  } = $props()

  let csvPath: string = $state('')
  let tabularSampleData: Record<string, string> = $state({})
  let definedMetadataDescriptorsById = $derived(
    Object.fromEntries(definedMetadataDescriptors.map((desc) => [desc.key, desc]))
  )
  let metadata: MetadataDescriptor[] = $state([])

  function openTabular(path: string): void {
    metadata.length = 0
    csvPath = path
    getCSVDataSample(csvPath).then((value) => {
      tabularSampleData = value
      for (const tabularKey in tabularSampleData) {
        let metadataDescriptor: MetadataDescriptor = {
          key: tabularKey,
          required: false,
          value: {
            valueType: MetadataValueType.Text,
            options: []
          }
        }
        if (definedMetadataDescriptorsById[tabularKey]) {
          Object.assign(
            metadataDescriptor,
            $state.snapshot(definedMetadataDescriptorsById[tabularKey])
          )
        }
        metadata.push(metadataDescriptor)
      }
    })
  }
</script>

<Button
  onclick={() =>
    selectSingleFileOfType([{ name: 'Comma separated value', extensions: ['.csv'] }]).then((path) =>
      openTabular(path)
    )}>Open</Button
>

<ConfigureMetadataDescriptors bind:metadataDescriptors={metadata} />

<Button onclick={() => addMetadataDescriptorCallback($state.snapshot(metadata))}>Import</Button>
