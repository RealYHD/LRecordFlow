<script lang="ts">
  import { Button, ButtonGroup, Input, InputAddon, Label, Modal, Span } from 'flowbite-svelte'
  import { setRecord } from '../lib/repo.svelte'
  let formError = $state('')
  let createMetadataError = $state('')
  let {
    modalOpen = $bindable(false),
    localRepoPath,
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

  function onSubmit(): boolean {
    if (!recordData['Identifier']) {
      formError = `Identifier cannot be blank`
      return false
    }
    setRecord(localRepoPath, recordData['Identifier'], $state.snapshot(recordData))
    formError = ''
    return true
  }

  function onAddMetadata(): void {
    if (Object.hasOwn(recordData, createMetadata.key)) {
      createMetadataError = `${createMetadata.key} cannot be used twice!`
      return
    }
    if (!createMetadata.key) {
      createMetadataError = 'Metadata key cannot be empty!'
      return
    }
    recordData[createMetadata.key] = createMetadata.value
    createMetadata.key = ''
    createMetadata.value = ''
    createMetadataError = ''
  }
</script>

<Modal
  title={create ? `Add new Record` : `Update "${recordData['Identifier']}"`}
  form
  bind:open={modalOpen}
  onaction={onSubmit}
>
  <div class="flex flex-col space-y-6">
    {#if formError}
      <Label color="red">{formError}</Label>
    {/if}
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
    {#if createMetadataError}
      <Label color="red">{createMetadataError}</Label>
    {/if}
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
