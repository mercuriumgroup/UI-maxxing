import { BaseExtractor } from './base.js'
import type { BehaviorExtractionResult, BehaviorEntry } from '../types/extraction.js'

interface BehaviorScriptResult {
  interactions: BehaviorEntry[]
  scrollBehaviors: BehaviorEntry[]
  forms: BehaviorEntry[]
}

export class BehaviorExtractor extends BaseExtractor<BehaviorExtractionResult> {
  async extract(): Promise<BehaviorExtractionResult> {
    const args = this.config.selector ? { selector: this.config.selector } : undefined

    const result = await this.runScript<BehaviorScriptResult>('extract-behavior.js', args)

    // Enrich interactive elements with event listeners via CDP
    try {
      const cdp = await this.page.context().newCDPSession(this.page)

      for (const interaction of result.interactions) {
        try {
          const el = await this.page.$(interaction.selector)
          if (!el) continue

          // Get the remote object ID for the element
          const remoteObject = await cdp.send('Runtime.evaluate', {
            expression: `document.querySelector('${interaction.selector.replace(/'/g, "\\'")}')`,
            objectGroup: 'designmaxxing',
          })

          if (remoteObject.result?.objectId) {
            const { listeners } = await cdp.send('DOMDebugger.getEventListeners', {
              objectId: remoteObject.result.objectId,
            })

            const eventNames = [...new Set(listeners.map((l: { type: string }) => l.type))]
            ;(interaction as unknown as { events: string[] }).events = eventNames
          }
        } catch {
          // CDP call failed for this element
        }
      }

      await cdp.detach()
    } catch {
      // CDP not available — return without event listener data
    }

    return {
      interactions: result.interactions,
      scrollBehaviors: result.scrollBehaviors,
      forms: result.forms,
    }
  }
}
