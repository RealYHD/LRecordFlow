<script lang="ts">
  import {
    Button,
    ButtonGroup,
    Modal,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Tooltip
  } from 'flowbite-svelte'
  import { appConfig, openedRepo } from '../lib/state.svelte'
  import {
    getAllRecordsForRepo,
    getRepoLastModified,
    openRepoDirectory,
    repoExists
  } from '../lib/repo.svelte'
  import { FolderArrowRightOutline, TrashBinOutline } from 'flowbite-svelte-icons'
  import AddRepository from '../components/AddRepository.svelte'
  import type { Repository } from '../../../common/types/models'
  import { location } from '@svelte-router/core'

  let repositories: Repository[] = $derived(appConfig.knownRepos)
  let lastModified: Record<string, Promise<Date | undefined>> = $derived.by(() => {
    let modifiedPromises: Record<string, Promise<Date | undefined>> = {}
    for (const repo of repositories) {
      modifiedPromises[repo.local] = getRepoLastModified(repo.local)
    }
    return modifiedPromises
  })
  let recordCounts: Record<string, Promise<number>> = $derived.by(() => {
    let recordCountPromises: Record<string, Promise<number>> = {}
    for (const repo of repositories) {
      recordCountPromises[repo.local] = new Promise((resolve, reject) => {
        getAllRecordsForRepo(repo.local)
          .then((records) => {
            resolve(records.length)
          })
          .catch((reason) => {
            reject(reason)
          })
      })
    }
    return recordCountPromises
  })

  let addRepositoryModalOpen: boolean = $state(false)

  async function validateRepositoryInformation(
    repoName: string,
    repoPath: string
  ): Promise<string[]> {
    let issues = []
    if (!(await repoExists(repoPath))) {
      issues.push(
        `Could not access "${repoPath}". Check if it exists and you have permission to access it.`
      )
    }
    if (repoName.trim().length == 0) {
      issues.push('Name must be non-blank.')
    }
    if (repoPath.length == 0) {
      issues.push('Repository path cannot be blank.')
    }
    let sameNameRepo = appConfig.knownRepos.find((repo) => repo.name == repoName)
    if (sameNameRepo != undefined) {
      issues.push(`"${repoName}" is already in use by repository at "${sameNameRepo.local}".`)
    }
    return issues
  }
</script>

<Modal bind:open={addRepositoryModalOpen}>
  <div>
    <div class="mb-4">
      <span>Add Repository</span>
    </div>
    <div>
      <AddRepository
        addRepositoryPath={(name, path) => {
          appConfig.knownRepos.push({
            name: name,
            local: path
          })
          addRepositoryModalOpen = false
        }}
        validateValues={validateRepositoryInformation}
      />
    </div>
  </div>
</Modal>

<div class="mx-4">
  <div class="my-2">
    <Button onclick={() => (addRepositoryModalOpen = true)}>Add Repository</Button>
  </div>
  <Table shadow>
    <TableHead>
      <TableHeadCell>Actions</TableHeadCell>
      <TableHeadCell>Name</TableHeadCell>
      <TableHeadCell>Last Modified</TableHeadCell>
      <TableHeadCell>Path</TableHeadCell>
      <TableHeadCell>Record Count</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each repositories as repository, index (index)}
        <TableBodyRow>
          <TableBodyCell>
            <ButtonGroup size="sm">
              <Button
                onclick={() => {
                  openedRepo.repo = repository
                  location.navigate('/view', { hash: true })
                }}
              >
                {#if openedRepo.repo && openedRepo.repo.local == repository.local}
                  View
                {:else}
                  Open
                {/if}
              </Button>
              <Button
                id={`delete-${index}-dir-btn`}
                onclick={() => {
                  openedRepo.repo = undefined
                  appConfig.knownRepos.splice(index, 1)
                }}><TrashBinOutline /></Button
              >
              <Button
                id={`open-${index}-dir-btn`}
                onclick={() => openRepoDirectory(repository.local)}
                ><FolderArrowRightOutline /></Button
              >
            </ButtonGroup>
            <Tooltip triggeredBy={`#delete-${index}-dir-btn`}
              >Delete Repository (Directory will not be deleted)</Tooltip
            >
            <Tooltip triggeredBy={`#open-${index}-dir-btn`}>Open Repository Directory</Tooltip>
          </TableBodyCell>
          <TableBodyCell>
            {repository.name}
          </TableBodyCell>
          <TableBodyCell>
            {#await lastModified[repository.local]}
              loading...
            {:then lastModifiedDate}
              {lastModifiedDate.toLocaleTimeString()}
            {/await}
          </TableBodyCell>
          <TableBodyCell>{repository.local}</TableBodyCell>
          <TableBodyCell>
            {#await recordCounts[repository.local]}
              loading...
            {:then count}
              {count}
            {/await}
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
  {#if Object.entries(repositories).length == 0}
    <div class="w-fit my-2 mx-auto">
      <span class="text-sm">No known repositories! Add one to get started!</span>
    </div>
  {/if}
</div>
