<script lang="ts">
  import { Alert, Button, ButtonGroup, Input } from 'flowbite-svelte'
  let {
    addRecord,
    validateIdentifier
  }: {
    addRecord: (identifier: string) => Promise<void>
    validateIdentifier: (identifier: string) => string[]
  } = $props()
  let recordIdentifierInput: string = $state('')
  let issues: string[] = $state([])
  let creating: boolean = $state(false)
</script>

<div class="space-y-2">
  {#if issues.length}
    <Alert>
      The following issues were detected:
      <ul class="list-disc list-inside">
        {#each issues as issue, index (index)}
          <li>{issue}</li>
        {/each}
      </ul>
    </Alert>
  {/if}
  <ButtonGroup size="md">
    <Input type="text" placeholder="Identifier" bind:value={recordIdentifierInput} />
    <Button
      class="p-2!"
      disabled={creating}
      onclick={() => {
        if (creating) return
        issues.length = 0
        issues.push(...validateIdentifier(recordIdentifierInput))
        if (issues.length == 0) {
          creating = true
          addRecord(recordIdentifierInput).then(() => {
            creating = false
          })
        }
      }}>Create</Button
    >
  </ButtonGroup>
</div>
