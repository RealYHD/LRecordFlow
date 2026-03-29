import { createRouter } from 'sv-router'
import SelectRepoPage from '../pages/SelectRepoPage.svelte'
import RepoRelationalOverviewPage from '../pages/RepoOverview.svelte'
import HelpPage from '../pages/HelpPage.svelte'

export const { p, navigate, isActive, route } = createRouter({
  '/': SelectRepoPage,
  '/repository': RepoRelationalOverviewPage,
  '/help': HelpPage
})
