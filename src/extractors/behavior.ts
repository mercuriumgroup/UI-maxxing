import { BaseExtractor } from './base.js'
import type { BehaviorExtractionResult } from '../types/extraction.js'

export class BehaviorExtractor extends BaseExtractor<BehaviorExtractionResult> {
  async extract(): Promise<BehaviorExtractionResult> {
    throw new Error('BehaviorExtractor not implemented')
  }
}
