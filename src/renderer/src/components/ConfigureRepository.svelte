<script lang="ts">
  import { onMount } from 'svelte'
  import { type RepositoryConfiguration } from '../lib/repo.svelte'
  import { Button, ButtonGroup, Input } from 'flowbite-svelte'
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons'

  const repoConfig: RepositoryConfiguration = $state({
    requiredMetadata: [],
    exactKeys: false
  })

  let completionCallbackFn: (updatedConfig: RepositoryConfiguration) => void

  onMount(() => {})

  export function editRepoConfig(
    config: RepositoryConfiguration,
    callback: (updatedConfig: RepositoryConfiguration) => void
  ): void {
    Object.assign(repoConfig, config)
    completionCallbackFn = callback
  }
</script>

<div class="flex flex-col">
  <h5
    id="drawer-label"
    class="mb-6 inline-flex items-center text-base font-semibold text-gray-500 uppercase dark:text-gray-400"
  >
    Repository Configuration
  </h5>
  <form>
    <div class="mb-4 flex flex-1">
      <div>
        <ButtonGroup>
          <Input />
          <Button><PlusOutline /></Button>
        </ButtonGroup>
        {#each repoConfig.requiredMetadata as [key, valueTypes], index (index)}
          <ButtonGroup>
            <Input bind:value={repoConfig.requiredMetadata[index][0]} />
            <Button><TrashBinOutline /></Button>
          </ButtonGroup>
        {/each}
        <!-- TODO implement adding column configurations -->
      </div>
      <div>
        <!-- TODO implement adding configuring the columns -->
      </div>
    </div>
    <div>
      <Button class="w-fit mx-auto">Save</Button>
      <Button class="w-fit mx-auto" outline>Cancel</Button>
    </div>
  </form>
</div>
