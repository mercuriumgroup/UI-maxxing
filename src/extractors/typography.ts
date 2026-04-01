import { BaseExtractor } from './base.js'
import type { TypographyExtractionResult } from '../types/extraction.js'

export class TypographyExtractor extends BaseExtractor<TypographyExtractionResult> {
  async extract(): Promise<TypographyExtractionResult> {
    throw new Error('TypographyExtractor not implemented')
  }
}
