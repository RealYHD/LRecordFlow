import { dialog, FileFilter } from 'electron'

export async function selectSingleDirectory(): Promise<string | undefined> {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (!canceled) {
    return filePaths[0]
  }
  return undefined
}

export async function selectSingleFileOfType(
  fileFilters: FileFilter[]
): Promise<string | undefined> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: fileFilters
  })
  if (!canceled) {
    return filePaths[0]
  }
  return undefined
}
