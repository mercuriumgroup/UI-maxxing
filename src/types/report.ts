import type { ExtractionManifest, FrameworkDetection, VisualExtractionResult, TypographyExtractionResult, LayoutExtractionResult, ComponentExtractionResult, AnimationExtractionResult } from './extraction.js'
import type { DesignTokens } from './tokens.js'

export interface ReportData {
  readonly manifest: ExtractionManifest
  readonly tokens: DesignTokens | null
  readonly visual: VisualExtractionResult | null
  readonly typography: TypographyExtractionResult | null
  readonly layout: LayoutExtractionResult | null
  readonly components: ComponentExtractionResult | null
  readonly animations: AnimationExtractionResult | null
  readonly screenshotPaths: Record<number, string>
  readonly frameworkReport: FrameworkDetection | null
  readonly assetCount: number
  readonly endpointCount: number
  readonly includeScreenshots: boolean
}

export type ReportFormat = 'html' | 'markdown'
