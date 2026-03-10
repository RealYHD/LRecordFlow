import { dialog, FileFilter } from 'electron'

export async function selectSingleDirectory() {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (!canceled) {
    return filePaths[0]
  }
  return
}

export async function selectSingleFileOfType(fileFilters: FileFilter[]) {
  return await dialog.showOpenDialog({ properties: ['openFile'] })
}
