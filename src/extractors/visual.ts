import { BaseExtractor } from './base.js'
import type { VisualExtractionResult, ComputedStyleEntry, ColorEntry } from '../types/extraction.js'

interface StylesScriptResult {
  styles: ComputedStyleEntry[]
  count: number
}

interface ColorsScriptResult {
  colors: ColorEntry[]
}

export class VisualExtractor extends BaseExtractor<VisualExtractionResult> {
  async extract(): Promise<VisualExtractionResult> {
    const args = this.config.selector ? { selector: this.config.selector } : undefined

    // Run styles and colors extraction
    const [stylesResult, colorsResult] = await Promise.all([
      this.runScript<StylesScriptResult>('extract-styles.js', args),
      this.runScript<ColorsScriptResult>('extract-colors.js', args),
    ])

    // Deduplicate shadows and border-radii from style results
    const shadowSet = new Set<string>()
    const radiusSet = new Set<string>()

    for (const entry of stylesResult.styles) {
      if (entry.boxShadow && entry.boxShadow !== 'none') {
        shadowSet.add(entry.boxShadow)
      }
      if (entry.borderRadius && entry.borderRadius !== '0px') {
        radiusSet.add(entry.borderRadius)
      }
    }

    // Extract per-breakpoint styles
    for (const bp of this.config.breakpoints) {
      await this.setBreakpoint(bp)
      const bpStyles = await this.runScript<StylesScriptResult>('extract-styles.js', args)
      // Collect additional shadows/radii from breakpoints
      for (const entry of bpStyles.styles) {
        if (entry.boxShadow && entry.boxShadow !== 'none') shadowSet.add(entry.boxShadow)
        if (entry.borderRadius && entry.borderRadius !== '0px') radiusSet.add(entry.borderRadius)
      }
    }

    // Reset viewport
    await this.page.setViewportSize({
      width: this.config.viewport.width,
      height: this.config.viewport.height,
    })

    return {
      styles: stylesResult.styles,
      colors: colorsResult.colors,
      shadows: Array.from(shadowSet),
      borderRadii: Array.from(radiusSet),
    }
  }
}
