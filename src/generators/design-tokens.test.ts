import { describe, it, expect } from 'vitest'
import { generateDesignTokens, formatTokens } from './design-tokens.js'
import type { VisualExtractionResult, TypographyExtractionResult } from '../types/extraction.js'

// ---------------------------------------------------------------------------
// Minimal mock data matching the actual type shapes
// ---------------------------------------------------------------------------

const emptyVisual: VisualExtractionResult = {
  styles: [],
  colors: [],
  shadows: [],
  borderRadii: [],
}

const emptyTypography: TypographyExtractionResult = {
  scale: [],
  fontFaces: [],
  fontLoadStrategy: null,
}

const visualWithData: VisualExtractionResult = {
  styles: [],
  colors: [
    {
      hex: '#ffffff',
      rgb: 'rgb(255,255,255)',
      hsl: 'hsl(0,0%,100%)',
      usageCount: 10,
      properties: ['backgroundColor'],
      sampleElements: [],
    },
    {
      hex: '#111111',
      rgb: 'rgb(17,17,17)',
      hsl: 'hsl(0,0%,7%)',
      usageCount: 8,
      properties: ['color'],
      sampleElements: [],
    },
    {
      hex: '#3b82f6',
      rgb: 'rgb(59,130,246)',
      hsl: 'hsl(217,91%,60%)',
      usageCount: 5,
      properties: ['color'],
      sampleElements: [],
    },
  ],
  shadows: [
    '0 1px 3px rgba(0,0,0,0.12)',
    '0 4px 6px rgba(0,0,0,0.1)',
  ],
  borderRadii: ['0px', '4px', '8px', '9999px'],
}

const typographyWithData: TypographyExtractionResult = {
  scale: [
    {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5',
      letterSpacing: '0',
      textTransform: 'none',
      sampleText: 'Body text',
      usageCount: 20,
    },
    {
      fontFamily: 'Inter, sans-serif',
      fontSize: '24px',
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      textTransform: 'none',
      sampleText: 'Heading',
      usageCount: 10,
    },
    {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.6',
      letterSpacing: '0',
      textTransform: 'none',
      sampleText: 'code()',
      usageCount: 3,
    },
  ],
  fontFaces: [],
  fontLoadStrategy: null,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateDesignTokens', () => {
  it('returns an object with color and typography fields when given empty data', () => {
    const tokens = generateDesignTokens(emptyVisual, emptyTypography)
    expect(tokens).toBeDefined()
    expect(tokens.colors).toBeDefined()
    expect(tokens.typography).toBeDefined()
    expect(tokens.spacing).toBeDefined()
    expect(tokens.borderRadius).toBeDefined()
    expect(tokens.shadows).toBeDefined()
    expect(tokens.breakpoints).toBeDefined()
    expect(tokens.transitions).toBeDefined()
    expect(tokens.zIndex).toBeDefined()
  })

  it('does not crash on empty data and returns empty records', () => {
    const tokens = generateDesignTokens(emptyVisual, emptyTypography)
    expect(Object.keys(tokens.colors)).toHaveLength(0)
    expect(Object.keys(tokens.typography)).toHaveLength(0)
    expect(Object.keys(tokens.spacing)).toHaveLength(0)
  })

  it('extracts color tokens from visual data', () => {
    const tokens = generateDesignTokens(visualWithData, emptyTypography)
    expect(Object.keys(tokens.colors).length).toBeGreaterThan(0)
    // bg-primary should map to the background color
    expect(tokens.colors['bg-primary']).toBe('#ffffff')
    // text-primary should map to the text color
    expect(tokens.colors['text-primary']).toBe('#111111')
  })

  it('clusters very similar colors into one token', () => {
    const nearlyIdentical: VisualExtractionResult = {
      ...emptyVisual,
      colors: [
        {
          hex: '#ff0000',
          rgb: 'rgb(255,0,0)',
          hsl: 'hsl(0,100%,50%)',
          usageCount: 5,
          properties: ['color'],
          sampleElements: [],
        },
        {
          hex: '#fe0101',
          rgb: 'rgb(254,1,1)',
          hsl: 'hsl(0,100%,50%)',
          usageCount: 3,
          properties: ['color'],
          sampleElements: [],
        },
      ],
    }
    const tokens = generateDesignTokens(nearlyIdentical, emptyTypography)
    // Both are within distance 50, so should collapse to 1 token
    expect(Object.keys(tokens.colors)).toHaveLength(1)
  })

  it('extracts typography tokens from scale data', () => {
    const tokens = generateDesignTokens(emptyVisual, typographyWithData)
    expect(Object.keys(tokens.typography).length).toBeGreaterThan(0)
  })

  it('assigns font-body, font-heading, font-mono roles', () => {
    const tokens = generateDesignTokens(emptyVisual, typographyWithData)
    expect(tokens.typography['font-body']).toBeDefined()
    expect(tokens.typography['font-body'].fontFamily).toContain('Inter')
    expect(tokens.typography['font-mono']).toBeDefined()
    expect(tokens.typography['font-mono'].fontFamily).toContain('Mono')
  })

  it('extracts border radius tokens', () => {
    const tokens = generateDesignTokens(visualWithData, emptyTypography)
    expect(tokens.borderRadius['rounded-none']).toBe('0px')
    expect(tokens.borderRadius['rounded-full']).toBe('9999px')
  })

  it('extracts shadow tokens', () => {
    const tokens = generateDesignTokens(visualWithData, emptyTypography)
    expect(Object.keys(tokens.shadows).length).toBe(2)
    expect(tokens.shadows['shadow-sm']).toBeDefined()
    expect(tokens.shadows['shadow']).toBeDefined()
  })

  it('includes breakpoints from LayoutExtractionResult when provided', () => {
    const layout = {
      containers: [],
      breakpoints: [
        { query: '@media (min-width: 768px)', minWidth: 768, maxWidth: null, source: 'media' },
      ],
      rootMaxWidth: null,
    }
    const tokens = generateDesignTokens(emptyVisual, emptyTypography, layout)
    expect(tokens.breakpoints['screen-min-768']).toBe('768px')
  })

  it('deduplicates font size token names with numeric suffix when sizes share a bucket', () => {
    // 11px and 12px are both closest to 'text-xs' (px=12) — distance 1 each
    // The dedup loop should append -2 for the second
    const typography: TypographyExtractionResult = {
      scale: [
        {
          fontFamily: 'Arial',
          fontSize: '12px',
          fontWeight: '400',
          lineHeight: '1.5',
          letterSpacing: '0',
          textTransform: 'none',
          sampleText: '',
          usageCount: 5,
        },
        {
          fontFamily: 'Arial',
          fontSize: '11px',
          fontWeight: '400',
          lineHeight: '1.5',
          letterSpacing: '0',
          textTransform: 'none',
          sampleText: '',
          usageCount: 3,
        },
      ],
      fontFaces: [],
      fontLoadStrategy: null,
    }
    const tokens = generateDesignTokens(emptyVisual, typography)
    const sizeNames = Object.keys(tokens.typography).filter(k => !k.startsWith('font-'))
    // All names must be unique
    expect(new Set(sizeNames).size).toBe(sizeNames.length)
    // At least one name must end in a numeric suffix
    expect(sizeNames.some(n => /\-\d+$/.test(n))).toBe(true)
  })

  it('names border radius 0px as rounded-none', () => {
    const visual = { ...emptyVisual, borderRadii: ['0px'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded-none']).toBe('0px')
  })

  it('names border radius 0 (no unit) as rounded-none', () => {
    const visual = { ...emptyVisual, borderRadii: ['0'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded-none']).toBe('0')
  })

  it('names border radius 2px as rounded-sm', () => {
    const visual = { ...emptyVisual, borderRadii: ['2px'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded-sm']).toBe('2px')
  })

  it('names border radius 4px as rounded (≤4, >2)', () => {
    const visual = { ...emptyVisual, borderRadii: ['4px'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded']).toBe('4px')
  })

  it('names border radius 6px as rounded-md (≤6, >4)', () => {
    const visual = { ...emptyVisual, borderRadii: ['6px'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded-md']).toBe('6px')
  })

  it('names border radius 12px as rounded-lg (≤12, >6)', () => {
    const visual = { ...emptyVisual, borderRadii: ['12px'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded-lg']).toBe('12px')
  })

  it('names border radius 9999px as rounded-full', () => {
    const visual = { ...emptyVisual, borderRadii: ['9999px'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded-full']).toBe('9999px')
  })

  it('names border radius 50% as rounded-full', () => {
    const visual = { ...emptyVisual, borderRadii: ['50%'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded-full']).toBe('50%')
  })

  it('names border radius 13px with fallback rounded-1 (>12)', () => {
    const visual = { ...emptyVisual, borderRadii: ['13px'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(tokens.borderRadius['rounded-1']).toBe('13px')
  })

  it('deduplicates colliding border radius names', () => {
    // 9999px and 50% both map to rounded-full → second becomes rounded-full-2
    const visual = { ...emptyVisual, borderRadii: ['9999px', '50%'] }
    const tokens = generateDesignTokens(visual, emptyTypography)
    const names = Object.keys(tokens.borderRadius)
    expect(names).toContain('rounded-full')
    expect(names).toContain('rounded-full-2')
  })

  it('spacing tokens return empty object (not yet implemented)', () => {
    const tokens = generateDesignTokens(visualWithData, emptyTypography)
    expect(tokens.spacing).toEqual({})
  })

  it('shadow count exceeding SHADOW_NAMES length falls back to shadow-N', () => {
    // SHADOW_NAMES has 5 entries; provide 6 unique shadows
    const visual: VisualExtractionResult = {
      ...emptyVisual,
      shadows: [
        '0 1px 2px rgba(0,0,0,0.1)',
        '0 2px 4px rgba(0,0,0,0.1)',
        '0 4px 8px rgba(0,0,0,0.1)',
        '0 8px 16px rgba(0,0,0,0.1)',
        '0 16px 32px rgba(0,0,0,0.1)',
        '0 24px 48px rgba(0,0,0,0.1)',
      ],
    }
    const tokens = generateDesignTokens(visual, emptyTypography)
    expect(Object.keys(tokens.shadows)).toHaveLength(6)
    expect(tokens.shadows['shadow-6']).toBeDefined()
  })
})

describe('formatTokens', () => {
  const tokens = generateDesignTokens(visualWithData, typographyWithData)

  it('json format returns valid JSON', () => {
    const output = formatTokens(tokens, 'json')
    expect(() => JSON.parse(output)).not.toThrow()
    const parsed = JSON.parse(output) as Record<string, unknown>
    expect(parsed.colors).toBeDefined()
    expect(parsed.typography).toBeDefined()
  })

  it('css format contains :root {', () => {
    const output = formatTokens(tokens, 'css')
    expect(output).toContain(':root {')
    expect(output).toContain('}')
  })

  it('css format contains CSS custom properties', () => {
    const output = formatTokens(tokens, 'css')
    expect(output).toContain('--')
    expect(output).toContain(':')
  })

  it('tailwind format contains export default', () => {
    const output = formatTokens(tokens, 'tailwind')
    expect(output).toContain('export default')
    expect(output).toContain('theme')
    expect(output).toContain('extend')
  })

  it('scss format contains SCSS variables prefixed with $', () => {
    const output = formatTokens(tokens, 'scss')
    expect(output).toContain('$')
    expect(output).toContain(';')
  })

  it('json format on empty tokens still returns valid JSON', () => {
    const emptyTokens = generateDesignTokens(emptyVisual, emptyTypography)
    const output = formatTokens(emptyTokens, 'json')
    expect(() => JSON.parse(output)).not.toThrow()
  })

  it('css format on empty tokens still returns :root block', () => {
    const emptyTokens = generateDesignTokens(emptyVisual, emptyTypography)
    const output = formatTokens(emptyTokens, 'css')
    expect(output).toContain(':root {')
    expect(output).toContain('}')
  })

  it('tailwind format on empty tokens still contains export default', () => {
    const emptyTokens = generateDesignTokens(emptyVisual, emptyTypography)
    const output = formatTokens(emptyTokens, 'tailwind')
    expect(output).toContain('export default')
  })

  it('css format: every non-comment declaration line starts with --', () => {
    const output = formatTokens(tokens, 'css')
    const varLines = output
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith(':') && !l.startsWith('}') && !l.startsWith('/*'))
    for (const line of varLines) {
      expect(line.startsWith('--')).toBe(true)
    }
  })

  it('scss format: every variable declaration line starts with $', () => {
    const output = formatTokens(tokens, 'scss')
    const varLines = output
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('//'))
    for (const line of varLines) {
      expect(line.startsWith('$')).toBe(true)
    }
  })

  it('scss format: values containing semicolons are sanitized', () => {
    // A token value with an embedded semicolon should not produce injection
    const injectionVisual: VisualExtractionResult = {
      ...emptyVisual,
      shadows: ['0 1px 2px red; color: evil'],
    }
    const badTokens = generateDesignTokens(injectionVisual, emptyTypography)
    const output = formatTokens(badTokens, 'scss')
    const lines = output.split('\n').filter(l => l.includes('shadow'))
    for (const line of lines) {
      // Should have exactly one semicolon — the terminal one added by formatScss
      expect(line.split(';').length - 1).toBe(1)
    }
  })
})
