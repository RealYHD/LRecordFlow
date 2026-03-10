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
    valueExamples = {}
  }: { metadataDescriptors: MetadataDescriptor[]; valueExamples: Record<string, string[]> } =
    $props()
</script>

<Accordion flush>
  {#each metadataDescriptors as metadataKeyValueDescriptor, index (index)}
    <AccordionItem>
      {#snippet header()}Configure "{metadataKeyValueDescriptor.key}"{/snippet}
      <div class="flex flex-wrap p-2">
        <div class="space-y-2 flex-1 pr-4 mr-2">
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
              {#each { length: metadataDescriptors[index].value.options.length }, optionIndex}
                <ButtonGroup>
                  <Input bind:value={metadataDescriptors[index].value.options[optionIndex]} />
                  <Button
                    onclick={() => metadataDescriptors[index].value.options.splice(optionIndex, 1)}
                    ><TrashBinOutline /></Button
                  >
                </ButtonGroup>
              {/each}
            </div>
          {/if}
        </div>
        {#if valueExamples[metadataKeyValueDescriptor.key]}
          <div class="w-fit">
            Examples values:
            <ul class="list-disc list-inside">
              {#each valueExamples[metadataKeyValueDescriptor.key].slice(0, 3) as example, index (index)}
                <li>{example}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </AccordionItem>
  {/each}
</Accordion>
