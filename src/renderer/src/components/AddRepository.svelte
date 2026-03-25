<script lang="ts">
  import { Alert, Button, ButtonGroup, Input, Label } from 'flowbite-svelte'
  import { repoExists } from '../lib/repo.svelte'
  import { appStateStore } from '../lib/state.svelte'
  import { selectSingleDirectory } from '../lib/dialog.svelte'

  let { addRepositoryPath }: { addRepositoryPath: (name: string, repoPath: string) => void } =
    $props()
  let repoName: string = $state('')
  let repositoryPath: string = $state('')
  let issues: string[] = $state([])
</script>

{#if issues.length > 0}
  <Alert color="red">
    <span class="font-medium">Issues Detected!</span>
    <span class="text-sm">The following issues have been found:</span>
    <div>
      <ul>
        {#each issues as issue, index (index)}
          <li>{issue}</li>
        {/each}
      </ul>
    </div>
  </Alert>
{/if}

<div class="space-y-2 flex flex-col">
  <Label>Name of Repository</Label>
  <Input type="text" bind:value={repoName} />
  <Label>Path to Repository</Label>
  <ButtonGroup>
    <Input type="text" bind:value={repositoryPath} />
    <Button
      onclick={() => {
        selectSingleDirectory().then((directoryPath) => (repositoryPath = directoryPath))
      }}>Browse</Button
    >
  </ButtonGroup>
  <Button
    class="w-fit mx-auto"
    onclick={() => {
      issues.length = 0
      // Validating here...
      repoExists(repositoryPath).then((dirExists) => {
        if (repoName.trim().length == 0) {
          issues.push('Name must be non-blank.')
        }
        if (repositoryPath.length == 0) {
          issues.push('Repository path cannot be blank.')
        }
        if (!dirExists) {
          issues.push(
            `Could not access "${repositoryPath}". Check if it exists and you have permission to access it.`
          )
        }
        let sameNameRepo = appStateStore.state.knownRepos.find((repo) => repo.name == repoName)
        if (sameNameRepo != undefined) {
          issues.push(`"${repoName}" is already in use by repository at "${sameNameRepo.local}".`)
        }

        if (issues.length == 0) {
          addRepositoryPath(repoName, repositoryPath)
        }
      })
    }}>Add</Button
  >
</div>
