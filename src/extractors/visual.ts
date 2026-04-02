import { BaseExtractor } from './base.js'
import type { VisualExtractionResult } from '../types/extraction.js'

export class VisualExtractor extends BaseExtractor<VisualExtractionResult> {
  async extract(): Promise<VisualExtractionResult> {
    return { styles: [], colors: [], shadows: [], borderRadii: [] }
  }
}
