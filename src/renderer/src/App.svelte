<script lang="ts">
  import { Router } from 'sv-router'
  import { p } from './lib/router'
  import { appStoreState } from './state.svelte'
</script>

<nav>
  <div class="navbar bg-base-100 shadow-sm max-w-dvw">
    <div class="navbar-start w-fit flex-none">
      <a href={p('/')} class="btn btn-ghost text-xl">RepoRecords</a>
    </div>
    <div class="navbar-center flex-1 breadcrumbs justify-center">
      <ul>
        {#if appStoreState.appState}
          {#if appStoreState.appState.activeRepository}
            <li>
              <a href={p('/view/relational')}>{appStoreState.appState.activeRepository.name}</a>
            </li>
            {#if appStoreState.appState.activeRecord}
              <li>
                <a href={p('/record')}>{appStoreState.appState.activeRecord.path}</a>
              </li>
            {/if}
          {:else}
            <li>
              <a href={p('/')}>Open Repository</a>
            </li>
          {/if}
        {:else}
          <span class="loading loading-dots loading-sm"></span>
        {/if}
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
