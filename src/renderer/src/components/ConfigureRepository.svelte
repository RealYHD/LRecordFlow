<script lang="ts">
  import { onMount } from 'svelte'
  import {
    MetadataValueType,
    validateMetadataKey,
    type RepositoryConfiguration
  } from '../lib/repo.svelte'
  import { Button, ButtonGroup, Input, Label, Span } from 'flowbite-svelte'
  import { PlusOutline } from 'flowbite-svelte-icons'
  import ConfigureMetadataDescriptors from './ConfigureMetadataDescriptors.svelte'

  const {
    repoConfig = $bindable()
  }: {
    repoConfig: RepositoryConfiguration
  } = $props()

  let metadataKeyToAdd: string = $state('')
  let metadataKeyIssues: string[] = $derived(validateMetadataKey(metadataKeyToAdd, repoConfig))

  onMount(() => {})
</script>

<div class="flex flex-col">
  <h5
    id="drawer-label"
    class="mb-6 inline-flex items-center text-base font-semibold text-gray-500 uppercase dark:text-gray-400"
  >
    Repository Configuration
  </h5>
  <div>
    <div class="mb-4 flex flex-1">
      <div>
        <div class="mb-4">
          <Label class="mb-2">Define metadata</Label>
          <ButtonGroup>
            <Input bind:value={metadataKeyToAdd} placeholder="key" />
            <Button
              onclick={() =>
                repoConfig.defined.push({
                  key: metadataKeyToAdd,
                  value: {
                    valueType: MetadataValueType.Text,
                    options: []
                  },
                  required: false
                })}
              disabled={Boolean(metadataKeyIssues.length)}><PlusOutline /></Button
            >
          </ButtonGroup>
        </div>
        {#if repoConfig.defined.length}
          <ConfigureMetadataDescriptors
            bind:metadataDescriptors={repoConfig.defined}
            valueExamples={null}
            maxExamples={10}
          />
        {:else}
          <Span class="mx-auto py-5 px-3">No metadata associated with this record yet!</Span>
        {/if}
      </div>
    </div>
  </div>
</div>
