<script lang="ts">
  import { Button, Datepicker, Select, Toggle } from 'flowbite-svelte'
  import type { RepositoryRecordFilter } from '../../../common/types/models'
  const textOptions = [
    { value: 'greater', name: 'Greater Than' },
    { value: 'lesser', name: 'Lesser Than' },
    { value: 'equal', name: 'Equal To' }
  ]

  let {
    recordMetadataKey,
    filterUpdateCallback,
    addPredicateCallback
  }: {
    recordMetadataKey: string
    filterUpdateCallback: (predicate: RepositoryRecordFilter) => void
    addPredicateCallback: (predicate: RepositoryRecordFilter) => void
  } = $props()

  let comparator: string = $state('')
  let comparedTo: Date | undefined = $state(undefined)
  let must: boolean = $state(false)
  let currentFilter: RepositoryRecordFilter | undefined = $derived(buildPredicate())

  function buildPredicate(): RepositoryRecordFilter | undefined {
    let comparedToSnapshot = $state.snapshot(comparedTo)
    if (!comparator.length) return undefined
    if (!comparedToSnapshot) return undefined
    switch (comparator) {
      case 'greater':
        return {
          metadataKey: recordMetadataKey,
          displayName: `${recordMetadataKey} > ${comparedToSnapshot}`,
          predicate: (value) => new Date(value) > comparedToSnapshot,
          must: must
        }
      case 'lesser':
        return {
          metadataKey: recordMetadataKey,
          displayName: `${recordMetadataKey} < ${comparedToSnapshot}`,
          predicate: (value) => new Date(value) < comparedToSnapshot,
          must: must
        }
      case 'equal':
        return {
          metadataKey: recordMetadataKey,
          displayName: `${recordMetadataKey} = ${comparedToSnapshot}`,
          predicate: (value) => new Date(value) == comparedToSnapshot,
          must: must
        }
      default:
        return undefined
    }
  }
  $effect(() => {
    filterUpdateCallback(currentFilter)
  })
</script>

<div class="space-y-2">
  <Select size="sm" items={textOptions} bind:value={comparator}></Select>
  <Datepicker bind:value={comparedTo} />
  <Toggle bind:checked={must}>Required</Toggle>
  <Button
    size="sm"
    disabled={!currentFilter}
    onclick={() => {
      if (!currentFilter) return
      addPredicateCallback(currentFilter)
      comparedTo = undefined
    }}>Add</Button
  >
</div>
