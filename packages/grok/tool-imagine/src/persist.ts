/**
 * Write Imagine response bytes to a sequential file under an output directory.
 * @module @deepseek-ai/dsh-tool-imagine/persist
 */

import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Map file magic bytes to a filename extension including the leading dot. */
export function extensionForBytes(bytes: Uint8Array, fallback: '.png' | '.mp4'): '.png' | '.jpg' | '.gif' | '.webp' | '.mp4' {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return '.png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return '.jpg'
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return '.gif'
  if (bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return '.webp'
  }
  if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return '.mp4'
  return fallback
}

/**
 * Persist non-empty bytes as the next sequential file in `outputDir`.
 * @param outputDir - destination directory, created when missing.
 * @param bytes - complete media payload.
 * @param fallbackExt - extension used when magic bytes are unrecognized.
 * @returns the absolute path written.
 */
export async function persistBytes(
  outputDir: string,
  bytes: Uint8Array,
  fallbackExt: '.png' | '.mp4',
): Promise<string> {
  if (bytes.byteLength === 0) throw new Error('Imagine persist: empty media payload')
  await mkdir(outputDir, { recursive: true })
  const existing = await readdir(outputDir)
  const ext = extensionForBytes(bytes, fallbackExt)
  let index = 1
  while (existing.includes(`${String(index)}${ext}`)) index += 1
  const filePath = join(outputDir, `${String(index)}${ext}`)
  await writeFile(filePath, bytes)
  return filePath
}
