import { BaseExtractor } from './base.js'
import type { AnimationExtractionResult } from '../types/extraction.js'

export class AnimationExtractor extends BaseExtractor<AnimationExtractionResult> {
  async extract(): Promise<AnimationExtractionResult> {
    throw new Error('AnimationExtractor not implemented')
  }
}
