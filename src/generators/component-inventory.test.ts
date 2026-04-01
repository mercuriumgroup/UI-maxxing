import { describe, it, expect } from 'vitest'
import { generateComponentInventory } from './component-inventory.js'
import type { ComponentExtractionResult } from '../types/extraction.js'
import type { DesignTokens } from '../types/tokens.js'

// ---------------------------------------------------------------------------
// Minimal mock helpers
// ---------------------------------------------------------------------------

function makeComponent(
  selector: string,
  overrides: Partial<{
    name: string
    html: string
    states: Record<string, Record<string, string>>
    dimensions: { width: string; height: string }
    children: []
    framework: string | null
  }> = {},
) {
  return {
    name: overrides.name ?? selector,
    selector,
    html: overrides.html ?? `<${selector.split(/[^a-zA-Z]/)[0] || 'div'}></div>`,
    states: overrides.states ?? {},
    dimensions: overrides.dimensions ?? { width: '100px', height: '40px' },
    children: overrides.children ?? [],
    framework: overrides.framework ?? null,
  }
}

const empty: ComponentExtractionResult = {
  components: [],
  totalElements: 0,
}

// ---------------------------------------------------------------------------
// Tests: empty
// ---------------------------------------------------------------------------

describe('generateComponentInventory — empty input', () => {
  it('handles empty component list without crashing', () => {
    const result = generateComponentInventory(empty)
    expect(result.totalComponents).toBe(0)
    expect(result.components).toHaveLength(0)
  })

  it('returns zero counts for all categories when empty', () => {
    const result = generateComponentInventory(empty)
    expect(result.categories.button).toBe(0)
    expect(result.categories.input).toBe(0)
    expect(result.categories.card).toBe(0)
    expect(result.categories.navigation).toBe(0)
    expect(result.categories.layout).toBe(0)
    expect(result.categories.typography).toBe(0)
    expect(result.categories.media).toBe(0)
    expect(result.categories.other).toBe(0)
  })

  it('handles empty input even when tokens are provided', () => {
    const tokens: DesignTokens = {
      colors: { primary: '#3b82f6' },
      typography: {},
      spacing: {},
      borderRadius: {},
      shadows: {},
      breakpoints: {},
      transitions: {},
      zIndex: {},
    }
    const result = generateComponentInventory(empty, tokens)
    expect(result.totalComponents).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Tests: categorization
// ---------------------------------------------------------------------------

describe('generateComponentInventory — categorization', () => {
  it('categorizes button tag as button', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('button.primary')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.button).toBe(1)
    expect(result.components[0].category).toBe('button')
  })

  it('categorizes element with btn class as button', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('div.btn-primary')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.button).toBe(1)
  })

  it('categorizes input tag as input', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('input.search-field')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.input).toBe(1)
    expect(result.components[0].category).toBe('input')
  })

  it('categorizes select tag as input', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('select.dropdown')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.input).toBe(1)
  })

  it('categorizes element with card class as card', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('div.card-container')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.card).toBe(1)
    expect(result.components[0].category).toBe('card')
  })

  it('categorizes nav tag as navigation', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('nav.main-nav')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.navigation).toBe(1)
    expect(result.components[0].category).toBe('navigation')
  })

  it('categorizes img tag as media', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('img.hero-image')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.media).toBe(1)
    expect(result.components[0].category).toBe('media')
  })

  it('categorizes p tag as typography', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('p.body-copy')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.typography).toBe(1)
    expect(result.components[0].category).toBe('typography')
  })

  it('categorizes h2 tag as typography', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('h2.section-title')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.typography).toBe(1)
  })

  it('categorizes div.wrapper as layout', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('div.page-wrapper')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.layout).toBe(1)
    expect(result.components[0].category).toBe('layout')
  })

  it('categorizes unknown tag as other', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('custom-element')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.categories.other).toBe(1)
    expect(result.components[0].category).toBe('other')
  })

  it('counts multiple components across categories correctly', () => {
    const input: ComponentExtractionResult = {
      components: [
        makeComponent('button.cta'),
        makeComponent('button.secondary'),
        makeComponent('input.email'),
        makeComponent('nav.top-nav'),
      ],
      totalElements: 4,
    }
    const result = generateComponentInventory(input)
    expect(result.totalComponents).toBe(4)
    expect(result.categories.button).toBe(2)
    expect(result.categories.input).toBe(1)
    expect(result.categories.navigation).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Tests: name generation
// ---------------------------------------------------------------------------

describe('generateComponentInventory — name generation', () => {
  it('strips CSS specificity symbols from selector to produce name', () => {
    const input: ComponentExtractionResult = {
      components: [makeComponent('div.my-component')],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    // '#', '.', '[', ']', ':', '>', '+', '~', spaces stripped → 'divmy-component'
    expect(result.components[0].name).toBe('divmy-component')
  })

  it('deduplicates names by appending -2, -3 etc', () => {
    const input: ComponentExtractionResult = {
      components: [
        makeComponent('button.submit'),
        makeComponent('button.submit'),
        makeComponent('button.submit'),
      ],
      totalElements: 3,
    }
    const result = generateComponentInventory(input)
    const names = result.components.map(c => c.name)
    // First occurrence keeps the name, subsequent ones get -2, -3
    expect(names[0]).toBe('buttonsubmit')
    expect(names[1]).toBe('buttonsubmit-2')
    expect(names[2]).toBe('buttonsubmit-3')
  })
})

// ---------------------------------------------------------------------------
// Tests: token mapping
// ---------------------------------------------------------------------------

describe('generateComponentInventory — token mapping', () => {
  it('returns empty tokenMappings when no tokens provided', () => {
    const input: ComponentExtractionResult = {
      components: [
        makeComponent('button.cta', {
          states: { default: { color: '#3b82f6', backgroundColor: '#ffffff' } },
        }),
      ],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    expect(result.components[0].tokenMappings).toEqual({})
  })

  it('maps hex color values to var(--color-...) when token matches', () => {
    const tokens: DesignTokens = {
      colors: { primary: '#3b82f6', white: '#ffffff' },
      typography: {},
      spacing: {},
      borderRadius: {},
      shadows: {},
      breakpoints: {},
      transitions: {},
      zIndex: {},
    }
    const input: ComponentExtractionResult = {
      components: [
        makeComponent('button.cta', {
          states: { default: { color: '#3b82f6', backgroundColor: '#ffffff' } },
        }),
      ],
      totalElements: 1,
    }
    const result = generateComponentInventory(input, tokens)
    expect(result.components[0].tokenMappings['color']).toBe('var(--color-primary)')
    expect(result.components[0].tokenMappings['backgroundColor']).toBe('var(--color-white)')
  })

  it('maps rgb() color values to var(--color-...) when token matches', () => {
    const tokens: DesignTokens = {
      colors: { accent: '#3b82f6' },
      typography: {},
      spacing: {},
      borderRadius: {},
      shadows: {},
      breakpoints: {},
      transitions: {},
      zIndex: {},
    }
    const input: ComponentExtractionResult = {
      components: [
        makeComponent('a.link', {
          states: { default: { color: 'rgb(59, 130, 246)' } },
        }),
      ],
      totalElements: 1,
    }
    const result = generateComponentInventory(input, tokens)
    expect(result.components[0].tokenMappings['color']).toBe('var(--color-accent)')
  })

  it('keeps original value when no matching token found', () => {
    const tokens: DesignTokens = {
      colors: { primary: '#ff0000' },
      typography: {},
      spacing: {},
      borderRadius: {},
      shadows: {},
      breakpoints: {},
      transitions: {},
      zIndex: {},
    }
    const input: ComponentExtractionResult = {
      components: [
        makeComponent('div.box', {
          states: { default: { backgroundColor: '#00ff00' } },
        }),
      ],
      totalElements: 1,
    }
    const result = generateComponentInventory(input, tokens)
    // #00ff00 has no matching token, so kept as-is
    expect(result.components[0].tokenMappings['backgroundColor']).toBe('#00ff00')
  })

  it('ignores non-color CSS properties for token mapping', () => {
    const tokens: DesignTokens = {
      colors: { primary: '#3b82f6' },
      typography: {},
      spacing: {},
      borderRadius: {},
      shadows: {},
      breakpoints: {},
      transitions: {},
      zIndex: {},
    }
    const input: ComponentExtractionResult = {
      components: [
        makeComponent('div.card', {
          states: { default: { padding: '16px', fontSize: '14px', color: '#3b82f6' } },
        }),
      ],
      totalElements: 1,
    }
    const result = generateComponentInventory(input, tokens)
    // Only color properties get mapped
    expect(result.components[0].tokenMappings['color']).toBe('var(--color-primary)')
    expect(result.components[0].tokenMappings['padding']).toBeUndefined()
    expect(result.components[0].tokenMappings['fontSize']).toBeUndefined()
  })

  it('maps colors across multiple states', () => {
    const tokens: DesignTokens = {
      colors: { primary: '#3b82f6', hover: '#2563eb' },
      typography: {},
      spacing: {},
      borderRadius: {},
      shadows: {},
      breakpoints: {},
      transitions: {},
      zIndex: {},
    }
    const input: ComponentExtractionResult = {
      components: [
        makeComponent('button.cta', {
          states: {
            default: { color: '#3b82f6' },
            hover: { color: '#2563eb' },
          },
        }),
      ],
      totalElements: 1,
    }
    const result = generateComponentInventory(input, tokens)
    // tokenMappings merges all states — 'color' key will be from the last state processed
    // Both are valid token colors, just verify tokenMappings has a 'color' entry
    expect(result.components[0].tokenMappings['color']).toMatch(/^var\(--color-/)
  })
})

// ---------------------------------------------------------------------------
// Tests: passthrough fields
// ---------------------------------------------------------------------------

describe('generateComponentInventory — passthrough fields', () => {
  it('preserves selector, html, states, and dimensions on each entry', () => {
    const component = makeComponent('section.hero', {
      html: '<section class="hero"><h1>Hello</h1></section>',
      states: { default: { backgroundColor: '#ffffff' } },
      dimensions: { width: '1200px', height: '600px' },
    })
    const input: ComponentExtractionResult = {
      components: [component],
      totalElements: 1,
    }
    const result = generateComponentInventory(input)
    const entry = result.components[0]
    expect(entry.selector).toBe('section.hero')
    expect(entry.html).toBe('<section class="hero"><h1>Hello</h1></section>')
    expect(entry.states).toEqual({ default: { backgroundColor: '#ffffff' } })
    expect(entry.dimensions).toEqual({ width: '1200px', height: '600px' })
  })
})
