export async function previewTabular(
  path: string
): Promise<Record<string, Record<string, number>>> {
  return await window['tabular'].previewTabular(path)
}
