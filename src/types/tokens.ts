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

export type ComponentCategory =
  | 'button' | 'input' | 'card' | 'navigation'
  | 'layout' | 'typography' | 'media' | 'other'

export interface ComponentInventoryEntry {
  readonly name: string
  readonly category: ComponentCategory
  readonly selector: string
  readonly html: string
  readonly tokenMappings: Record<string, string>
  readonly states: Record<string, Record<string, string>>
  readonly dimensions: { readonly width: string; readonly height: string }
}

export interface ComponentInventory {
  readonly components: readonly ComponentInventoryEntry[]
  readonly categories: Record<ComponentCategory, number>
  readonly totalComponents: number
}

export interface LayoutNode {
  readonly selector: string
  readonly display: string
  readonly direction: string
  readonly justify: string
  readonly align: string
  readonly gap: string
  readonly gridColumns: string
  readonly gridRows: string
  readonly maxWidth: string
  readonly children: readonly LayoutNode[]
  readonly depth: number
}

export interface BreakpointSummary {
  readonly name: string
  readonly minWidth: number | null
  readonly maxWidth: number | null
  readonly query: string
}

export interface LayoutBlueprint {
  readonly tree: readonly LayoutNode[]
  readonly breakpoints: readonly BreakpointSummary[]
  readonly rootMaxWidth: string | null
  readonly ascii: string
}
