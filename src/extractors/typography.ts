import { BaseExtractor } from './base.js'
import type { TypographyExtractionResult } from '../types/extraction.js'
import { join } from 'node:path'
import { ensureDir } from '../utils/fs.js'
import { writeFile } from 'node:fs/promises'

interface TypoScriptResult {
  scale: TypographyExtractionResult['scale']
  fontFaces: TypographyExtractionResult['fontFaces']
  fontLoadStrategy: string | null
}

export class TypographyExtractor extends BaseExtractor<TypographyExtractionResult> {
  async extract(): Promise<TypographyExtractionResult> {
    const args = this.config.selector ? { selector: this.config.selector } : undefined

    // Intercept font file requests and download them
    const fontDir = join(this.config.output, 'assets', 'fonts')
    await ensureDir(fontDir)
    const downloadedFonts: string[] = []

    await this.page.route('**/*.{woff,woff2,ttf,otf,eot}', async (route) => {
      const response = await route.fetch()
      const url = route.request().url()
      const filename = url.split('/').pop()?.split('?')[0] || 'font'
      try {
        const buffer = await response.body()
        const localPath = join(fontDir, filename)
        await writeFile(localPath, buffer)
        downloadedFonts.push(localPath)
      } catch {
        // Font download failed — continue
      }
      await route.fulfill({ response })
    })

    // Reload to capture font requests via the route
    await this.page.reload({ waitUntil: 'networkidle' })

    const result = await this.runScript<TypoScriptResult>('extract-typography.js', args)

    // Unroute to clean up
    await this.page.unroute('**/*.{woff,woff2,ttf,otf,eot}')

    return {
      scale: result.scale,
      fontFaces: result.fontFaces,
      fontLoadStrategy: result.fontLoadStrategy,
    }
  }
}
