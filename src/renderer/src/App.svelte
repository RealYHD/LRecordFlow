<script lang="ts">
  import { Router } from 'sv-router'
  import { p } from './lib/router'
  import { appStoreState, flush, load } from './state.svelte'
  import { onMount, tick } from 'svelte'
</script>

<nav>
  <div class="navbar bg-base-100 shadow-sm max-w-dvw">
    <div class="navbar-start w-fit flex-none">
      <a href={p('/')} class="btn btn-ghost text-xl">RepoRecords</a>
    </div>
    <div class="navbar-center flex-1 breadcrumbs justify-center">
      <ul>
        {#if $appStoreState.activeRepository}
          <li>
            <a href={p('/view/relational')}>{$appStoreState.activeRepository.name}</a>
          </li>
          {#if $appStoreState.activeRecord}
            <li>
              <a href={p('/record')}>{$appStoreState.activeRecord.path}</a>
            </li>
          {/if}
        {:else}
          <li>
            <a href={p('/')}>Open Repository</a>
          </li>
        {/if}
      </ul>
    </div>
    <div class="navbar-end w-fit flex-none px-5">
      <a class="px-1" href={p('/tasks')}
        ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M11.513 13.663q-.238-.063-.463-.188l-8.45-4.6q-.275-.15-.388-.375T2.1 8t.113-.5t.387-.375l8.45-4.6q.225-.125.463-.188T12 2.275t.488.063t.462.187l8.45 4.6q.275.15.388.375t.112.5t-.112.5t-.388.375l-8.45 4.6q-.225.125-.462.188t-.488.062t-.488-.062M12 11.725L18.825 8L12 4.275L5.175 8zm0 4l7.85-4.275q.05-.025.475-.125q.425 0 .713.288t.287.712q0 .275-.125.5t-.4.375l-7.85 4.275q-.225.125-.462.188t-.488.062t-.488-.062t-.462-.188L3.2 13.2q-.275-.15-.4-.375t-.125-.5q0-.425.288-.712t.712-.288q.125 0 .238.038t.237.087zm0 4l7.85-4.275q.05-.025.475-.125q.425 0 .713.288t.287.712q0 .275-.125.5t-.4.375l-7.85 4.275q-.225.125-.462.188t-.488.062t-.488-.062t-.462-.188L3.2 17.2q-.275-.15-.4-.375t-.125-.5q0-.425.288-.712t.712-.288q.125 0 .238.038t.237.087z"
          /></svg
        ></a
      >
      <a class="px-1" href={p('/help')}
        ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M12.838 17.638q.362-.363.362-.888t-.362-.888t-.888-.362t-.887.363t-.363.887t.363.888t.887.362t.888-.363M11.05 14.15h1.85q0-.825.188-1.3t1.062-1.3q.65-.65 1.025-1.238T15.55 8.9q0-1.4-1.025-2.15T12.1 6q-1.425 0-2.312.75T8.55 8.55l1.65.65q.125-.45.563-.975T12.1 7.7q.8 0 1.2.438t.4.962q0 .5-.3.938t-.75.812q-1.1.975-1.35 1.475t-.25 1.825M12 22q-2.075 0-3.9-.787t-3.175-2.138T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
          /></svg
        ></a
      >
      <a class="px-1" href={p('/save')}
        ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h11.175q.4 0 .763.15t.637.425l2.85 2.85q.275.275.425.638t.15.762V19q0 .825-.587 1.413T19 21zM19 7.85L16.15 5H5v14h14zm-4.875 9.275Q15 16.25 15 15t-.875-2.125T12 12t-2.125.875T9 15t.875 2.125T12 18t2.125-.875M7 10h7q.425 0 .713-.288T15 9V7q0-.425-.288-.712T14 6H7q-.425 0-.712.288T6 7v2q0 .425.288.713T7 10M5 7.85V19V5z"
          /></svg
        ></a
      >
    </div>
  </div>
</nav>
<div class="flex-1">
  <Router />
</div>
