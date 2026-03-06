import { createRouter } from 'sv-router';
import SelectRepoPage from '../pages/SelectRepoPage.svelte';
import RepoRelationalOverviewPage from '../pages/RepoRelationalViewPage.svelte';
import RepoItemOverviewPage from '../pages/RepoItemViewPage.svelte';
import ConfigureRepoPage from '../components/ConfigureRepository.svelte';
import SavePage from '../pages/SavePage.svelte';
import OngoingTasksPage from '../pages/TasksOverviewPage.svelte';
import HelpPage from '../pages/HelpPage.svelte';

export const { p, navigate, isActive, route } = createRouter({
    "/": SelectRepoPage,
    "/:repository": {
        "/relational": RepoRelationalOverviewPage,
        "/item": RepoItemOverviewPage,
        "/save": SavePage,
        "/configure": ConfigureRepoPage
    },
    "/notifications": OngoingTasksPage,
    "/configure": ConfigureRepoPage,
    "/help": HelpPage
});