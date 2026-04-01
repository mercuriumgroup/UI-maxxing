import type { VisualExtractionResult, TypographyExtractionResult } from '../types/extraction.js'
import type { DesignTokens, TokenOutputFormat } from '../types/tokens.js'

export function generateDesignTokens(
  _visual: VisualExtractionResult,
  _typography: TypographyExtractionResult,
): DesignTokens {
  throw new Error('generateDesignTokens not implemented')
}

export function formatTokens(_tokens: DesignTokens, _format: TokenOutputFormat): string {
  throw new Error('formatTokens not implemented')
}
