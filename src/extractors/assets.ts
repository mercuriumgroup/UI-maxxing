import { BaseExtractor } from './base.js'
import type { AssetExtractionResult, AssetEntry } from '../types/extraction.js'
import { join } from 'node:path'
import { ensureDir } from '../utils/fs.js'
import { writeFile } from 'node:fs/promises'

interface AssetsScriptResult {
  assets: AssetEntry[]
}

export class AssetExtractor extends BaseExtractor<AssetExtractionResult> {
  async extract(): Promise<AssetExtractionResult> {
    const args = this.config.selector ? { selector: this.config.selector } : undefined

    const result = await this.runScript<AssetsScriptResult>('extract-assets.js', args)

    const imgDir = join(this.config.output, 'assets', 'images')
    const svgDir = join(this.config.output, 'assets', 'svgs')
    await ensureDir(imgDir)
    await ensureDir(svgDir)

    const enrichedAssets: AssetEntry[] = []
    const failedDownloads: string[] = []
    let downloadedCount = 0

    for (const asset of result.assets) {
      let localPath: string | null = null

      try {
        if (asset.type === 'svg' && asset.metadata.innerHTML) {
          // Save inline SVG
          const filename = `inline-svg-${downloadedCount}.svg`
          localPath = join(svgDir, filename)
          const svgContent = asset.metadata.viewBox
            ? `<svg viewBox="${asset.metadata.viewBox}" xmlns="http://www.w3.org/2000/svg">${asset.metadata.innerHTML}</svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg">${asset.metadata.innerHTML}</svg>`
          await writeFile(localPath, svgContent, 'utf-8')
          downloadedCount++
        } else if (asset.src && asset.type === 'image' && !asset.src.startsWith('data:')) {
          // Download remote image
          const url = asset.src.startsWith('http') ? asset.src : new URL(asset.src, this.page.url()).href
          try {
            const response = await this.page.context().request.get(url)
            if (response.ok()) {
              const ext = (asset.format !== 'unknown' ? asset.format : 'png').replace('jpeg', 'jpg')
              const filename = `image-${downloadedCount}.${ext}`
              localPath = join(imgDir, filename)
              await writeFile(localPath, await response.body())
              downloadedCount++
            } else {
              failedDownloads.push(asset.src)
            }
          } catch {
            failedDownloads.push(asset.src)
          }
        }
      } catch {
        if (asset.src) failedDownloads.push(asset.src)
      }

      enrichedAssets.push({ ...asset, localPath })
    }

    return {
      assets: enrichedAssets,
      downloadedCount,
      failedDownloads,
    }
  }
}
