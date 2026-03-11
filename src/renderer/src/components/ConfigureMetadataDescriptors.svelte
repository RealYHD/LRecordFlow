<script lang="ts">
  import {
    Accordion,
    AccordionItem,
    Button,
    ButtonGroup,
    Checkbox,
    Input,
    Label,
    Select
  } from 'flowbite-svelte'
  import { MetadataValueType, type MetadataDescriptor } from '../lib/repo.svelte'
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons'
  let metadataKeyOptionToAdd: string = $state('')
  let {
    metadataDescriptors = $bindable(),
    valueExamples = null,
    maxExamples = 10
  }: {
    metadataDescriptors: MetadataDescriptor[]
    valueExamples: Record<string, string[]> | null
    maxExamples: number
  } = $props()
</script>

<Accordion flush>
  {#each metadataDescriptors as metadataKeyValueDescriptor, index (index)}
    <AccordionItem>
      {#snippet header()}Configure "{metadataKeyValueDescriptor.key}"{/snippet}
      <div class="flex flex-wrap p-2 items-stretch">
        <div class="flex-1 space-y-2 px-4 border-l-2">
          <div>
            <Label class="mb-2">Set value type</Label>
            <Select
              class="mt-2"
              items={Object.entries(MetadataValueType).map(([name, value]) => ({
                value,
                name
              }))}
              bind:value={metadataDescriptors[index].value.valueType}
            />
          </div>
          <div>
            <Checkbox bind:checked={metadataDescriptors[index].required}>Required</Checkbox>
          </div>
          {#if metadataDescriptors[index].value.valueType == MetadataValueType.Options}
            <div class="mt-2 space-y-2">
              <div>
                <Label>Add option</Label>
                <ButtonGroup>
                  <Input id="" bind:value={metadataKeyOptionToAdd} />
                  <Button
                    onclick={() => {
                      metadataKeyOptionToAdd = ''
                      metadataDescriptors[index].value.options.push(metadataKeyOptionToAdd)
                    }}
                    disabled={metadataDescriptors[index].value.options.includes(
                      metadataKeyOptionToAdd
                    )}><PlusOutline /></Button
                  >
                </ButtonGroup>
              </div>
              <div class="flex-1 space-y-1 overflow-y-auto max-h-96">
                {#each { length: metadataDescriptors[index].value.options.length }, optionIndex}
                  <div>
                    <ButtonGroup>
                      <Input bind:value={metadataDescriptors[index].value.options[optionIndex]} />
                      <Button
                        onclick={() =>
                          metadataDescriptors[index].value.options.splice(optionIndex, 1)}
                        ><TrashBinOutline /></Button
                      >
                    </ButtonGroup>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        <!-- List Example Values -->
        {#if valueExamples != null}
          <div class="w-fit px-4 border-l-2 flex flex-col">
            Example Values:
            <ul class="flex-1 list-disc list-inside">
              {#each valueExamples[metadataKeyValueDescriptor.key].slice(0, maxExamples) as example, index (index)}
                <li>"{example}"</li>
              {:else}
                No preview of values found!
              {/each}
              {#if valueExamples[metadataKeyValueDescriptor.key].length > maxExamples}
                <li>
                  and {valueExamples[metadataKeyValueDescriptor.key].length - maxExamples} more...
                </li>
              {/if}
            </ul>
          </div>
        {/if}
      </div>
    </AccordionItem>
  {/each}
</Accordion>
