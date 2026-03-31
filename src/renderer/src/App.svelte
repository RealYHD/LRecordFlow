<script lang="ts">
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte'
  import { saveConfiguration, guaranteeConfiguration, openedRepo } from './lib/state.svelte'
  import logo from './assets/icon.png'
  import SelectRepoPage from './pages/SelectRepoPage.svelte'
  import HelpPage from './pages/HelpPage.svelte'
  import { calculateHref, location, Route, Router } from '@svelte-router/core'
  import RepoViewPage from './pages/RepoViewPage.svelte'

  guaranteeConfiguration()
  let repoOpened: boolean = $derived(openedRepo.repo != undefined)
</script>

<svelte:window onbeforeunload={() => saveConfiguration()} />

<Navbar>
  <NavBrand href={repoOpened ? '/repository' : '/'}>
    <span class="px-2"><img src={logo} class="w-auto h-8" alt="lRepoFlow logo" /></span>
    {#if repoOpened}
      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
        >{openedRepo.repo.name}@lRepoFlow</span
      >
    {:else}
      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
        >lRepoFlow</span
      >
    {/if}
  </NavBrand>

  <NavHamburger />
  <NavUl activeUrl={location.url.hash}>
    {#if repoOpened}
      <NavLi href={calculateHref('/view')}>{openedRepo.repo.name}</NavLi>
    {/if}
    <NavLi href={calculateHref('/')}>Open</NavLi>
    <NavLi href={calculateHref('/help')}>Help</NavLi>
  </NavUl>
</Navbar>

<Router id="root-router">
  <div class="flex-1 flex flex-col">
    <Route key="select" path="/">
      <SelectRepoPage />
    </Route>
    <Route key="repo-view" path="/view">
      <RepoViewPage />
    </Route>
    <Route key="help" path="/help">
      <HelpPage />
    </Route>
  </div>
</Router>
