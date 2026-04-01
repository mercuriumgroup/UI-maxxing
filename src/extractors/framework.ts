import { BaseExtractor } from './base.js'
import type { FrameworkDetection } from '../types/extraction.js'

export class FrameworkExtractor extends BaseExtractor<FrameworkDetection> {
  async extract(): Promise<FrameworkDetection> {
    const result = await this.runScript<FrameworkDetection>('detect-framework.js')

    return {
      frameworks: result.frameworks,
      cssMethodology: result.cssMethodology,
      componentLibrary: result.componentLibrary,
    }
  }
}
