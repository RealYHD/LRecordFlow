<script lang="ts">
  import { appStoreState } from '../state.svelte'
  let gitCloneDialogue: HTMLDialogElement
  let waiting: number = $state(0)

  function cloneGitRepository(remote: string, local: string): void {
    waiting += 1
    window['repo']
      .cloneGitRepository(remote, local)
      .then(() => {
        waiting -= 1
      })
      .catch((err) => console.log(err.message))
  }
</script>

<dialog bind:this={gitCloneDialogue} id="gitCloneDialogue" class="modal">
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    <fieldset class="fieldset border-base-300 rounded-box w-xs border p-4 mx-auto">
      <legend class="fieldset-legend">Clone Repository</legend>
      <label for="gitRepositoryUrl" class="label">Git Repository URL</label>
      <input
        id="gitRepositoryUrl"
        type="text"
        class="input"
        placeholder="ssh://git@repo"
        disabled={Boolean(waiting)}
      />
      <label for="localRepositoryPath" class="label">Local Repository Path</label>
      <div class="join">
        <input
          id="localRepositoryPath"
          type="text"
          class="input join-item"
          placeholder="/home/me/repository"
          disabled={Boolean(waiting)}
        />
        <button
          class="btn join-item"
          onclick={() =>
            window['dialog']
              .handleDirectoryOpen()
              .then(
                (path) =>
                  ((
                    gitCloneDialogue.querySelector('#localRepositoryPath') as HTMLInputElement
                  ).value = path)
              )}
          disabled={Boolean(waiting)}>Select</button
        >
      </div>
      <button
        class="btn btn-neutral mt-4"
        onclick={() =>
          cloneGitRepository(
            (gitCloneDialogue.querySelector('#gitRepositoryUrl') as HTMLInputElement).value,
            (gitCloneDialogue.querySelector('#localRepositoryPath') as HTMLInputElement).value
          )}
        disabled={Boolean(waiting)}>Clone Repository</button
      >
    </fieldset>
  </div>
</dialog>

<div class="h-full flex flex-col">
  <div class="mx-auto container">
    <ul class="list bg-base-100 rounded-box shadow-md">
      <li class="p-4 pb-2 text-xs opacity-60 tracking-wide">Known Repositories</li>
      <li class="list-row">
        <div>
          <div>Clone Repository</div>
          <div class="text-xs font-semibold opacity-60">
            Clone a Git Repository to manage records within Repository
          </div>
        </div>
        <div class="flex justify-center px-4">
          {#if waiting}
            <span class="loading loading-spinner loading-l"></span>
          {/if}
        </div>
        <div>
          <!-- TODO Add import button -->
        </div>
        <button
          onclick={() => gitCloneDialogue.showModal()}
          class="btn btn-square btn-ghost"
          aria-label="connect"
          disabled={Boolean(waiting)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            ><path fill="currentColor" d="M8 19V5l11 7z" /></svg
          >
        </button>
      </li>
      {#each appStoreState.appState.knownRepos as repo (repo.localPath)}
        <li class="list-row">
          <div>
            <div>{repo.name}</div>
            <div class="text-xs font-semibold opacity-60">{repo.remote}</div>
          </div>
          <div>
            {repo.lastAccessed}
          </div>
          <button class="btn btn-square btn-ghost">Connect</button>
        </li>
      {/each}
    </ul>
  </div>
</div>
