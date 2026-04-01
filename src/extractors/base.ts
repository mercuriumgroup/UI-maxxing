import type { Page } from 'playwright'
import type { ExtractionConfig } from '../types/config.js'
import { join } from 'node:path'
import { ensureDir } from '../utils/fs.js'

export abstract class BaseExtractor<TResult> {
  protected page!: Page
  protected config: ExtractionConfig

  constructor(config: ExtractionConfig) {
    this.config = config
  }

  abstract extract(): Promise<TResult>

  protected async injectScript<T>(scriptContent: string, args?: unknown): Promise<T> {
    return this.page.evaluate(
      new Function('args', scriptContent + '\nreturn __extract(args)') as (args: unknown) => T,
      args
    )
  }

  setPage(page: Page): void {
    this.page = page
  }

  protected async screenshot(name: string): Promise<string> {
    const dir = join(this.config.output, 'screenshots')
    await ensureDir(dir)
    const path = join(dir, `${name}.png`)
    await this.page.screenshot({ path, fullPage: this.config.fullPage })
    return path
  }

  protected async setBreakpoint(width: number): Promise<void> {
    await this.page.setViewportSize({ width, height: this.config.viewport.height })
    await this.page.waitForTimeout(500)
  }
}
