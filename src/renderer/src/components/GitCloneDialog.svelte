<script lang="ts">
  import { appStateStore } from '../state.svelte'

  let gitCloneDialogue: HTMLDialogElement

  let nameInput: HTMLInputElement
  let remoteInput: HTMLInputElement
  let localInput: HTMLInputElement

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

  export function open(): void {
    gitCloneDialogue.showModal()
  }

  export function close(): void {
    gitCloneDialogue.close()
  }
</script>

<dialog bind:this={gitCloneDialogue} id="gitCloneDialogue" class="modal">
  <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4 modal-box">
    <legend class="fieldset-legend">Clone Repository</legend>
    <label for="repositoryName" class="label">Repository Name</label>
    <input
      bind:this={nameInput}
      id="repositoryName"
      type="text"
      class="input"
      placeholder="Repository"
    />

    <label for="gitRepositoryUrl" class="label">Git Repository URL</label>
    <input
      bind:this={remoteInput}
      id="gitRepositoryUrl"
      type="text"
      class="input"
      placeholder="ssh://git@repo"
    />
    <label for="localRepositoryPath" class="label">Local Repository Path</label>
    <div class="join">
      <input
        bind:this={localInput}
        id="localRepositoryPath"
        type="text"
        class="input join-item"
        placeholder="/home/me/repository"
      />
      <button
        class="btn join-item"
        onclick={() =>
          window['dialog'].handleDirectoryOpen().then((path) => (localInput.value = path))}
        >Select</button
      >
    </div>
    <button
      class="btn btn-neutral mt-4"
      onclick={() => cloneGitRepository(nameInput.value, remoteInput.value, localInput.value)}
      >Clone Repository</button
    >
    <button class="btn btn-ghost" onclick={() => gitCloneDialogue.close()}>Cancel</button>
  </fieldset>
</dialog>
