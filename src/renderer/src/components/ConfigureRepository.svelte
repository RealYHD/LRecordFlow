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
    repoConfig = $bindable()
  }: {
    repoConfig: RepositoryConfiguration
  } = $props()

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
                repoConfig.requiredMetadata.push({
                  key: metadataKeyToAdd,
                  value: {
                    valueType: MetadataValueType.Text,
                    options: []
                  }
                })}
              disabled={Boolean(metadataKeyIssues.length)}><PlusOutline /></Button
            >
          </ButtonGroup>
        </div>
        {#if repoConfig.requiredMetadata.length}
          <Accordion flush>
            {#each repoConfig.requiredMetadata as metadataKeyValueDescriptor, index (index)}
              <AccordionItem>
                {#snippet header()}Configure "{metadataKeyValueDescriptor.key}"{/snippet}
                <Label class="mb-2">Set value type</Label>
                <Select
                  class="mt-2"
                  items={Object.entries(MetadataValueType).map(([name, value]) => ({
                    value,
                    name
                  }))}
                  bind:value={repoConfig.requiredMetadata[index].value.valueType}
                />
                {#if repoConfig.requiredMetadata[index].value.valueType == MetadataValueType.Options}
                  <div class="mt-2 space-y-2">
                    <Label class="mb-2">Add option</Label>
                    <ButtonGroup>
                      <Input id="" bind:value={metadataKeyOptionToAdd} />
                      <Button
                        onclick={() =>
                          repoConfig.requiredMetadata[index].value.options.push(
                            metadataKeyOptionToAdd
                          )}
                        disabled={repoConfig.requiredMetadata[index].value.options.includes(
                          metadataKeyOptionToAdd
                        )}><PlusOutline /></Button
                      >
                    </ButtonGroup>
                    {#each { length: repoConfig.requiredMetadata[index].value.options.length }, optionIndex}
                      <ButtonGroup>
                        <Input
                          bind:value={repoConfig.requiredMetadata[index].value.options[optionIndex]}
                        />
                        <Button
                          onclick={() =>
                            repoConfig.requiredMetadata[index].value.options.splice(optionIndex, 1)}
                          ><TrashBinOutline /></Button
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
  </div>
</div>
