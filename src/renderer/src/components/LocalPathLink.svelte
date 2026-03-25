<script lang="ts">
  import type { Snippet } from 'svelte'
  import { openRepoDirectory } from '../lib/repo.svelte'

  let { children, localPath }: { children: Snippet; localPath: string } = $props()
</script>

<a href={`file:${localPath}`} onclick={() => openRepoDirectory(localPath)}>{@render children()}</a>
