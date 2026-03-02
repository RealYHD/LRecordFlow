<script lang="ts">
  import { appStoreState } from '../state.svelte'
</script>

<div class="container mx-auto">
  <ul class="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
    {#each $appStoreState.notifications as taskDescriptor (taskDescriptor.date)}
      <li>
        <hr />
        <div class="timeline-middle">
          {#if taskDescriptor.status == 'Information'}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="h-5 w-5"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clip-rule="evenodd"
              />
            </svg>
          {:else}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="h-5 w-5"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clip-rule="evenodd"
              />
            </svg>
          {/if}
        </div>
        <div
          class={(taskDescriptor.status == 'Alert'
            ? 'timeline-end'
            : 'timeline-start md:text-end') + ' mb-10'}
        >
          <time class="font-mono italic">{taskDescriptor.date}</time>
          <div class="text-lg font-black">{taskDescriptor.title}</div>
          {taskDescriptor.message}
        </div>
        <hr />
      </li>
    {/each}
  </ul>
</div>
