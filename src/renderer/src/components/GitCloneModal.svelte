<script lang="ts">
  import { Button, ButtonGroup, Input, InputAddon, Label, Modal, Span } from 'flowbite-svelte'
  import { cloneGitRepository } from '../lib/repo.svelte'
  import { openFolderSelector } from '../lib/dialog.svelte'

  let nameInputValue: string = $state('')
  let remoteInputValue: string = $state('')
  let localInputValue: string = $state('')
  let error = $state('')

  let { modalOpen = $bindable() } = $props()

  function onSubmit({ action }: { action: string }): boolean {
    // TODO add validation here
    if (action == 'clone') {
      cloneGitRepository(nameInputValue, remoteInputValue, localInputValue)
    }
    return true
  }
</script>

<Modal title="Clone Repository" class="w-80" form bind:open={modalOpen} onaction={onSubmit}>
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
  {#snippet footer()}
    <Button type="submit" class="btn btn-neutral mt-4" value="clone">Clone Repository</Button>
  {/snippet}
</Modal>
