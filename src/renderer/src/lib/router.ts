import { createRouter } from 'sv-router';
import SelectRepoPage from '../components/SelectRepoPage.svelte';
import RepoRelationalOverviewPage from '../components/overview/RepoRelationalViewPage.svelte';
import RepoItemOverviewPage from '../components/overview/RepoItemViewPage.svelte';
import OverviewLayout from '../components/overview/OverviewLayout.svelte';
import ConfigureRepoPage from '../components/ConfigureRepoPage.svelte';
import DetailedRecordViewPage from '../components/DetailedRecordViewPage.svelte';
import SavePage from '../components/save/SavePage.svelte';
import Help from '../components/help/Help.svelte';
import OngoingTasksPage from '../components/TasksOverviewPage.svelte';

export const { p, navigate, isActive, route } = createRouter({
    "/": SelectRepoPage,
    "/view": {
        "/relational": RepoRelationalOverviewPage,
        "/item": RepoItemOverviewPage,
        layout: OverviewLayout
    },
    "/record": DetailedRecordViewPage,
    "/configure": ConfigureRepoPage,
    "/tasks": OngoingTasksPage,
    "/save": SavePage,
    "/help": {
        "/": Help
    }
});