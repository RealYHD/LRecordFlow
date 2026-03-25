<script lang="ts">
  import { Alert, Button, ButtonGroup, Input, Label } from 'flowbite-svelte'
  import { selectSingleDirectory } from '../lib/dialog.svelte'

  let {
    addRepositoryPath,
    validateValues
  }: {
    addRepositoryPath: (name: string, repoPath: string) => void
    validateValues: (name: string, repoPath: string) => Promise<string[]>
  } = $props()
  let waitingForValidation: boolean = $state(false)
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
    disabled={waitingForValidation}
    class="w-fit mx-auto"
    onclick={() => {
      if (waitingForValidation) return
      issues.length = 0
      waitingForValidation = true
      validateValues(repoName, repositoryPath).then((results) => {
        issues.push(...results)
        waitingForValidation = false
        if (issues.length == 0) {
          addRepositoryPath(repoName, repositoryPath)
        }
      })
    }}>Add</Button
  >
</div>
