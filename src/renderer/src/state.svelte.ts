import type { AppState, Preferences } from "./entities";
import { Conf } from 'electron-conf/renderer'

export const preferencesStore: Conf<Preferences> = new Conf<Preferences>()
export const appStateStore: Conf<AppState> = new Conf<AppState>()