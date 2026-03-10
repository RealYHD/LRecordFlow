<script lang="ts">
  import { Button } from 'flowbite-svelte'
  import { MetadataValueType, type MetadataDescriptor } from '../lib/repo.svelte'
  import { selectSingleFileOfType } from '../lib/dialog.svelte'
  import { previewTabular } from '../lib/tabular.svelte'
  import ConfigureMetadataDescriptors from './ConfigureMetadataDescriptors.svelte'

  let {
    definedMetadataDescriptors,
    addMetadataDescriptorCallback
  }: {
    definedMetadataDescriptors: MetadataDescriptor[]
    addMetadataDescriptorCallback: (metadataDescriptors: MetadataDescriptor[]) => void
  } = $props()

  let tabularPath: string = $state('')
  let tabularDataPreview: Record<string, string>[] = $state([])
  let keyExamples: Record<string, string[]> = $derived.by(() => {
    let generatedExamples: Record<string, string[]> = {}
    for (const key of Object.keys(tabularDataPreview[0])) {
      generatedExamples[key] = tabularDataPreview.map((data) => data[key])
    }
    return generatedExamples
  })
  let definedMetadataDescriptorsById = $derived(
    Object.fromEntries(definedMetadataDescriptors.map((desc) => [desc.key, desc]))
  )
  let metadata: MetadataDescriptor[] = $state([])

  function openTabular(path: string): void {
    if (!path.length) return
    metadata.length = 0
    tabularDataPreview.length = 0
    tabularPath = path
    previewTabular(tabularPath, 3).then((value) => {
      tabularDataPreview.push(...value)
      for (const tabularKey in tabularDataPreview[0]) {
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

<div>Import Tabular</div>
<div
  class="flex flex-col justify-center items-center align-middle content-center flex-wrap space-y-4"
>
  <Button
    class="w-fit"
    onclick={() =>
      selectSingleFileOfType([{ name: 'Comma separated value', extensions: ['csv'] }]).then(
        (path) => openTabular(path)
      )}>{metadata.length ? 'Change' : 'Open'} Tabular</Button
  >
  {#if metadata.length}
    <ConfigureMetadataDescriptors bind:metadataDescriptors={metadata} valueExamples={keyExamples} />
    <Button class="w-fit" onclick={() => addMetadataDescriptorCallback(metadata)}>Import</Button>
  {:else}
    <div class="m-8 text-center">
      Nothing to show! Begin by opening a tabular file for exploration and metadata mapping.
    </div>
  {/if}
</div>
