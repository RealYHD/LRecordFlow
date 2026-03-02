<script lang="ts">
  import { appStateStore } from '../state.svelte'
  import GitCloneDialog from './GitCloneDialog.svelte'
  let gitCloneDialogue: GitCloneDialog
</script>

<GitCloneDialog bind:this={gitCloneDialogue} />

<div class="h-full flex flex-col">
  <div class="mx-auto container">
    <div class="my-2">
      <ul class="list bg-base-100 rounded-box shadow-md">
        <li class="p-4 pb-2 text-xs opacity-60 tracking-wide">Add Repository</li>
        <li class="list-row">
          <div>
            <div>Clone Repository</div>
            <div class="text-xs font-semibold opacity-60">
              Clone a Git Repository to manage records within Repository
            </div>
          </div>
          <div></div>
          <button
            onclick={() => gitCloneDialogue.open()}
            class="btn btn-square btn-ghost"
            aria-label="connect"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              ><path fill="currentColor" d="M8 19V5l11 7z" /></svg
            >
          </button>
        </li>
        <li class="list-row">
          <div>
            <div>Add Existing Local Repository</div>
            <div class="text-xs font-semibold opacity-60">
              Add a previously cloned repository found locally
            </div>
          </div>
          <div></div>
          <button class="btn btn-square btn-ghost" aria-label="connect">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              ><path fill="currentColor" d="M8 19V5l11 7z" /></svg
            >
          </button>
        </li>
      </ul>
    </div>
    <div class="my-2">
      <ul class="list bg-base-100 rounded-box shadow-md">
        <li class="p-4 pb-2 text-xs opacity-60 tracking-wide">Known Repositories</li>

        {#each appStateStore.state.knownRepos as repo (repo.local)}
          <li class={(repo.status == 'Cloning' ? 'skeleton' : '') + ' list-row'}>
            <div>
              <div>{repo.name}</div>
              <div class="text-xs font-semibold opacity-60">{repo.remote}</div>
              <div class="text-xs font-semibold opacity-60">Last accessed: {repo.lastAccessed}</div>
              <div class="text-xs font-semibold opacity-60">Local Path: {repo.local}</div>
            </div>
            <div>
              Status: {repo.status}
            </div>
            <button
              class="btn btn-square btn-ghost"
              aria-label="connect"
              onclick={() =>
                appStateStore.state.knownRepos.splice(appStateStore.state.knownRepos.indexOf(repo))}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zm2-4h2V8H9zm4 0h2V8h-2z"
                /></svg
              >
            </button>
            <button
              class="btn btn-square btn-ghost"
              aria-label="connect"
              disabled={repo.status != 'Ready'}
              onclick={() => (appStateStore.state.activeRepository = repo)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                ><path fill="currentColor" d="M8 19V5l11 7z" /></svg
              >
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>
