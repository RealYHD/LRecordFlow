<script lang="ts">
  import {
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
    ButtonGroup,
    Button
  } from 'flowbite-svelte'
  import { Router } from 'sv-router'
  import { p, route } from './lib/router'
  import { appStateStore, flush, load } from './state.svelte'

  load()
</script>

<svelte:window onbeforeunload={() => flush()} />

<Navbar>
  <NavBrand href="/">
    <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
      >RepoRecords</span
    >
  </NavBrand>

  {#if route.params['repository']}
    {appStateStore.state.knownRepos.find((repo) => repo.local == route.params.repository)
      ? appStateStore.state.knownRepos.find((repo) => repo.local == route.params.repository).name
      : 'No Repo Selected'}
    <ButtonGroup>
      <Button>Save</Button>
      <Button>Configuration</Button>
    </ButtonGroup>
  {/if}

  <NavHamburger class="order-2" />
  <NavUl class="order-2">
    <NavLi href={p('/')}>Repositories</NavLi>
    <NavLi href={p('/notifications')}>Notifications</NavLi>
    <NavLi href={p('/help')}>Help</NavLi>
  </NavUl>
</Navbar>

<div class="flex-1 max-w-full overflow-clip">
  <Router />
</div>
