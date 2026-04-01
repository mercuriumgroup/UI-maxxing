import { BaseExtractor } from './base.js'
import type { VisualExtractionResult } from '../types/extraction.js'

export class VisualExtractor extends BaseExtractor<VisualExtractionResult> {
  async extract(): Promise<VisualExtractionResult> {
    throw new Error('VisualExtractor not implemented')
  }
}
