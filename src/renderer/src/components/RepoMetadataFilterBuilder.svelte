<script lang="ts">
  import { Datepicker, Input } from 'flowbite-svelte'
  import RecordFilterBuilder from './RecordFilterBuilder.svelte'
  import type { MetadataDescriptor, RepositoryRecordFilter } from '../../../common/types/models'

  let {
    metadataDescs,
    onFilterCreated
  }: {
    metadataDescs: MetadataDescriptor[]
    onFilterCreated: (filter: RepositoryRecordFilter) => void
  } = $props()
  let operandValue: string = $state('')
  let filter: RepositoryRecordFilter = $state(undefined)
</script>

<!-- {#snippet dateSelector()}
  <Datepicker
    bind:value={
      () => (isNaN(Date.parse(operandValue)) ? undefined : new Date(operandValue)),
      (v: Date) => v.toDateString()
    }
  />
{/snippet}

{#snippet numberSelector()}
  <Input type="number" bind:value={operandValue} />
{/snippet} -->

{#snippet textSelector()}
  <Input type="text" bind:value={operandValue} />
{/snippet}

<RecordFilterBuilder
  {metadataDescs}
  keyOperators={{
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
  }}
  bind:operandValue
  {onFilterCreated}
  bind:filter
/>
