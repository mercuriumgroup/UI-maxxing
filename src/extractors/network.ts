import { BaseExtractor } from './base.js'
import type { NetworkExtractionResult } from '../types/extraction.js'

export class NetworkExtractor extends BaseExtractor<NetworkExtractionResult> {
  async extract(): Promise<NetworkExtractionResult> {
    return { endpoints: [], harPath: null }
  }
}
