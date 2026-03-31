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
  import { appConfig, guaranteeConfiguration, openedRepo } from '../lib/state.svelte'
  import {
    getAllRecordsForRepo,
    getRepoLastModified,
    openRepoDirectory,
    repoExists
  } from '../lib/repo.svelte'
  import { onMount } from 'svelte'
  import { FolderArrowRightOutline, TrashBinOutline } from 'flowbite-svelte-icons'
  import AddRepository from '../components/AddRepository.svelte'
  import type { Repository } from '../../../common/types/models'
  import { location } from '@svelte-router/core'

  interface RepositoryInformation {
    repository: Repository | undefined
    lastModified: string | undefined
    recordCount: number | undefined
  }

  let repos: Record<string, RepositoryInformation> = $state({})

  let addRepositoryModalOpen: boolean = $state(false)

  function loadRepos(): void {
    repos = {}
    for (const repo of appConfig.knownRepos) {
      let repoInfo: RepositoryInformation = {
        repository: repo,
        lastModified: undefined,
        recordCount: undefined
      }
      let promises: Promise<void>[] = []
      promises.push(
        getRepoLastModified(repo.local).then((lastModified) => {
          if (lastModified) {
            repoInfo.lastModified = lastModified.toLocaleString()
          } else {
            repoInfo.lastModified = 'Unavailable'
          }
        })
      )
      promises.push(
        getAllRecordsForRepo(repo.local).then((records) => {
          repoInfo.recordCount = records.length
        })
      )
      Promise.all(promises).then(() => {
        repos[repo.local] = repoInfo
      })
    }
  }

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

  onMount(() => {
    guaranteeConfiguration().then(() => {
      loadRepos()
    })
  })
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
          loadRepos()
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
      {#each Object.entries(repos).toSorted(([, repoA], [, repoB]) => Date.parse(repoA.lastModified) - Date.parse(repoB.lastModified)) as [localPath, repoInfo], index (index)}
        <TableBodyRow>
          <TableBodyCell>
            <ButtonGroup size="sm">
              <Button
                onclick={() => {
                  openedRepo.repo = repoInfo.repository
                  location.navigate('/view')
                }}
              >
                {#if openedRepo.repo && openedRepo.repo.local == localPath}
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
                  loadRepos()
                }}><TrashBinOutline /></Button
              >
              <Button id={`open-${index}-dir-btn`} onclick={() => openRepoDirectory(localPath)}
                ><FolderArrowRightOutline /></Button
              >
            </ButtonGroup>
            <Tooltip triggeredBy={`#delete-${index}-dir-btn`}
              >Delete Repository (Directory will not be deleted)</Tooltip
            >
            <Tooltip triggeredBy={`#open-${index}-dir-btn`}>Open Repository Directory</Tooltip>
          </TableBodyCell>
          <TableBodyCell>
            {repoInfo.repository.name}
          </TableBodyCell>
          <TableBodyCell>
            {#if repoInfo.lastModified != undefined}
              {repoInfo.lastModified}
            {:else}
              Loading...
            {/if}
          </TableBodyCell>
          <TableBodyCell>{localPath}</TableBodyCell>
          <TableBodyCell>
            {#if repoInfo.recordCount != undefined}
              {repoInfo.recordCount}
            {:else}
              Loading...
            {/if}
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
  {#if Object.entries(repos).length == 0}
    <div class="w-fit my-2 mx-auto">
      <span class="text-sm">No known repositories! Add one to get started!</span>
    </div>
  {/if}
</div>
