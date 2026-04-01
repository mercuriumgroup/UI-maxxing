export interface ReportData {
  readonly manifest: import('./extraction.js').ExtractionManifest
  readonly tokens: import('./tokens.js').DesignTokens | null
  readonly screenshotPaths: Record<number, string>
  readonly frameworkReport: import('./extraction.js').FrameworkDetection | null
  readonly componentCount: number
  readonly assetCount: number
  readonly endpointCount: number
}

export type ReportFormat = 'html' | 'markdown'
