export async function selectSingleDirectory(): Promise<string> {
    return await window['dialog'].selectSingleDirectory()
}

export async function selectSingleFileOfType(filetypes: { name: string, extensions: string[] }[]): Promise<string> {
    return await window['dialog'].selectSingleFileOfType(filetypes)
}