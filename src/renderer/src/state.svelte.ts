import Store from "electron-store";
import type { AppState, Preferences } from "./entities";

export const preferencesStore: Store<Preferences> = new Store<Preferences>()
export const appStateStore: Store<AppState> = new Store<AppState>()