<script lang="ts">
  import { Router } from 'sv-router'
  import { p } from './lib/router'
  import { appStateStore } from './state.svelte'
</script>

<div class="navbar bg-base-100 shadow-sm max-w-dvw">
  <div class="navbar-start w-fit flex-none">
    <a href={p('/')} class="btn btn-ghost text-xl">RepoRecords</a>
  </div>
  <div class="navbar-center flex-1 breadcrumbs justify-center">
    <ul>
      <li>
        {#if appStateStore.has('activeRepository')}
          <a href={p('/view/relational')}>{appStateStore.get('activeRepository').name}</a>
        {:else}
          <a href={p('/')}>Select Repository</a>
        {/if}
      </li>
      <li>Long text 1</li>
      <li>Long text 2</li>
      <li>Long text 3</li>
      <li>Long text 4</li>
      <li>Long text 5</li>
    </ul>
  </div>
  <div class="navbar-end w-fit flex-none px-5">
    <a href={p('/help')}>Help</a>
  </div>
</div>

<Router />
