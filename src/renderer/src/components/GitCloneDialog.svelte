<script lang="ts">
  import { appStoreState } from '../state.svelte'

  let gitCloneDialogue: HTMLDialogElement

  let nameInput: HTMLInputElement
  let remoteInput: HTMLInputElement
  let localInput: HTMLInputElement

  let errorMessage: string = $state('')
  let { cloneJobs = $bindable() } = $props()

  function cloneGitRepository(name: string, remote: string, local: string): void {
    cloneJobs += 1
    $appStoreState.notifications.push({
      date: new Date(),
      message: `Began cloning repository ("${name}") from "${remote}" to "${local}"`,
      status: 'Information',
      title: `Cloning "${name}"`
    })
    window['repo']
      .cloneGitRepository(remote, local)
      .then(() => {
        $appStoreState.knownRepos.push({
          name: name,
          remote: remote,
          local: local,
          lastAccessed: new Date()
        })
        $appStoreState.notifications.push({
          date: new Date(),
          message: `Completed cloning repository ("${name}") from "${remote}" to "${local}"`,
          status: 'Information',
          title: `Completed cloning "${name}"`
        })
      })
      .catch((err) => {
        $appStoreState.notifications.push({
          date: new Date(),
          message:
            `Failed to clone repository "${name}" from "${remote}" to "${local}" due to following error\n` +
            err.message,
          status: 'Alert',
          title: `Failed to clone repository "${name}"`
        })
      })
      .finally(() => {
        cloneJobs -= 1
      })
  }

  export function open(): void {
    gitCloneDialogue.showModal()
  }

  export function close(): void {
    gitCloneDialogue.close()
  }
</script>

{#if errorMessage.length > 0}
  <div role="alert" class="alert alert-vertical sm:alert-horizontal">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      class="stroke-info h-6 w-6 shrink-0"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
    <span>{errorMessage}</span>
    <div>
      <button class="btn btn-sm btn-primary" onclick={() => (errorMessage = '')}>Close</button>
    </div>
  </div>
{/if}

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
