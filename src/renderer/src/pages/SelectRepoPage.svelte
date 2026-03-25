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
  import { appStateStore, loadAppState } from '../lib/state.svelte'
  import {
    getAllRecordsForRepo,
    getRepoLastModified,
    openRepoDirectory,
    repoExists
  } from '../lib/repo.svelte'
  import { onMount } from 'svelte'
  import { navigate } from '../lib/router.svelte'
  import { FolderArrowRightOutline, TrashBinOutline } from 'flowbite-svelte-icons'
  import AddRepository from '../components/AddRepository.svelte'
  let repos: Record<
    string,
    {
      name: string | undefined
      lastModified: string | undefined
      recordCount: number | undefined
    }
  > = $state({})

  let addRepositoryModalOpen: boolean = $state(false)

  function loadRepos(): void {
    repos = {}
    for (const repo of appStateStore.state.knownRepos) {
      let repoInfo = {
        name: repo.name,
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
    let sameNameRepo = appStateStore.state.knownRepos.find((repo) => repo.name == repoName)
    if (sameNameRepo != undefined) {
      issues.push(`"${repoName}" is already in use by repository at "${sameNameRepo.local}".`)
    }
    return issues
  }

  onMount(() => {
    loadAppState().then(() => {
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
          appStateStore.state.knownRepos.push({
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
    <Button onclick={() => (addRepositoryModalOpen = true)} outline color="secondary"
      >Create Repository</Button
    >
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
      {#each Object.entries(repos).toSorted(([, repoA], [, repoB]) => Date.parse(repoA.lastModified) - Date.parse(repoB.lastModified)) as [localPath, repo], index (index)}
        <TableBodyRow>
          <TableBodyCell>
            <ButtonGroup size="sm">
              <Button
                onclick={() => {
                  appStateStore.state.openedRepoPath = localPath
                  navigate('/repository')
                }}
              >
                {#if appStateStore.state.openedRepoPath == localPath}
                  View
                {:else}
                  Open
                {/if}
              </Button>
              <Button
                id={`delete-${index}-dir-btn`}
                onclick={() => {
                  appStateStore.state.openedRepoPath = undefined
                  appStateStore.state.knownRepos.splice(index, 1)
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
            {repo.name}
          </TableBodyCell>
          <TableBodyCell>
            {#if repo.lastModified != undefined}
              {repo.lastModified}
            {:else}
              Loading...
            {/if}
          </TableBodyCell>
          <TableBodyCell>{localPath}</TableBodyCell>
          <TableBodyCell>
            {#if repo.recordCount != undefined}
              {repo.recordCount}
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
