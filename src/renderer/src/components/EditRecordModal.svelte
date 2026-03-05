<script lang="ts">
  import { Button, ButtonGroup, Input, InputAddon, Label, Modal, Span } from 'flowbite-svelte'

  let {
    modalOpen = $bindable(false),
    recordData = $bindable()
  }: {
    modalOpen: boolean
    localRepoPath: string
    recordData: Record<string, string>
  } = $props()

  let create = $derived(!recordData['Identifier'])

  let createMetadata = $state({
    key: '',
    value: ''
  })
  function onAddMetadata(): void {
    recordData[createMetadata.key] = createMetadata.value
    createMetadata.key = ''
    createMetadata.value = ''
  }
</script>

<Modal
  title={create ? `Add new Record` : `Update "${recordData['Identifier']}"`}
  form
  bind:open={modalOpen}
>
  <div class="flex flex-col space-y-6 px-4 sm:px-1">
    {#each Object.entries(recordData) as [key] (key)}
      <Label class="space-y-2">
        <Span>{key}</Span>
        <Input
          name={key}
          type="text"
          bind:value={recordData[key]}
          required={key != 'Identifier'}
          disabled={key == 'Identifier'}
        />
      </Label>
    {/each}
    <Label class="space-y-2">
      <Span>Add Metadata</Span>
      <ButtonGroup class="w-full">
        <Input name="add-metadata-key" type="text" bind:value={createMetadata.key} />
        <InputAddon>:</InputAddon>
        <Input name="add-metadata-value" type="text" bind:value={createMetadata.value} />
        <Button color="secondary" onclick={onAddMetadata}>Add</Button>
      </ButtonGroup>
    </Label>
  </div>
</Modal>
