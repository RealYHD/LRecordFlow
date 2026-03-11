export async function previewTabular(path: string, rowsToPreview: number = 1): Promise<Record<string,string[]>> {
    return await window['tabular'].previewTabular(path)
}
