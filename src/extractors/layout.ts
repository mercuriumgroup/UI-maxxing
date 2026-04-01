import { BaseExtractor } from './base.js'
import type { LayoutExtractionResult } from '../types/extraction.js'

export class LayoutExtractor extends BaseExtractor<LayoutExtractionResult> {
  async extract(): Promise<LayoutExtractionResult> {
    throw new Error('LayoutExtractor not implemented')
  }
}
