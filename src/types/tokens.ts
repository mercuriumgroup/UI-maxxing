export interface DesignTokens {
  readonly colors: Record<string, string>
  readonly typography: Record<string, TypographyToken>
  readonly spacing: Record<string, string>
  readonly borderRadius: Record<string, string>
  readonly shadows: Record<string, string>
  readonly breakpoints: Record<string, string>
  readonly transitions: Record<string, string>
  readonly zIndex: Record<string, number>
}

export interface TypographyToken {
  readonly fontFamily: string
  readonly fontSize: string
  readonly fontWeight: string
  readonly lineHeight: string
  readonly letterSpacing: string
}

export type TokenOutputFormat = 'json' | 'css' | 'tailwind' | 'scss'
