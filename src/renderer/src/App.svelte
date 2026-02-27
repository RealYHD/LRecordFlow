<script lang="ts">
  import { Router } from 'sv-router'
  import { p } from './lib/router'
  import { appStateStore } from './state.svelte'
</script>

<nav>
  <div class="navbar bg-base-100 shadow-sm max-w-dvw">
    <div class="navbar-start w-fit flex-none">
      <a href={p('/')} class="btn btn-ghost text-xl">RepoRecords</a>
    </div>
    <div class="navbar-center flex-1 breadcrumbs justify-center">
      <ul>
        {#await appStateStore.get('activeRepository')}
          <span class="loading loading-dots loading-sm"></span>
        {:then activeRepository}
          {#if activeRepository}
            <li>
              <a href={p('/view/relational')}>{activeRepository.name}</a>
            </li>
            {#await appStateStore.get('activeRecord')}
              <li>
                <span class="loading loading-dots loading-sm"></span>
              </li>
            {:then activeRecord}
              {#if activeRecord}
                <li>
                  <a href={p('/record')}>{activeRecord.path}</a>
                </li>
              {/if}
            {/await}
          {:else}
            <li>
              <a href={p('/')}>Open Repository</a>
            </li>
          {/if}
        {/await}
      </ul>
    </div>
    <div class="navbar-end w-fit flex-none px-5">
      <a class="px-1" href={p('/help')}>Help</a>
      <a class="px-1" href={p('/save')}>Save</a>
    </div>
  </div>
</nav>
<div class="flex-1">
  <Router />
</div>
