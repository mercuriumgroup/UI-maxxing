import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import type { ExtractionConfig, ExtractionModule } from '../types/config.js'
import type { ExtractionManifest, FrameworkDetection } from '../types/extraction.js'
import type { BaseExtractor } from './base.js'
import { ensureDir, writeJson } from '../utils/fs.js'
import { join } from 'node:path'

interface ExtractorMap {
  visual: () => Promise<BaseExtractor<unknown>>
  typography: () => Promise<BaseExtractor<unknown>>
  layout: () => Promise<BaseExtractor<unknown>>
  components: () => Promise<BaseExtractor<unknown>>
  assets: () => Promise<BaseExtractor<unknown>>
  animations: () => Promise<BaseExtractor<unknown>>
  behavior: () => Promise<BaseExtractor<unknown>>
  framework: () => Promise<BaseExtractor<unknown>>
  network: () => Promise<BaseExtractor<unknown>>
}

function getExtractorLoaders(config: ExtractionConfig): ExtractorMap {
  return {
    visual: async () => { const { VisualExtractor } = await import('./visual.js'); return new VisualExtractor(config) },
    typography: async () => { const { TypographyExtractor } = await import('./typography.js'); return new TypographyExtractor(config) },
    layout: async () => { const { LayoutExtractor } = await import('./layout.js'); return new LayoutExtractor(config) },
    components: async () => { const { ComponentExtractor } = await import('./components.js'); return new ComponentExtractor(config) },
    assets: async () => { const { AssetExtractor } = await import('./assets.js'); return new AssetExtractor(config) },
    animations: async () => { const { AnimationExtractor } = await import('./animations.js'); return new AnimationExtractor(config) },
    behavior: async () => { const { BehaviorExtractor } = await import('./behavior.js'); return new BehaviorExtractor(config) },
    framework: async () => { const { FrameworkExtractor } = await import('./framework.js'); return new FrameworkExtractor(config) },
    network: async () => { const { NetworkExtractor } = await import('./network.js'); return new NetworkExtractor(config) },
  }
}

export async function extractAll(config: ExtractionConfig): Promise<ExtractionManifest> {
  await ensureDir(config.output)

  let browser: Browser | null = null
  let context: BrowserContext | null = null

  try {
    browser = await chromium.launch({ headless: config.headless })
    context = await browser.newContext({
      viewport: { width: config.viewport.width, height: config.viewport.height },
      userAgent: config.userAgent,
    })

    // Load auth cookies if provided
    if (config.authCookies) {
      const { readJson } = await import('../utils/fs.js')
      const cookies = await readJson<Array<{ name: string; value: string; domain: string; path: string }>>(config.authCookies)
      await context.addCookies(cookies)
    }

    const page = await context.newPage()

    // Start HAR recording if network module enabled
    const recordHar = config.modules.includes('network')
    if (recordHar) {
      await context.tracing.start({ screenshots: false, snapshots: false })
    }

    await page.goto(config.url, { waitUntil: 'load', timeout: config.timeout })

    if (config.waitForSelector) {
      await page.waitForSelector(config.waitForSelector, { timeout: config.timeout })
    }

    const loaders = getExtractorLoaders(config)
    const results: Record<string, string> = {}
    let frameworkResult: FrameworkDetection | null = null

    // Run framework detection first if enabled
    if (config.modules.includes('framework')) {
      const extractor = await loaders.framework()
      extractor.setPage(page)
      const result = await extractor.extract()
      const outputPath = join(config.output, 'framework.json')
      await writeJson(outputPath, result)
      results['framework'] = 'framework.json'
      frameworkResult = result as FrameworkDetection
    }

    // Run remaining modules
    for (const mod of config.modules) {
      if (mod === 'framework') continue

      const extractor = await loaders[mod as ExtractionModule]()
      extractor.setPage(page)
      const result = await extractor.extract()
      const filename = `${mod}.json`
      const outputPath = join(config.output, filename)
      await writeJson(outputPath, result)
      results[mod] = filename
    }

    // Take screenshots at each breakpoint
    for (const bp of config.breakpoints) {
      await page.setViewportSize({ width: bp, height: config.viewport.height })
      await page.waitForTimeout(500)
      const screenshotDir = join(config.output, 'screenshots')
      await ensureDir(screenshotDir)
      await page.screenshot({
        path: join(screenshotDir, `breakpoint-${bp}.png`),
        fullPage: config.fullPage,
      })
    }

    const manifest: ExtractionManifest = {
      url: config.url,
      timestamp: new Date().toISOString(),
      breakpoints: config.breakpoints,
      modules: [...config.modules],
      outputDir: config.output,
      framework: frameworkResult,
      results,
    }

    await writeJson(join(config.output, 'manifest.json'), manifest)

    return manifest
  } finally {
    await context?.close()
    await browser?.close()
  }
}
