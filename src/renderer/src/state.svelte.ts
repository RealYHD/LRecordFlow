import type { AppState, Preferences } from "./entities";
import { Conf } from 'electron-conf/renderer'

export const preferencesStore: Conf<Preferences> = new Conf<Preferences>({name: "preferences"})
export const appStateStore: Conf<AppState> = new Conf<AppState>({name: "state"})
