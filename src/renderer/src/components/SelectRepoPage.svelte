<script lang="ts">
  import type { Repository } from '../entities'
  import { appStateStore } from '../state.svelte'
  let gitCloneDialogue: HTMLDialogElement
  let knownRepos: Repository[] = $state([])
  appStateStore.get('knownRepos').then((recentRepos) => (knownRepos = recentRepos))
  $effect(() => {
    appStateStore.set('knownRepos', knownRepos)
  })
</script>

<dialog bind:this={gitCloneDialogue} id="gitCloneDialogue" class="modal">
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    <fieldset class="fieldset border-base-300 rounded-box w-xs border p-4 mx-auto">
      <legend class="fieldset-legend">Clone Repository</legend>
      <label for="connectionString" class="label">Connection String</label>
      <input id="connectionString" type="text" class="input" placeholder="ssh://git@repo" />
      <button class="btn btn-neutral mt-4">Clone Repository</button>
    </fieldset>
  </div>
</dialog>

<div class="h-full flex flex-col">
  <div class="mx-auto container">
    <ul class="list bg-base-100 rounded-box shadow-md">
      <li class="p-4 pb-2 text-xs opacity-60 tracking-wide">Recently Accessed Repositories</li>
      <li class="list-row">
        <div>
          <div>Clone Repository</div>
          <div class="text-xs font-semibold opacity-60">
            Clone a Git Repository to manage records within Repository
          </div>
        </div>
        <div>
          <!-- TODO Add import button -->
        </div>
        <button
          onclick={() => gitCloneDialogue.showModal()}
          class="btn btn-square btn-ghost"
          aria-label="connect"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            ><path fill="currentColor" d="M8 19V5l11 7z" /></svg
          >
        </button>
      </li>
      {#each knownRepos as repo (repo.localPath)}
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
