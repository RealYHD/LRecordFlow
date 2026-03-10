import { dialog, FileFilter } from 'electron'

export async function selectSingleDirectory() {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (!canceled) {
    return filePaths[0]
  }
  return null
}

export async function selectSingleFileOfType(fileFilters: FileFilter[]) {
  const {canceled, filePaths} = await dialog.showOpenDialog({ properties: ['openFile'], filters: fileFilters })
  if (!canceled) {
    return filePaths[0]
  }
  return null
}
