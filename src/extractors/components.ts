import { BaseExtractor } from './base.js'
import type { ComponentExtractionResult } from '../types/extraction.js'

export class ComponentExtractor extends BaseExtractor<ComponentExtractionResult> {
  async extract(): Promise<ComponentExtractionResult> {
    throw new Error('ComponentExtractor not implemented')
  }
}
