<!--
  RepoViewToolbar.svelte

  A responsive toolbar containing the search/filter bar, record filters, and
  action buttons (Add Record, Import Tabular, Configure Repository).

  Props:
    - columns: MetadataDescriptor[] — table columns for the filter builder
    - onFilterCreated: (filter: RepositoryRecordFilter) => void — filter creation callback
    - filter: RepositoryRecordFilter | null — active filter binding
    - onImportTabular: () => void — tabular import callback
    - onConfigure: () => void — repository configuration callback
    - addRecord: () => void — new record creation callback
    - validateIdentifier: (id: string) => Promise<boolean> — identifier validation
    - repoConfLockStatus: LockStatus — repo config lock status
    - commit: () => void — repository commit callback

  Usage:
    <RepoViewToolbar {columns} {onFilterCreated} bind:filter
      onImportTabular onConfigure {addRecord} {validateIdentifier} {repoConfLockStatus} />
-->

<script lang="ts">
  import { Badge, Button, Label, Popover, Tooltip } from 'flowbite-svelte'
  import {
    AdjustmentsVerticalOutline,
    FileImportOutline,
    PlusOutline,
    GithubSolid
  } from 'flowbite-svelte-icons'
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
    repoConfLockStatus,
    commit
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
      <Button id="commit-button" onclick={commit}>
        <GithubSolid />
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
      <Tooltip triggeredBy="#commit-button">Commit Repository</Tooltip>
    </div>
  </div>
</div>
