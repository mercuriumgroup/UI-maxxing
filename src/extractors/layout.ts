import { BaseExtractor } from './base.js'
import type { LayoutExtractionResult } from '../types/extraction.js'

interface LayoutScriptResult {
  containers: LayoutExtractionResult['containers']
  breakpoints: LayoutExtractionResult['breakpoints']
  rootMaxWidth: string | null
}

export class LayoutExtractor extends BaseExtractor<LayoutExtractionResult> {
  async extract(): Promise<LayoutExtractionResult> {
    const args = this.config.selector ? { selector: this.config.selector } : undefined

    // Extract at default viewport
    const result = await this.runScript<LayoutScriptResult>('extract-layout.js', args)

    // Extract at each breakpoint to see layout changes
    for (const bp of this.config.breakpoints) {
      await this.setBreakpoint(bp)
      await this.runScript<LayoutScriptResult>('extract-layout.js', args)
    }

    // Reset viewport
    await this.page.setViewportSize({
      width: this.config.viewport.width,
      height: this.config.viewport.height,
    })

    return {
      containers: result.containers,
      breakpoints: result.breakpoints,
      rootMaxWidth: result.rootMaxWidth,
    }
  }
}
