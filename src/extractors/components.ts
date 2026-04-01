import { BaseExtractor } from './base.js'
import type { ComponentExtractionResult, ComponentEntry } from '../types/extraction.js'

interface ComponentsScriptResult {
  components: ComponentEntry[]
  totalElements: number
}

export class ComponentExtractor extends BaseExtractor<ComponentExtractionResult> {
  async extract(): Promise<ComponentExtractionResult> {
    const args = this.config.selector ? { selector: this.config.selector } : undefined

    const result = await this.runScript<ComponentsScriptResult>('extract-components.js', args)

    // For each detected component, capture hover/focus state styles
    const enrichedComponents: ComponentEntry[] = []

    for (const comp of result.components) {
      const states: Record<string, Record<string, string>> = {}

      try {
        const el = await this.page.$(comp.selector)
        if (el) {
          // Default state
          const defaultStyles = await el.evaluate((node) => {
            const cs = getComputedStyle(node)
            return {
              backgroundColor: cs.backgroundColor,
              color: cs.color,
              borderColor: cs.borderTopColor,
              boxShadow: cs.boxShadow,
              transform: cs.transform,
              opacity: cs.opacity,
            }
          })
          states['default'] = defaultStyles

          // Hover state
          try {
            await el.hover()
            const hoverStyles = await el.evaluate((node) => {
              const cs = getComputedStyle(node)
              return {
                backgroundColor: cs.backgroundColor,
                color: cs.color,
                borderColor: cs.borderTopColor,
                boxShadow: cs.boxShadow,
                transform: cs.transform,
                opacity: cs.opacity,
              }
            })
            states['hover'] = hoverStyles
          } catch {
            // Element might not be hoverable
          }

          // Focus state
          try {
            await el.focus()
            const focusStyles = await el.evaluate((node) => {
              const cs = getComputedStyle(node)
              return {
                backgroundColor: cs.backgroundColor,
                color: cs.color,
                borderColor: cs.borderTopColor,
                boxShadow: cs.boxShadow,
                outline: cs.outline,
                outlineColor: cs.outlineColor,
              }
            })
            states['focus'] = focusStyles
          } catch {
            // Element might not be focusable
          }
        }
      } catch {
        // Selector might not match a unique element
      }

      enrichedComponents.push({
        ...comp,
        states: Object.keys(states).length > 0 ? states : comp.states,
      })
    }

    return {
      components: enrichedComponents,
      totalElements: result.totalElements,
    }
  }
}
