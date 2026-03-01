import { dialog } from "electron"

export async function handleDirectoryOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openDirectory"] })
    if (!canceled) {
        return filePaths[0]
    }
    return
}
