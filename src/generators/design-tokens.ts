import type {
  VisualExtractionResult,
  TypographyExtractionResult,
  LayoutExtractionResult,
  ColorEntry,
  TypographyEntry,
} from '../types/extraction.js'
import type { DesignTokens, TypographyToken, TokenOutputFormat } from '../types/tokens.js'

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return [r, g, b]
}

function colorDistance(a: string, b: string): number {
  const pa = parseHex(a)
  const pb = parseHex(b)
  if (!pa || !pb) return Infinity
  return Math.sqrt(
    Math.pow(pa[0] - pb[0], 2) +
    Math.pow(pa[1] - pb[1], 2) +
    Math.pow(pa[2] - pb[2], 2),
  )
}

function clusterColors(colors: readonly ColorEntry[]): ColorEntry[] {
  const clusters: ColorEntry[][] = []

  for (const color of colors) {
    let placed = false
    for (const cluster of clusters) {
      const representative = cluster[0]
      if (colorDistance(color.hex, representative.hex) < 50) {
        cluster.push(color)
        placed = true
        break
      }
    }
    if (!placed) {
      clusters.push([color])
    }
  }

  // Pick the most-used entry from each cluster as canonical
  return clusters.map(cluster =>
    cluster.reduce((best, c) => (c.usageCount > best.usageCount ? c : best), cluster[0]),
  )
}

function buildColorTokens(colors: readonly ColorEntry[]): Record<string, string> {
  if (colors.length === 0) return {}

  const sorted = [...colors].sort((a, b) => b.usageCount - a.usageCount)
  const canonical = clusterColors(sorted).sort((a, b) => b.usageCount - a.usageCount)

  const tokens: Record<string, string> = {}
  let colorIndex = 1
  let bgAssigned = false
  let textAssigned = false

  for (const entry of canonical) {
    const isBackground = entry.properties.some(p =>
      p.includes('background') || p.includes('Background'),
    )
    const isText = entry.properties.some(p =>
      p.includes('color') && !p.includes('background') && !p.includes('Background'),
    )

    if (isBackground && !bgAssigned) {
      tokens['bg-primary'] = entry.hex
      bgAssigned = true
    } else if (isText && !textAssigned) {
      tokens['text-primary'] = entry.hex
      textAssigned = true
    } else {
      tokens[`color-${colorIndex}`] = entry.hex
      colorIndex++
    }
  }

  return tokens
}

// ---------------------------------------------------------------------------
// Typography helpers
// ---------------------------------------------------------------------------

const SIZE_NAMES: Array<{ name: string; px: number }> = [
  { name: 'text-xs', px: 12 },
  { name: 'text-sm', px: 14 },
  { name: 'text-base', px: 16 },
  { name: 'text-lg', px: 18 },
  { name: 'text-xl', px: 20 },
  { name: 'text-2xl', px: 24 },
  { name: 'text-3xl', px: 30 },
]

function closestSizeName(px: number): string {
  let best = SIZE_NAMES[0]
  let bestDist = Math.abs(px - best.px)
  for (const s of SIZE_NAMES) {
    const d = Math.abs(px - s.px)
    if (d < bestDist) {
      bestDist = d
      best = s
    }
  }
  return best.name
}

function parsePx(value: string): number | null {
  const match = /^([\d.]+)px$/.exec(value.trim())
  if (!match) return null
  return parseFloat(match[1])
}

function buildTypographyTokens(
  scale: readonly TypographyEntry[],
): Record<string, TypographyToken> {
  if (scale.length === 0) return {}

  // --- Font families ---
  const familyCount: Map<string, number> = new Map()
  for (const entry of scale) {
    const fam = entry.fontFamily.trim()
    if (fam) {
      familyCount.set(fam, (familyCount.get(fam) ?? 0) + entry.usageCount)
    }
  }

  const familiesByFreq = [...familyCount.entries()].sort((a, b) => b[1] - a[1])

  const familyTokens: Record<string, string> = {}
  let bodyAssigned = false
  let headingAssigned = false

  for (const [fam] of familiesByFreq) {
    const lower = fam.toLowerCase()
    if (lower.includes('mono') || lower.includes('courier') || lower.includes('code')) {
      if (!familyTokens['font-mono']) familyTokens['font-mono'] = fam
    } else if (!bodyAssigned) {
      familyTokens['font-body'] = fam
      bodyAssigned = true
    } else if (!headingAssigned) {
      familyTokens['font-heading'] = fam
      headingAssigned = true
    }
  }

  // --- Font sizes ---
  const sizeCount: Map<string, number> = new Map()
  for (const entry of scale) {
    const sz = entry.fontSize.trim()
    if (sz) {
      sizeCount.set(sz, (sizeCount.get(sz) ?? 0) + entry.usageCount)
    }
  }

  const sizesByFreq = [...sizeCount.entries()].sort((a, b) => {
    const pa = parsePx(a[0]) ?? 0
    const pb = parsePx(b[0]) ?? 0
    return pb - pa // descending by numeric value
  })

  const usedSizeNames = new Set<string>()
  const sizeTokens: Record<string, string> = {}
  for (const [sz] of sizesByFreq) {
    const px = parsePx(sz)
    if (px === null) continue
    let name = closestSizeName(px)
    // If name already used, append incrementing suffix
    if (usedSizeNames.has(name)) {
      let i = 2
      while (usedSizeNames.has(`${name}-${i}`)) i++
      name = `${name}-${i}`
    }
    usedSizeNames.add(name)
    sizeTokens[name] = sz
  }

  // --- Build TypographyToken records by font-family role ---
  const tokens: Record<string, TypographyToken> = {}

  // Emit family tokens as simple TypographyTokens (size/weight/etc left as defaults)
  for (const [role, fam] of Object.entries(familyTokens)) {
    tokens[role] = {
      fontFamily: fam,
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5',
      letterSpacing: '0',
    }
  }

  // Emit size tokens
  for (const [role, sz] of Object.entries(sizeTokens)) {
    // Find a representative entry for this size
    const rep = scale.find(e => e.fontSize.trim() === sz.trim()) ?? scale[0]
    tokens[role] = {
      fontFamily: rep.fontFamily,
      fontSize: sz,
      fontWeight: rep.fontWeight,
      lineHeight: rep.lineHeight,
      letterSpacing: rep.letterSpacing,
    }
  }

  return tokens
}

// ---------------------------------------------------------------------------
// Spacing helpers
// ---------------------------------------------------------------------------

function pxToRem(px: number): string {
  return `${(px / 16).toFixed(4).replace(/\.?0+$/, '')}rem`
}

function buildSpacingTokens(visual: VisualExtractionResult): Record<string, string> {
  // VisualExtractionResult has no dedicated spacing array; return empty.
  void visual
  return {}
}

// ---------------------------------------------------------------------------
// Border radius helpers
// ---------------------------------------------------------------------------

function normalizeBorderRadiusName(value: string, index: number): string {
  const trimmed = value.trim()
  if (trimmed === '0' || trimmed === '0px') return 'rounded-none'
  const px = parsePx(trimmed)
  if (px !== null) {
    if (px >= 9999) return 'rounded-full'
    if (px <= 2) return 'rounded-sm'
    if (px <= 4) return 'rounded'
    if (px <= 6) return 'rounded-md'
    if (px <= 12) return 'rounded-lg'
    return `rounded-${index + 1}`
  }
  if (trimmed === '50%') return 'rounded-full'
  return `rounded-${index + 1}`
}

function buildBorderRadiusTokens(borderRadii: readonly string[]): Record<string, string> {
  if (borderRadii.length === 0) return {}

  const unique = [...new Set(borderRadii.map(r => r.trim()).filter(r => r))]
  const sorted = unique.sort((a, b) => {
    const pa = parsePx(a) ?? 0
    const pb = parsePx(b) ?? 0
    return pa - pb
  })

  const tokens: Record<string, string> = {}
  const usedNames = new Set<string>()
  sorted.forEach((val, i) => {
    let name = normalizeBorderRadiusName(val, i)
    if (usedNames.has(name)) {
      let j = 2
      while (usedNames.has(`${name}-${j}`)) j++
      name = `${name}-${j}`
    }
    usedNames.add(name)
    tokens[name] = val
  })

  return tokens
}

// ---------------------------------------------------------------------------
// Shadow helpers
// ---------------------------------------------------------------------------

const SHADOW_NAMES = ['shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl']

function buildShadowTokens(shadows: readonly string[]): Record<string, string> {
  if (shadows.length === 0) return {}

  const unique = [...new Set(shadows.map(s => s.trim()).filter(s => s && s !== 'none'))]
  const tokens: Record<string, string> = {}
  unique.forEach((val, i) => {
    const name = i < SHADOW_NAMES.length ? SHADOW_NAMES[i] : `shadow-${i + 1}`
    tokens[name] = val
  })

  return tokens
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateDesignTokens(
  visual: VisualExtractionResult,
  typography: TypographyExtractionResult,
  layout?: LayoutExtractionResult,
): DesignTokens {
  const breakpoints: Record<string, string> = {}
  if (layout) {
    for (const bp of layout.breakpoints) {
      if (bp.minWidth !== null) {
        breakpoints[`screen-min-${bp.minWidth}`] = `${bp.minWidth}px`
      }
    }
  }

  return {
    colors: buildColorTokens(visual.colors),
    typography: buildTypographyTokens(typography.scale),
    spacing: buildSpacingTokens(visual),
    borderRadius: buildBorderRadiusTokens(visual.borderRadii),
    shadows: buildShadowTokens(visual.shadows),
    breakpoints,
    transitions: {},
    zIndex: {},
  }
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function toCssVarName(category: string, key: string): string {
  return `--${category}-${key}`.replace(/[^a-zA-Z0-9-]/g, '-')
}

function formatJson(tokens: DesignTokens): string {
  return JSON.stringify(tokens, null, 2)
}

function formatCss(tokens: DesignTokens): string {
  const lines: string[] = [':root {']

  // Strip newlines and closing-brace sequences from CSS values to prevent ruleset injection.
  const escCss = (s: string): string => s.replace(/\r?\n/g, ' ').replace(/}/g, '')

  function section(comment: string, entries: Array<[string, string]>): void {
    if (entries.length === 0) return
    lines.push(`  /* ${comment} */`)
    for (const [key, value] of entries) {
      lines.push(`  ${key}: ${escCss(value)};`)
    }
  }

  section(
    'Colors',
    Object.entries(tokens.colors).map(([k, v]) => [toCssVarName('color', k), v]),
  )

  section(
    'Typography',
    Object.entries(tokens.typography).flatMap(([k, v]) => [
      [toCssVarName('font-family', k), v.fontFamily],
      [toCssVarName('font-size', k), v.fontSize],
      [toCssVarName('font-weight', k), v.fontWeight],
      [toCssVarName('line-height', k), v.lineHeight],
      [toCssVarName('letter-spacing', k), v.letterSpacing],
    ]),
  )

  section(
    'Spacing',
    Object.entries(tokens.spacing).map(([k, v]) => [toCssVarName('spacing', k), v]),
  )

  section(
    'Border Radius',
    Object.entries(tokens.borderRadius).map(([k, v]) => [toCssVarName('radius', k), v]),
  )

  section(
    'Shadows',
    Object.entries(tokens.shadows).map(([k, v]) => [toCssVarName('shadow', k), v]),
  )

  section(
    'Breakpoints',
    Object.entries(tokens.breakpoints).map(([k, v]) => [toCssVarName('breakpoint', k), v]),
  )

  lines.push('}')
  return lines.join('\n')
}

function formatTailwind(tokens: DesignTokens): string {
  const colorEntries = Object.entries(tokens.colors)
  const spacingEntries = Object.entries(tokens.spacing)
  const borderRadiusEntries = Object.entries(tokens.borderRadius)
  const shadowEntries = Object.entries(tokens.shadows)
  const breakpointEntries = Object.entries(tokens.breakpoints)
  const fontFamilyEntries = Object.entries(tokens.typography).map(([k, v]) => [k, v.fontFamily] as [string, string])
  const fontSizeEntries = Object.entries(tokens.typography).map(([k, v]) => [k, v.fontSize] as [string, string])

  // Escape single quotes so that user-controlled values (e.g. font family names)
  // cannot break out of the string literal in the generated TypeScript config file.
  const escTs = (s: string): string => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ')

  function obj(entries: Array<[string, string]>): string {
    if (entries.length === 0) return '{}'
    const inner = entries.map(([k, v]) => `      '${escTs(k)}': '${escTs(v)}'`).join(',\n')
    return `{\n${inner}\n    }`
  }

  return [
    'export default {',
    '  theme: {',
    '    extend: {',
    `    colors: ${obj(colorEntries)},`,
    `    fontFamily: ${obj(fontFamilyEntries)},`,
    `    fontSize: ${obj(fontSizeEntries)},`,
    `    spacing: ${obj(spacingEntries)},`,
    `    borderRadius: ${obj(borderRadiusEntries)},`,
    `    boxShadow: ${obj(shadowEntries)},`,
    `    screens: ${obj(breakpointEntries)},`,
    '    },',
    '  },',
    '}',
  ].join('\n')
}

function formatScss(tokens: DesignTokens): string {
  const lines: string[] = []

  // Strip newlines and semicolons from SCSS values to prevent property injection.
  const escScss = (s: string): string => s.replace(/\r?\n/g, ' ').replace(/;/g, '')

  function section(comment: string, entries: Array<[string, string]>): void {
    if (entries.length === 0) return
    lines.push(`// ${comment}`)
    for (const [key, value] of entries) {
      const varName = `$${key}`.replace(/[^a-zA-Z0-9-_$]/g, '-')
      lines.push(`${varName}: ${escScss(value)};`)
    }
    lines.push('')
  }

  section('Colors', Object.entries(tokens.colors))
  section(
    'Typography — Font Families',
    Object.entries(tokens.typography).map(([k, v]) => [`${k}-family`, v.fontFamily]),
  )
  section(
    'Typography — Font Sizes',
    Object.entries(tokens.typography).map(([k, v]) => [`${k}-size`, v.fontSize]),
  )
  section('Spacing', Object.entries(tokens.spacing))
  section('Border Radius', Object.entries(tokens.borderRadius))
  section('Shadows', Object.entries(tokens.shadows))
  section('Breakpoints', Object.entries(tokens.breakpoints))

  return lines.join('\n').trimEnd()
}

export function formatTokens(tokens: DesignTokens, format: TokenOutputFormat): string {
  switch (format) {
    case 'json': return formatJson(tokens)
    case 'css': return formatCss(tokens)
    case 'tailwind': return formatTailwind(tokens)
    case 'scss': return formatScss(tokens)
  }
}
