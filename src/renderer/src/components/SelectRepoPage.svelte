<script lang="ts">
  import { Button, ButtonGroup, Card } from 'flowbite-svelte'
  import {
    DatabaseOutline,
    FileCloneOutline,
    FolderArrowRightOutline,
    TrashBinOutline
  } from 'flowbite-svelte-icons'
  import { appStateStore } from '../lib/state.svelte'
  import GitCloneModal from './GitCloneModal.svelte'
  import { navigate } from '../lib/router.svelte'
  let gitCloneModalOpen = $state(false)
</script>

<GitCloneModal bind:modalOpen={gitCloneModalOpen} />
<div class="p-4 overflow-y-auto">
  <h1 class="text-3xl mb-4">Repositories</h1>
  <div class="flex flex-wrap">
    <Card class="m-1 p-4 sm:p-6  md:p-8 w-90 min-w-90">
      <div class="flex flex-col h-full justify-between">
        <div>
          <FileCloneOutline class="shrink-0 h-8 w-8" />
          <h2 class="my-2 text-2xl tracking-tight text-gray-900 dark:text-white">
            Clone/Add Repository
          </h2>
          <p class="mb-3 font-normal text-gray-500 dark:text-gray-400">
            Clone a repository from a remote location for viewing and editing.
          </p>
        </div>
        <ButtonGroup class="w-fit">
          <Button onclick={() => (gitCloneModalOpen = true)}>Clone</Button>
          <Button>Add</Button>
        </ButtonGroup>
      </div>
    </Card>
    {#each appStateStore.state.knownRepos as repo (repo.local)}
      <Card class="m-1 p-4 sm:p-6 md:p-8 w-90 min-w-90">
        <DatabaseOutline class="shrink-0 h-8 w-8" />
        <h2 class="my-2 text-2xl tracking-tight text-gray-900 dark:text-white">
          {repo.name}
        </h2>
        <ul class="mb-3 font-normal text-gray-500 dark:text-gray-400">
          <li>Last accessed: {repo.lastAccessed}</li>
          <li class="overflow-hidden text-ellipsis text-nowrap">Remote: {repo.remote}</li>
          <li class="overflow-hidden text-ellipsis text-nowrap">Local: {repo.local}</li>
          <li class="overflow-hidden text-ellipsis text-nowrap">
            Status: <strong>{repo.status}</strong>
          </li>
        </ul>
        <ButtonGroup class="w-fit">
          <Button
            onclick={() => {
              navigate('/:repository/relational', { params: { repository: repo.local } })
            }}>Open</Button
          >
          <Button><TrashBinOutline class="shrink-0" /></Button>
          <Button><FolderArrowRightOutline class="shrink-0" /></Button>
        </ButtonGroup>
      </Card>
    {/each}
  </div>
</div>
