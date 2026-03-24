<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Button, ButtonGroup, InputAddon, Select } from 'flowbite-svelte'
  import type {
    MetadataDescriptor,
    MetadataValueType,
    RepositoryRecordFilter
  } from '../../../common/types/models'

  type PredicateBuilder = (operand: string) => (recordValue: string) => boolean
  let {
    metadataDescs,
    keyOperators,
    operandValue = $bindable(),
    onFilterCreated: filterCreated,
    filter = $bindable()
  }: {
    metadataDescs: MetadataDescriptor[]
    keyOperators: Record<
      string,
      {
        operations: {
          displayName: string
          identifier: string
          predicateBuilder: PredicateBuilder
        }[]
        operandSelector: Snippet
      }
    >
    operandValue: string
    onFilterCreated: (filter: RepositoryRecordFilter) => void
    filter: RepositoryRecordFilter
  } = $props()

  let metadataKeyValueTypes: Record<string, MetadataValueType> = $derived(
    Object.fromEntries(metadataDescs.map((desc) => [desc.key, desc.value.valueType]))
  )
  let must: boolean = $state(false)
  let selectedMetadataKey = $state(undefined)
  let selectedOperator = $state(undefined)
  let filterComplete = $derived(
    selectedMetadataKey && selectedOperator && operandValue && operandValue.length
  )
  let operatorNames: Record<
    string,
    { displayName: string; identifier: string; predicateBuilder: PredicateBuilder }
  > = $derived(
    selectedMetadataKey
      ? Object.fromEntries(
          keyOperators[metadataKeyValueTypes[selectedMetadataKey]].operations.map((operator) => [
            operator.identifier,
            {
              displayName: operator.displayName,
              identifier: operator.identifier,
              predicateBuilder: operator.predicateBuilder
            }
          ])
        )
      : {}
  )
  function getDisplayName(): string {
    return `${must ? 'All' : 'Any'} "${selectedMetadataKey}" must ${operatorNames[selectedOperator].displayName} ${operandValue}`
  }

  function getFilterIdentifier(): string {
    return `${must} "${selectedMetadataKey}" ${selectedOperator} ${operandValue}`
  }

  function buildFilter(): RepositoryRecordFilter {
    if (!filterComplete) return undefined
    return {
      displayName: getDisplayName(),
      identifier: getFilterIdentifier(),
      metadataKey: selectedMetadataKey,
      must: must,
      predicate: operatorNames[selectedOperator].predicateBuilder($state.snapshot(operandValue))
    }
  }

  $effect(() => {
    let currentFilter = buildFilter()
    if (!filter && !currentFilter) return
    if ((!filter || !currentFilter) && (filter || currentFilter)) {
      filter = currentFilter
      return
    }
    if (filter.identifier != currentFilter.identifier) {
      filter = currentFilter
    }
  })
</script>

<div class="flex flex-wrap">
  <!-- <any|all> <select metadata key> <operator> <operand> -->
  <ButtonGroup>
    <Select
      class=""
      items={[
        { name: 'Any', value: false },
        { name: 'All', value: true }
      ]}
      bind:value={must}
    />
    <Select
      items={metadataDescs.map((desc) => ({ name: desc.key, value: desc.key }))}
      bind:value={selectedMetadataKey}
    />
    {#if selectedMetadataKey && selectedMetadataKey.length}
      <InputAddon>must</InputAddon>
      <Select
        items={Object.values(operatorNames).map((operator) => ({
          name: operator.displayName,
          value: operator.identifier
        }))}
        bind:value={selectedOperator}
      />
    {/if}
    {#if selectedMetadataKey && selectedMetadataKey.length}
      {@render keyOperators[metadataKeyValueTypes[selectedMetadataKey]].operandSelector()}
    {:else}
      <!-- TODO show filler -->
    {/if}
    <Button
      disabled={!filterComplete}
      onclick={() => {
        if (!filterComplete) return
        filterCreated(buildFilter())
        operandValue = ''
      }}>Add</Button
    >
  </ButtonGroup>
</div>
