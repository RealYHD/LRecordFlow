<script lang="ts">
  import { Button, ButtonGroup, Input, InputAddon, Label, Modal } from 'flowbite-svelte'
  import { cloneGitRepository } from '../lib/repo.svelte'

  let nameInputValue: string = $state('')
  let remoteInputValue: string = $state('')
  let localInputValue: string = $state('')

  let { modalOpen = $bindable() } = $props()
</script>

<Modal class="w-80" form bind:open={modalOpen}>
  <div class="mb-3">
    <h2 class="text-2xl">Clone Repository</h2>
  </div>
  <div>
    <Label for="repositoryName">Repository Name</Label>
    <Input
      id="repositoryName"
      type="text"
      class="input"
      placeholder="Repository"
      bind:value={nameInputValue}
    />
  </div>
  <div>
    <Label for="gitRepositoryUrl">Git Repository URL</Label>
    <Input
      id="gitRepositoryUrl"
      type="text"
      class="input"
      placeholder="ssh://git@repo"
      bind:value={remoteInputValue}
    />
  </div>
  <div>
    <Label for="localRepositoryPath">Local Repository Path</Label>
    <ButtonGroup class="w-full">
      <Input
        id="localRepositoryPath"
        type="text"
        class="input join-item"
        placeholder="/home/me/repository"
        bind:value={localInputValue}
      />
      <InputAddon>
        <Button
          class="btn join-item"
          onclick={() =>
            window['dialog'].handleDirectoryOpen().then((path) => (localInputValue = path))}
          >Select</Button
        >
      </InputAddon>
    </ButtonGroup>
  </div>
  <Button
    class="btn btn-neutral mt-4"
    onclick={() => {
      cloneGitRepository(nameInputValue, remoteInputValue, localInputValue)
      modalOpen = false
    }}>Clone Repository</Button
  >
</Modal>
