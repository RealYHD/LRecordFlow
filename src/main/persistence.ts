import { Conf, useConf } from 'electron-conf/main'

  // Initialize configuration persistence
  export const preferencesStore = new Conf({name: "preferences"})
  preferencesStore.registerRendererListener("preferences")
  export const appStateStore = new Conf({name: "state"})
  appStateStore.registerRendererListener("state")
  useConf()
  