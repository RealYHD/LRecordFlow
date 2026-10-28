<script lang="ts">
  import { Badge, Button, Label, Popover, Tooltip } from 'flowbite-svelte'
  import { AdjustmentsVerticalOutline, FileImportOutline, PlusOutline } from 'flowbite-svelte-icons'
  import RecordFilterBuilder from './RecordFilterBuilder.svelte'
  import AddRecord from './CreateRecord.svelte'
  import type { MetadataDescriptor, RepositoryRecordFilter } from '../../../common/types/models'

  let {
    columns,
    onFilterCreated,
    filter,
    onImportTabular,
    onConfigure,
    addRecord,
    validateIdentifier,
    repoConfLockStatus
  }: {
    columns: { displayName: string; key: string; valueType: MetadataDescriptor }[]
    onFilterCreated: (filter: RepositoryRecordFilter) => void
    filter: RepositoryRecordFilter
    onImportTabular: () => void
    onConfigure: () => void
    addRecord: (identifier: string) => Promise<void>
    validateIdentifier: (identifier: string) => string[]
    repoConfLockStatus: unknown
  } = $props()
</script>

<div class="mb-2 mx-1 flex flex-wrap justify-between items-end">
  <div class="mb-2 mx-2">
    <Label>Search/Filter</Label>
    <RecordFilterBuilder {columns} {onFilterCreated} bind:filter />
    {#if filter}
      <Popover>
        <Badge>{filter.displayName}</Badge>
      </Popover>
    {/if}
  </div>
  <div class="flex flex-wrap items-end">
    <div class="w-fit h-fit mb-2 mx-2">
      <Button id="add-record-button">
        <PlusOutline />
      </Button>
      <Button id="import-button" onclick={onImportTabular}><FileImportOutline /></Button>
      <Button
        id="repo-configure-button"
        disabled={repoConfLockStatus != null}
        onclick={onConfigure}
      >
        <AdjustmentsVerticalOutline />
      </Button>
      <Popover trigger="hover" triggeredBy="#add-record-button" title="Create Record">
        <AddRecord {addRecord} {validateIdentifier} />
      </Popover>
      <Tooltip triggeredBy="#import-button">Import data from Tabular</Tooltip>
      <Tooltip triggeredBy="#repo-configure-button">
        {#if repoConfLockStatus}
          Waiting for {repoConfLockStatus.currentUser} to Finish Editing...
        {:else}
          Configure Repository
        {/if}
      </Tooltip>
    </div>
  </div>
</div>
