<script lang="ts">
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte'
  import { Router } from 'sv-router'
  import { p } from './lib/router.svelte'
  import { flush, load } from './lib/state.svelte'
  import { onMount } from 'svelte'

  onMount(() => {
    load()
  })
</script>

<svelte:window onbeforeunload={() => flush()} />

<Navbar>
  <NavBrand href="/">
    <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
      >RepoRecords</span
    >
  </NavBrand>

  <NavHamburger />
  <NavUl>
    <NavLi href={p('/')}>Repositories</NavLi>
    <NavLi href={p('/notifications')}>Notifications</NavLi>
    <NavLi href={p('/help')}>Help</NavLi>
  </NavUl>
</Navbar>

<div class="flex-1">
  <Router />
</div>
