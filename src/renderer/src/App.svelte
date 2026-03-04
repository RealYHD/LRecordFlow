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
  import { navigate, p, route } from './lib/router.svelte'
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

  {#if route.params.repository}
    <ButtonGroup>
      <Button
        onclick={() =>
          navigate('/:repository/relational', { params: { repository: route.params.repository } })}
        >View</Button
      >
      <Button
        onclick={() =>
          navigate('/:repository/save', { params: { repository: route.params.repository } })}
        >Save</Button
      >
      <Button
        onclick={() =>
          navigate('/:repository/configure', { params: { repository: route.params.repository } })}
        >Configuration</Button
      >
    </ButtonGroup>
  {/if}

  <NavHamburger class="order-2" />
  <NavUl class="order-2">
    <NavLi href={p('/')}>Repositories</NavLi>
    <NavLi href={p('/notifications')}>Notifications</NavLi>
    <NavLi href={p('/help')}>Help</NavLi>
  </NavUl>
</Navbar>

<div class="flex-1">
  <Router />
</div>
