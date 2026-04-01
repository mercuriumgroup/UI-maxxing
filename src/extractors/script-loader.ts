import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const scriptCache = new Map<string, string>()

export async function loadScript(name: string): Promise<string> {
  const cached = scriptCache.get(name)
  if (cached) return cached

  // Try dist/scripts/ first (production), then src/scripts/ (dev)
  const paths = [
    join(__dirname, '..', 'scripts', name),
    join(__dirname, '..', '..', 'src', 'scripts', name),
  ]

  for (const path of paths) {
    try {
      const content = await readFile(path, 'utf-8')
      scriptCache.set(name, content)
      return content
    } catch {
      // Try next path
    }
  }

  throw new Error(`Script not found: ${name} (searched: ${paths.join(', ')})`)
}
