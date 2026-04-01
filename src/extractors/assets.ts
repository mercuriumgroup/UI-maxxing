import { BaseExtractor } from './base.js'
import type { AssetExtractionResult } from '../types/extraction.js'

export class AssetExtractor extends BaseExtractor<AssetExtractionResult> {
  async extract(): Promise<AssetExtractionResult> {
    throw new Error('AssetExtractor not implemented')
  }
}
