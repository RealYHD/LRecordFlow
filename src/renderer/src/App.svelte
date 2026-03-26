<script lang="ts">
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte'
  import { Router } from 'sv-router'
  import { p, route } from './lib/router.svelte'
  import { saveConfiguration, guaranteeConfiguration, openedRepo } from './lib/state.svelte'
  import logo from './assets/icon.png'
  guaranteeConfiguration()

  let repoOpened: boolean = $derived(openedRepo.repo != undefined)
</script>

<svelte:window onbeforeunload={() => saveConfiguration()} />

<Navbar>
  <NavBrand href={repoOpened ? p('/repository') : p('/')}>
    <span class="px-2"><img src={logo} class="w-auto h-8" alt="LRepoFlow logo" /></span>
    {#if repoOpened}
      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
        >{openedRepo.repo.name}@LRecordFlow</span
      >
    {:else}
      <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
        >LRecordFlow</span
      >
    {/if}
  </NavBrand>

  <NavHamburger />
  <NavUl activeUrl={route.pathname}>
    {#if repoOpened}
      <NavLi href={p('/repository')}>{openedRepo.repo.name}</NavLi>
    {/if}
    <NavLi href={p('/')}>Open</NavLi>
    <NavLi href={p('/help')}>Help</NavLi>
  </NavUl>
</Navbar>

<div class="flex-1">
  <Router />
</div>
