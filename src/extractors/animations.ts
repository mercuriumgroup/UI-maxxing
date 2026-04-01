import { BaseExtractor } from './base.js'
import type { AnimationExtractionResult } from '../types/extraction.js'

interface AnimationsScriptResult {
  transitions: AnimationExtractionResult['transitions']
  keyframes: AnimationExtractionResult['keyframes']
}

export class AnimationExtractor extends BaseExtractor<AnimationExtractionResult> {
  async extract(): Promise<AnimationExtractionResult> {
    const args = this.config.selector ? { selector: this.config.selector } : undefined

    const result = await this.runScript<AnimationsScriptResult>('extract-animations.js', args)

    return {
      transitions: result.transitions,
      keyframes: result.keyframes,
    }
  }
}
