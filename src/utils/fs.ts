import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import type { ExtractionConfig } from '../types/config.js'

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await ensureDir(dirname(path))
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

export async function readJson<T>(path: string): Promise<T> {
  const content = await readFile(path, 'utf-8')
  return JSON.parse(content) as T
}

export function resolveOutputPath(config: ExtractionConfig, filename: string): string {
  return join(config.output, filename)
}
