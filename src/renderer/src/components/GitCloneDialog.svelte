<script lang="ts">
  import { Button, ButtonGroup, Input, InputAddon, Label, Modal } from 'flowbite-svelte'
  import { appStateStore } from '../state.svelte'

  let nameInputValue: string = $state('')
  let remoteInputValue: string = $state('')
  let localInputValue: string = $state('')

  function cloneGitRepository(name: string, remote: string, local: string): void {
    appStateStore.state.notifications.push({
      date: new Date(),
      message: `Began cloning repository ("${name}") from "${remote}" to "${local}"`,
      status: 'Information',
      title: `Cloning "${name}"`
    })
    appStateStore.state.knownRepos.push({
      name: name,
      remote: remote,
      local: local,
      lastAccessed: new Date(),
      status: 'Cloning'
    })
    window['repo']
      .cloneGitRepository(remote, local, name)
      .then((clonePath: string) => {
        appStateStore.state.notifications.push({
          date: new Date(),
          message: `Completed cloning repository ("${name}") from "${remote}" to "${local}"`,
          status: 'Information',
          title: `Completed cloning "${name}"`
        })
        let repo = appStateStore.state.knownRepos.find((repo) => repo.local == local)
        repo.status = 'Ready'
        repo.local = clonePath
      })
      .catch((err) => {
        appStateStore.state.notifications.push({
          date: new Date(),
          message:
            `Failed to clone repository "${name}" from "${remote}" to "${local}" due to following error\n` +
            err.message,
          status: 'Alert',
          title: `Failed to clone repository "${name}"`
        })
        appStateStore.state.knownRepos.find((repo) => repo.local == local).status = 'Not Available'
      })
    close()
  }

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
