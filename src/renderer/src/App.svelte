<script lang="ts">
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte'
  import { Router } from 'sv-router'
  import { p } from './lib/router.svelte'
  import { appStateStore, flush, loadAppState } from './lib/state.svelte'
  loadAppState()

  let repoOpened: boolean = $derived(
    appStateStore.state != undefined && appStateStore.state.openedRepoPath != undefined
  )
</script>

<svelte:window onbeforeunload={() => flush()} />

<Navbar>
  <NavBrand href={repoOpened ? p('/repository') : p('/')}>
    {#if repoOpened}
      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
        >{appStateStore.state.knownRepos.find(
          (repo) => repo.local == appStateStore.state.openedRepoPath
        ).name}@LRecordFlow</span
      >
    {:else}
      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
        >LRecordFlow</span
      >
    {/if}
  </NavBrand>

  <NavHamburger />
  <NavUl>
    {#if repoOpened}
      <NavLi href={p('/repository')}
        >{appStateStore.state.knownRepos.find(
          (repo) => repo.local == appStateStore.state.openedRepoPath
        ).name}</NavLi
      >
    {/if}
    <NavLi href={p('/')}>Open</NavLi>
    <NavLi href={p('/help')}>Help</NavLi>
  </NavUl>
</Navbar>

<div class="flex-1">
  <Router />
</div>
