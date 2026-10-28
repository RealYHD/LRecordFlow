<!--
  RepoTableRow.svelte

  A single table row rendering a repository record. Each row displays the
  record's metadata fields and provides action buttons (edit, reload, open
  directory, delete) with status indicators for locks and issues.

  Props:
    - record: RepositoryRecord — the record data
    - columns: MetadataDescriptor[] — column definitions
    - onEdit: (record: RepositoryRecord) => void — edit callback
    - onReload: (record: RepositoryRecord) => void — reload callback
    - onOpenDir: (record: RepositoryRecord) => void — open directory callback
    - onDelete: (record: RepositoryRecord) => void — delete callback
    - lockStatus: LockStatus — lock status for the record
    - hasIssue: boolean — whether the record has issues
    - modified: boolean — whether the record is modified

  Usage:
    <RepoTableRow {record} {columns} {onEdit} {onReload} {onOpenDir} {onDelete}
      {lockStatus} {hasIssue} {modified} />
-->

<script lang="ts">
  import {
    Button,
    ButtonGroup,
    Popover,
    TableBodyCell,
    TableBodyRow,
    Tooltip
  } from 'flowbite-svelte'
  import {
    CheckCircleOutline,
    ChalkboardUserOutline,
    EditOutline,
    ExclamationCircleOutline,
    FloppyDiskOutline,
    FolderArrowRightOutline,
    RefreshOutline,
    TrashBinOutline
  } from 'flowbite-svelte-icons'
  import type {
    LockStatus,
    MetadataDescriptor,
    RecordMetadata,
    RepositoryRecord
  } from '../../../common/types/models'

  let {
    record,
    liveRecordIndex,
    localRepoPath,
    lockStatus,
    issues,
    modified,
    flushTimer,
    metadataDescriptors,
    onEdit,
    onReload,
    onOpenDir,
    onDelete
  }: {
    record: RepositoryRecord
    liveRecordIndex: number
    localRepoPath: string
    lockStatus: LockStatus | null | undefined
    issues: Record<string, string[]>
    modified: boolean
    flushTimer: { delay: number; flushing: boolean } | undefined
    metadataDescriptors: MetadataDescriptor[]
    onEdit: (index: number) => void
    onReload: (identifier: string) => void
    onOpenDir: (localRepoPath: string, identifier: string) => void
    onDelete: (index: number) => void
  } = $props()

  let identifier: string = $derived(record.identifier)
  let metadata: RecordMetadata = $derived(record.metadata)
</script>

<TableBodyRow class="border-gray-200">
  <TableBodyCell>
    <div class="flex justify-start items-center space-x-2">
      <span>
        {#if issues && Object.values(issues).some((arr) => arr.length)}
          <ExclamationCircleOutline color="red" />
          <Tooltip>
            {Object.values(issues).reduce((total, arr) => total + arr.length, 0)} issue(s) found with
            metadata associated with this record. Updates will not be saved until fixed.
          </Tooltip>
        {:else if modified && flushTimer}
          <FloppyDiskOutline color="cyan" />
          <Tooltip>Saving record in {(flushTimer.delay / 1000).toFixed(0)} seconds...</Tooltip>
        {:else if lockStatus}
          <ChalkboardUserOutline color="purple" />
          <Tooltip>
            The record cannot be modified at this time as {lockStatus.currentUser} is editing this record.
          </Tooltip>
        {:else}
          <CheckCircleOutline class="shrink-0" color="green" />
          <Tooltip>No issues found and record is saved.</Tooltip>
        {/if}
      </span>
    </div>
  </TableBodyCell>
  <TableBodyCell>
    <span>
      <ButtonGroup>
        <Button
          id={`edit-record-${liveRecordIndex}-btn`}
          onclick={() => onEdit(liveRecordIndex)}
          size="xs"
          class="p-2!"
          pill
          outline
          disabled={lockStatus != null}><EditOutline size="xs" /></Button
        >
        <Button
          id={`reload-record-${liveRecordIndex}-btn`}
          onclick={() => onReload(identifier)}
          size="xs"
          pill
          outline
          class="p-2!"><RefreshOutline size="xs" /></Button
        >
        <Button
          id={`open-dir-record-${liveRecordIndex}-btn`}
          onclick={() => onOpenDir(localRepoPath, identifier)}
          size="xs"
          pill
          outline
          class="p-2!"
          disabled={lockStatus != null}
        >
          <FolderArrowRightOutline size="xs" />
        </Button>
        <Button
          id={`delete-record-${liveRecordIndex}-btn`}
          onclick={() => onDelete(liveRecordIndex)}
          size="xs"
          pill
          outline
          color="red"
          disabled={lockStatus != null}
          class="p-2!"><TrashBinOutline size="xs" /></Button
        >
      </ButtonGroup>
      <Tooltip triggeredBy={`#edit-record-${liveRecordIndex}-btn`}>Edit Record Metadata</Tooltip>
      <Tooltip triggeredBy={`#reload-record-${liveRecordIndex}-btn`}>Reload from Disk</Tooltip>
      <Tooltip triggeredBy={`#open-dir-record-${liveRecordIndex}-btn`}
        >Open Record Directory</Tooltip
      >
      <Tooltip triggeredBy={`#delete-record-${liveRecordIndex}-btn`}>Delete Record</Tooltip>
    </span>
  </TableBodyCell>
  <TableBodyCell>{identifier}</TableBodyCell>
  {#each metadataDescriptors.filter(({ key }) => key != 'Identifier') as { key } (key)}
    <TableBodyCell>
      <div class="flex items-center">
        {#if issues[key] && issues[key].length}
          <ExclamationCircleOutline color="red" class="shrink-0" />
          <Popover>
            <ul>
              {#each issues[key] as issue (issue)}
                <li>{issue}</li>
              {/each}
            </ul>
          </Popover>
        {/if}
        {metadata[key]}
      </div>
    </TableBodyCell>
  {/each}
</TableBodyRow>
