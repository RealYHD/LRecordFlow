export async function openFolderSelector(): Promise<string> {
    return await window['dialog'].handleDirectoryOpen()
}