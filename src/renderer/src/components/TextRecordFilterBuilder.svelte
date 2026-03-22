<script lang="ts">
  import { Button, Checkbox, Input, Select, Toggle } from 'flowbite-svelte'
  import type { RepositoryRecordFilter } from '../../../common/types/models'
  const textOptions = [
    { value: 'contains', name: 'Contains' },
    { value: 'prefix', name: 'Begins With' },
    { value: 'suffix', name: 'Ends With' },
    { value: 'regex', name: 'RegEx' }
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

  let filterType: string = $state('')
  let filter: string = $state('')
  let caseSensitive: boolean = $state(false)
  let must: boolean = $state(false)
  let currentFilter: RepositoryRecordFilter | undefined = $derived(buildPredicate())

  function buildPredicate(): RepositoryRecordFilter | undefined {
    let filterSnapshot = $state.snapshot(filter)
    if (filter.length == 0) return undefined
    switch (filterType) {
      case 'contains':
        if (!caseSensitive) {
          return {
            metadataKey: recordMetadataKey,

            filterName: `"${filterSnapshot}" in "${recordMetadataKey}" (case-insensitive)`,
            predicate: (value) => value.toLowerCase().includes(filterSnapshot.toLowerCase()),
            must: must
          }
        }
        return {
          metadataKey: recordMetadataKey,

          filterName: `"${filterSnapshot}" in "${recordMetadataKey}"`,
          predicate: (value) => value.includes(filterSnapshot),
          must: must
        }
      case 'prefix':
        if (!caseSensitive) {
          return {
            metadataKey: recordMetadataKey,

            filterName: `"${filterSnapshot}" begins with "${recordMetadataKey}" (case-insensitive)`,
            predicate: (value) => value.toLowerCase().startsWith(filterSnapshot.toLowerCase()),
            must: must
          }
        }
        return {
          metadataKey: recordMetadataKey,

          filterName: `"${filterSnapshot}" begins with "${recordMetadataKey}"`,
          predicate: (value) => value.startsWith(filterSnapshot),
          must: must
        }
      case 'suffix':
        if (!caseSensitive) {
          return {
            metadataKey: recordMetadataKey,

            filterName: `"${filterSnapshot}" ends with "${recordMetadataKey}" (case-insensitive)`,
            predicate: (value) => value.endsWith(filterSnapshot.toLowerCase()),
            must: must
          }
        }
        return {
          metadataKey: recordMetadataKey,

          filterName: `"${filterSnapshot}" ends with "${recordMetadataKey}"`,
          predicate: (value) => value.endsWith(filterSnapshot),
          must: must
        }
      case 'regex':
        return {
          metadataKey: recordMetadataKey,

          filterName:
            `"${filterSnapshot}" (RegEx) matches "${recordMetadataKey}"` +
            (caseSensitive ? '' : ' (case-insensitive)'),
          predicate: (value) => {
            let regex = new RegExp('/' + filterSnapshot + '/', caseSensitive ? 'i' : '')
            return regex.test(value)
          },
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
  <Select size="sm" items={textOptions} bind:value={filterType}></Select>
  <Input size="sm" bind:value={filter} />
  <Checkbox bind:checked={caseSensitive}>Case-sensitive</Checkbox>
  <Toggle bind:checked={must}>Required</Toggle>
  <Button
    size="sm"
    disabled={!currentFilter}
    onclick={() => {
      if (!currentFilter) return
      addPredicateCallback(buildPredicate())
      filter = ''
    }}>Add</Button
  >
</div>
