import { BaseExtractor } from './base.js'
import type { NetworkExtractionResult, NetworkEndpoint } from '../types/extraction.js'
import { join } from 'node:path'
import { writeJson, ensureDir } from '../utils/fs.js'

interface HarEntry {
  method: string
  url: string
  status: number
  contentType: string
  size: number
}

export class NetworkExtractor extends BaseExtractor<NetworkExtractionResult> {
  async extract(): Promise<NetworkExtractionResult> {
    const endpoints: NetworkEndpoint[] = []
    const harEntries: HarEntry[] = []

    // Intercept all requests to build endpoint inventory
    this.page.on('response', async (response) => {
      try {
        const request = response.request()
        const url = request.url()
        const resourceType = request.resourceType()

        // Only track fetch/xhr requests (API calls)
        if (resourceType === 'fetch' || resourceType === 'xhr') {
          const headers = await response.allHeaders()
          const contentType = headers['content-type'] || ''
          let size = 0
          try {
            const body = await response.body()
            size = body.length
          } catch {
            // Response body not available
          }

          harEntries.push({
            method: request.method(),
            url,
            status: response.status(),
            contentType,
            size,
          })
        }
      } catch {
        // Response processing failed
      }
    })

    // Reload the page to capture network requests
    await this.page.reload({ waitUntil: 'networkidle' })

    // Wait a bit for any deferred requests
    await this.page.waitForTimeout(2000)

    // Scroll to trigger lazy-loaded content
    await this.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 300
        const timer = setInterval(() => {
          window.scrollBy(0, distance)
          totalHeight += distance
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer)
            window.scrollTo(0, 0)
            resolve()
          }
        }, 100)
      })
    })

    // Wait for any scroll-triggered requests
    await this.page.waitForTimeout(2000)

    // Build endpoint summary
    for (const entry of harEntries) {
      endpoints.push({
        method: entry.method,
        url: entry.url,
        status: entry.status,
        contentType: entry.contentType,
        payloadSize: entry.size,
      })
    }

    // Save HAR-like data
    let harPath: string | null = null
    if (harEntries.length > 0) {
      const harDir = join(this.config.output, 'network')
      await ensureDir(harDir)
      harPath = join(harDir, 'requests.json')
      await writeJson(harPath, harEntries)
    }

    return { endpoints, harPath }
  }
}
