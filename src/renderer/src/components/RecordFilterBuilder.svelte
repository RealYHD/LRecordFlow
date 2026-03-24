<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Button, ButtonGroup, Input, InputAddon, Select } from 'flowbite-svelte'
  import {
    MetadataValueType,
    type MetadataDescriptor,
    type RepositoryRecordFilter
  } from '../../../common/types/models'

  type PredicateBuilder = (operand: string) => (recordValue: string) => boolean
  let {
    metadataDescs,
    onFilterCreated: filterCreated,
    filter = $bindable()
  }: {
    metadataDescs: MetadataDescriptor[]
    onFilterCreated: (filter: RepositoryRecordFilter) => void
    filter: RepositoryRecordFilter
  } = $props()

  let keyOperators: Record<
    string,
    {
      operations: {
        displayName: string
        identifier: string
        predicateBuilder: PredicateBuilder
      }[]
      operandSelector: Snippet
    }
  > = {
    text: {
      operations: [
        {
          displayName: 'have (case-insensitive)',
          identifier: 'have-case-insensitive',
          predicateBuilder: (operand) => {
            return (value) => value.toLowerCase().includes(operand.toLowerCase())
          }
        },
        {
          displayName: 'have (case-sensitive)',
          identifier: 'have-case-sensitive',
          predicateBuilder: (operand) => (value) => value.includes(operand)
        },
        {
          displayName: 'begin with (case-insensitive)',
          identifier: 'begin-with-case-insensitive',
          predicateBuilder: (operand) => (value) =>
            value.toLowerCase().startsWith(operand.toLowerCase())
        },
        {
          displayName: 'begin with (case-sensitive)',
          identifier: 'begin-with-case-sensitive',
          predicateBuilder: (operand) => (value) => value.startsWith(operand)
        },
        {
          displayName: 'end with (case-insensitive)',
          identifier: 'end-with-case-insensitive',
          predicateBuilder: (operand) => (value) =>
            value.toLowerCase().endsWith(operand.toLowerCase())
        },
        {
          displayName: 'end with (case-sensitive)',
          identifier: 'end-with-case-sensitive',
          predicateBuilder: (operand) => (value) => value.startsWith(operand)
        }
      ],
      operandSelector: textSelector
    }
  }
  let operandValue: string = $state('')
  let metadataKeyValueTypes: Record<string, MetadataValueType> = $derived(
    Object.fromEntries(metadataDescs.map((desc) => [desc.key, desc.value.valueType]))
  )
  let must: boolean = $state(false)
  let selectedMetadataKey = $state(undefined)
  let selectedMetadataValueType: MetadataValueType = $derived(
    Object.keys(keyOperators).includes(metadataKeyValueTypes[selectedMetadataKey])
      ? metadataKeyValueTypes[selectedMetadataKey]
      : MetadataValueType.Text
  )
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
          keyOperators[selectedMetadataValueType].operations.map((operator) => [
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

<!-- {#snippet dateSelector()}
  <Datepicker
    bind:value={
      () => (isNaN(Date.parse(operandValue)) ? undefined : new Date(operandValue)),
      (v: Date) => v.toDateString()
    }
  />
{/snippet} -->

<!-- {#snippet numberSelector()}
  <Input type="number" bind:value={operandValue} />
{/snippet} -->

{#snippet textSelector()}
  <Input type="text" bind:value={operandValue} />
{/snippet}

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
      {@render keyOperators[selectedMetadataValueType].operandSelector()}
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
