<script lang="ts">
  import { Button, ButtonGroup, Input, InputAddon, Label, Span } from 'flowbite-svelte'
  import { openFolderSelector } from '../lib/dialog.svelte'

  let {
    nameInputValue = $bindable(),
    remoteInputValue = $bindable(),
    localInputValue = $bindable()
  } = $props()

  let error = $state('') // TODO add derivative based validation
</script>

<div class="flex flex-col space-y-6">
  {#if error}
    <Label color="red">{error}</Label>
  {/if}
  <Label class="space-y-2">
    <Span>Repository Name</Span>
    <Input
      type="text"
      class="input"
      placeholder="Repository"
      bind:value={nameInputValue}
      required
    />
  </Label>
  <Label class="space-y-2">
    <Span>Git Repository URL</Span>
    <Input
      type="text"
      class="input"
      placeholder="ssh://git@repo"
      bind:value={remoteInputValue}
      required
    />
  </Label>
  <Label class="space-y-2">
    <Span>Local Repository Path</Span>
    <ButtonGroup class="w-full">
      <Input
        type="text"
        class="input join-item"
        placeholder="/home/me/repository"
        bind:value={localInputValue}
        required
      />
      <InputAddon>
        <Button
          class="btn join-item"
          onclick={() => openFolderSelector().then((path) => (localInputValue = path))}
          >Select</Button
        >
      </InputAddon>
    </ButtonGroup>
  </Label>
</div>
