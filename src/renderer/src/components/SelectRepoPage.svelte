<script lang="ts">
  import { appStateStore } from '../state.svelte'
  import GitCloneDialog from './GitCloneDialog.svelte'
  let cloneJobsRunning = $state(0)
  let gitCloneDialogue: GitCloneDialog
</script>

<GitCloneDialog bind:cloneJobs={cloneJobsRunning} bind:this={gitCloneDialogue} />

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
          {#if cloneJobsRunning}
            <span class="loading loading-spinner loading-l"></span>
          {/if}
        </div>
        <div>
          <!-- TODO Add import button -->
        </div>
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
      {#if cloneJobsRunning}
        <li class="list-row skeleton">
          <div>
            <span class="skeleton skeleton-text">{cloneJobsRunning} clone processes ongoing...</span
            >
          </div>
        </li>
      {/if}
      {#each appStateStore.state.knownRepos as repo (repo.local)}
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
