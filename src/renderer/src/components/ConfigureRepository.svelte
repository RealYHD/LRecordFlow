<script lang="ts">
  import { onMount } from 'svelte'
  import {
    MetadataValueType,
    validateMetadataKey,
    type RepositoryConfiguration
  } from '../lib/repo.svelte'
  import {
    Accordion,
    AccordionItem,
    Button,
    ButtonGroup,
    Input,
    Label,
    Select
  } from 'flowbite-svelte'
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons'

  const {
    repoConfig,
    completionCallbackFn
  }: {
    repoConfig: RepositoryConfiguration
    completionCallbackFn: (updatedConfig: RepositoryConfiguration) => void
  } = $props()

  // TODO maybe there's a better way of doing this
  // svelte-ignore state_referenced_locally
  let modifiedRepoConfig = $state(repoConfig)

  let metadataKeyToAdd: string = $state('')
  let metadataKeyIssues: string[] = $derived(validateMetadataKey(metadataKeyToAdd, repoConfig))

  let metadataKeyOptionToAdd: string = $state('')

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
          <Label class="mb-2">Add key requirement</Label>
          <ButtonGroup>
            <Input bind:value={metadataKeyToAdd} placeholder="key" />
            <Button
              onclick={() =>
                (modifiedRepoConfig.requiredMetadata[metadataKeyToAdd] = [
                  MetadataValueType.Text,
                  []
                ])}
              disabled={Boolean(metadataKeyIssues.length)}><PlusOutline /></Button
            >
          </ButtonGroup>
        </div>
        {#if Object.keys(modifiedRepoConfig.requiredMetadata).length}
          <Accordion flush>
            {#each Object.entries(modifiedRepoConfig.requiredMetadata) as [key], index (index)}
              <AccordionItem>
                {#snippet header()}Configure "{key}"{/snippet}
                <Label class="mb-2">Set value type</Label>
                <Select
                  class="mt-2"
                  items={Object.entries(MetadataValueType).map(([name, value]) => ({
                    value,
                    name
                  }))}
                  bind:value={modifiedRepoConfig.requiredMetadata[key][0]}
                />
                {#if modifiedRepoConfig.requiredMetadata[key][0] == MetadataValueType.Options}
                  <div class="mt-2 space-y-2">
                    <Label class="mb-2">Add option</Label>
                    <ButtonGroup>
                      <Input id="" bind:value={metadataKeyOptionToAdd} />
                      <Button
                        onclick={() => {
                          console.log($state.snapshot(modifiedRepoConfig.requiredMetadata[key]))
                          modifiedRepoConfig.requiredMetadata[key][1].push(metadataKeyOptionToAdd)
                        }}><PlusOutline /></Button
                      >
                    </ButtonGroup>
                    {#each modifiedRepoConfig.requiredMetadata[key][1] as options, optionIndex (optionIndex)}
                      <ButtonGroup>
                        <Input
                          bind:value={modifiedRepoConfig.requiredMetadata[key][1][optionIndex]}
                        />
                        <Button
                          onclick={() => {
                            if (
                              !options.includes(
                                modifiedRepoConfig.requiredMetadata[key][1][optionIndex]
                              )
                            ) {
                              modifiedRepoConfig.requiredMetadata[1].splice(optionIndex, 1)
                            }
                          }}><TrashBinOutline /></Button
                        >
                      </ButtonGroup>
                    {/each}
                  </div>
                {/if}
              </AccordionItem>
            {/each}
          </Accordion>
        {/if}
        <!-- TODO implement adding column configurations -->
      </div>
      <div>
        <!-- TODO implement adding configuring the columns -->
      </div>
    </div>
    <div>
      <Button
        onclick={() => {
          completionCallbackFn($state.snapshot(modifiedRepoConfig))
        }}
        class="w-fit mx-auto">Save</Button
      >
      <Button class="w-fit mx-auto" outline>Cancel</Button>
    </div>
  </div>
</div>
