import type { ComponentExtractionResult, ComponentEntry } from '../types/extraction.js'
import type { DesignTokens, ComponentCategory, ComponentInventoryEntry, ComponentInventory } from '../types/tokens.js'

// ---------------------------------------------------------------------------
// Color helpers (parse rgb(r, g, b) → hex for token matching)
// ---------------------------------------------------------------------------

function rgbStringToHex(rgb: string): string | null {
  const match = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(rgb.trim())
  if (!match) return null
  const r = parseInt(match[1], 10)
  const g = parseInt(match[2], 10)
  const b = parseInt(match[3], 10)
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')
}

function normalizeColorToHex(value: string): string | null {
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  const fromRgb = rgbStringToHex(trimmed)
  if (fromRgb) return fromRgb.toLowerCase()
  return null
}

// ---------------------------------------------------------------------------
// Categorization
// ---------------------------------------------------------------------------

function extractTagFromSelector(selector: string): string {
  // Take the first word-like segment (tag name) from the selector
  const match = /^([a-zA-Z][a-zA-Z0-9]*)/.exec(selector.trim())
  return match ? match[1].toLowerCase() : ''
}

function extractClassesFromSelector(selector: string): string {
  // Collect all .className parts from the selector
  const matches = selector.match(/\.([a-zA-Z0-9_-]+)/g)
  return matches ? matches.map(c => c.slice(1)).join(' ') : ''
}

function selectorContains(selector: string, term: string): boolean {
  return selector.toLowerCase().includes(term.toLowerCase())
}

function classContains(classes: string, term: string): boolean {
  return classes.toLowerCase().split(/\s+/).some(c => c.includes(term.toLowerCase()))
}

function categorize(component: ComponentEntry): ComponentCategory {
  const selector = component.selector
  const tag = extractTagFromSelector(selector)
  const classes = extractClassesFromSelector(selector)

  // button
  if (
    tag === 'button' ||
    selectorContains(selector, '[role="button"]') ||
    classContains(classes, 'btn')
  ) {
    return 'button'
  }

  // input
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'form') {
    return 'input'
  }

  // card
  if (
    classContains(classes, 'card') ||
    classContains(classes, 'panel') ||
    classContains(classes, 'tile')
  ) {
    return 'card'
  }

  // navigation
  if (
    tag === 'nav' ||
    tag === 'header' ||
    tag === 'footer' ||
    selectorContains(selector, '[role="navigation"]') ||
    classContains(classes, 'nav') ||
    classContains(classes, 'menu') ||
    classContains(classes, 'sidebar')
  ) {
    return 'navigation'
  }

  // media
  if (
    tag === 'img' ||
    tag === 'video' ||
    tag === 'svg' ||
    tag === 'picture' ||
    tag === 'figure' ||
    selectorContains(selector, '[role="img"]')
  ) {
    return 'media'
  }

  // typography
  if (
    tag === 'p' ||
    tag === 'h1' || tag === 'h2' || tag === 'h3' ||
    tag === 'h4' || tag === 'h5' || tag === 'h6' ||
    tag === 'span' ||
    tag === 'label' ||
    classContains(classes, 'text') ||
    classContains(classes, 'title') ||
    classContains(classes, 'heading')
  ) {
    return 'typography'
  }

  // layout
  if (
    tag === 'div' ||
    tag === 'section' ||
    tag === 'main' ||
    tag === 'article' ||
    tag === 'aside' ||
    selectorContains(selector, 'container') ||
    selectorContains(selector, 'wrapper') ||
    selectorContains(selector, 'layout') ||
    selectorContains(selector, 'grid') ||
    selectorContains(selector, 'flex')
  ) {
    return 'layout'
  }

  return 'other'
}

// ---------------------------------------------------------------------------
// Name generation
// ---------------------------------------------------------------------------

function selectorToName(selector: string): string {
  // Strip CSS specificity symbols
  const stripped = selector.replace(/[#.\[\]:>+~\s]/g, '')
  if (stripped.length > 0) return stripped
  // Fallback to tag name
  return extractTagFromSelector(selector) || 'component'
}

function deduplicateNames(names: string[]): string[] {
  const counts = new Map<string, number>()
  const seen = new Map<string, number>()
  const result: string[] = []

  // Count occurrences first
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  for (const name of names) {
    if ((counts.get(name) ?? 0) > 1) {
      const index = (seen.get(name) ?? 0) + 1
      seen.set(name, index)
      result.push(index === 1 ? name : `${name}-${index}`)
    } else {
      result.push(name)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Token mapping
// ---------------------------------------------------------------------------

function buildTokenMappings(
  component: ComponentEntry,
  tokens: DesignTokens | undefined,
): Record<string, string> {
  if (!tokens) return {}

  // Collect all CSS property values from all states.
  // Use Object.create(null) to prevent prototype pollution from user-controlled CSS property keys.
  const allProps = Object.create(null) as Record<string, string>
  for (const stateStyles of Object.values(component.states)) {
    for (const [prop, value] of Object.entries(stateStyles)) {
      if (Object.prototype.hasOwnProperty.call(Object.prototype, prop)) continue
      allProps[prop] = value
    }
  }

  if (Object.keys(allProps).length === 0) return {}

  // Build a lookup: hex → token name for all color tokens
  const hexToTokenName = new Map<string, string>()
  for (const [tokenName, tokenValue] of Object.entries(tokens.colors)) {
    const hex = normalizeColorToHex(tokenValue)
    if (hex) hexToTokenName.set(hex, tokenName)
  }

  const mappings = Object.create(null) as Record<string, string>
  for (const [prop, value] of Object.entries(allProps)) {
    const hex = normalizeColorToHex(value)
    if (hex) {
      const tokenName = hexToTokenName.get(hex)
      if (tokenName) {
        mappings[prop] = `var(--color-${tokenName})`
      } else {
        mappings[prop] = value
      }
    }
  }

  return mappings
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateComponentInventory(
  components: ComponentExtractionResult,
  tokens?: DesignTokens,
): ComponentInventory {
  const entries = components.components

  if (entries.length === 0) {
    const emptyCategories: Record<ComponentCategory, number> = {
      button: 0, input: 0, card: 0, navigation: 0,
      layout: 0, typography: 0, media: 0, other: 0,
    }
    return {
      components: [],
      categories: emptyCategories,
      totalComponents: 0,
    }
  }

  // Generate raw names before dedup
  const rawNames = entries.map(c => selectorToName(c.selector))
  const deduped = deduplicateNames(rawNames)

  const inventoryEntries: ComponentInventoryEntry[] = entries.map((component, i) => ({
    name: deduped[i],
    category: categorize(component),
    selector: component.selector,
    html: component.html,
    tokenMappings: buildTokenMappings(component, tokens),
    states: component.states,
    dimensions: component.dimensions,
  }))

  const categoryCounts: Record<ComponentCategory, number> = {
    button: 0, input: 0, card: 0, navigation: 0,
    layout: 0, typography: 0, media: 0, other: 0,
  }
  for (const entry of inventoryEntries) {
    categoryCounts[entry.category]++
  }

  return {
    components: inventoryEntries,
    categories: categoryCounts,
    totalComponents: inventoryEntries.length,
  }
}
