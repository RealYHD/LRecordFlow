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
    Checkbox,
    Input,
    Label,
    Select,
    Span
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
          <Accordion flush>
            {#each repoConfig.defined as metadataKeyValueDescriptor, index (index)}
              <AccordionItem>
                {#snippet header()}Configure "{metadataKeyValueDescriptor.key}"{/snippet}
                <div class="space-y-2">
                  <div>
                    <Label class="mb-2">Set value type</Label>
                    <Select
                      class="mt-2"
                      items={Object.entries(MetadataValueType).map(([name, value]) => ({
                        value,
                        name
                      }))}
                      bind:value={repoConfig.defined[index].value.valueType}
                    />
                  </div>
                  <div>
                    <Checkbox bind:checked={repoConfig.defined[index].required}>Required</Checkbox>
                  </div>
                  {#if repoConfig.defined[index].value.valueType == MetadataValueType.Options}
                    <div class="mt-2 space-y-2">
                      <Label>Add option</Label>
                      <ButtonGroup>
                        <Input id="" bind:value={metadataKeyOptionToAdd} />
                        <Button
                          onclick={() => {
                            metadataKeyOptionToAdd = ''
                            repoConfig.defined[index].value.options.push(metadataKeyOptionToAdd)
                          }}
                          disabled={repoConfig.defined[index].value.options.includes(
                            metadataKeyOptionToAdd
                          )}><PlusOutline /></Button
                        >
                      </ButtonGroup>
                      {#each { length: repoConfig.defined[index].value.options.length }, optionIndex}
                        <ButtonGroup>
                          <Input
                            bind:value={repoConfig.defined[index].value.options[optionIndex]}
                          />
                          <Button
                            onclick={() =>
                              repoConfig.defined[index].value.options.splice(optionIndex, 1)}
                            ><TrashBinOutline /></Button
                          >
                        </ButtonGroup>
                      {/each}
                    </div>
                  {/if}
                </div>
              </AccordionItem>
            {/each}
          </Accordion>
        {:else}
          <Span class="mx-auto py-5 px-3">No metadata associated with this record yet!</Span>
        {/if}
        <!-- TODO implement adding column configurations -->
      </div>
      <div>
        <!-- TODO implement adding configuring the columns -->
      </div>
    </div>
  </div>
</div>
