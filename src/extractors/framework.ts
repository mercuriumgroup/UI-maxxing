import { BaseExtractor } from './base.js'
import type { FrameworkDetection } from '../types/extraction.js'

export class FrameworkExtractor extends BaseExtractor<FrameworkDetection> {
  async extract(): Promise<FrameworkDetection> {
    throw new Error('FrameworkExtractor not implemented')
  }
}
