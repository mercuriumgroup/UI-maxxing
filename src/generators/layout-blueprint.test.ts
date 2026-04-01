import { describe, it, expect } from 'vitest'
import { generateLayoutBlueprint } from './layout-blueprint.js'
import type { LayoutExtractionResult, LayoutEntry, BreakpointEntry } from '../types/extraction.js'

function makeEntry(overrides: Partial<LayoutEntry> = {}): LayoutEntry {
  return {
    selector: '',
    display: '',
    flexDirection: '',
    flexWrap: '',
    justifyContent: '',
    alignItems: '',
    gap: '',
    gridTemplateColumns: '',
    gridTemplateRows: '',
    maxWidth: '',
    children: [],
    ...overrides,
  }
}

function makeBreakpoint(overrides: Partial<BreakpointEntry> = {}): BreakpointEntry {
  return {
    query: '',
    minWidth: null,
    maxWidth: null,
    source: '',
    ...overrides,
  }
}

describe('generateLayoutBlueprint', () => {
  it('handles empty layout', () => {
    const input: LayoutExtractionResult = {
      containers: [],
      breakpoints: [],
      rootMaxWidth: null,
    }
    const result = generateLayoutBlueprint(input)
    expect(result.tree).toHaveLength(0)
    expect(result.ascii).toBe('')
    expect(result.rootMaxWidth).toBeNull()
  })

  it('maps layout entries to nodes', () => {
    const input: LayoutExtractionResult = {
      containers: [
        makeEntry({
          selector: '.container',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '16px',
          maxWidth: '1200px',
        }),
      ],
      breakpoints: [],
      rootMaxWidth: null,
    }
    const result = generateLayoutBlueprint(input)
    expect(result.tree).toHaveLength(1)
    const node = result.tree[0]
    expect(node.selector).toBe('.container')
    expect(node.display).toBe('flex')
    expect(node.direction).toBe('row')
    expect(node.justify).toBe('center')
    expect(node.align).toBe('flex-start')
    expect(node.gap).toBe('16px')
    expect(node.maxWidth).toBe('1200px')
    expect(node.depth).toBe(0)
  })

  it('names breakpoints by minWidth', () => {
    const input: LayoutExtractionResult = {
      containers: [],
      breakpoints: [
        makeBreakpoint({ query: '(min-width: 640px)', minWidth: 640 }),
        makeBreakpoint({ query: '(min-width: 768px)', minWidth: 768 }),
        makeBreakpoint({ query: '(min-width: 1024px)', minWidth: 1024 }),
        makeBreakpoint({ query: '(min-width: 1280px)', minWidth: 1280 }),
        makeBreakpoint({ query: '(min-width: 1536px)', minWidth: 1536 }),
        makeBreakpoint({ query: '(max-width: 639px)', minWidth: 0 }),
        makeBreakpoint({ query: 'custom', minWidth: null }),
      ],
      rootMaxWidth: null,
    }
    const result = generateLayoutBlueprint(input)
    expect(result.breakpoints[0].name).toBe('sm')
    expect(result.breakpoints[1].name).toBe('md')
    expect(result.breakpoints[2].name).toBe('lg')
    expect(result.breakpoints[3].name).toBe('xl')
    expect(result.breakpoints[4].name).toBe('2xl')
    expect(result.breakpoints[5].name).toBe('xs')
    expect(result.breakpoints[6].name).toBe('custom')
  })

  it('generates ASCII art', () => {
    const child = makeEntry({ selector: '.child', display: 'block' })
    const parent = makeEntry({
      selector: '.parent',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      children: [child],
    })
    const input: LayoutExtractionResult = {
      containers: [parent],
      breakpoints: [],
      rootMaxWidth: null,
    }
    const result = generateLayoutBlueprint(input)
    expect(result.ascii).toContain('.parent')
    expect(result.ascii).toContain('.child')
    // child should be indented
    const lines = result.ascii.split('\n')
    const parentLine = lines.find(l => l.includes('.parent'))
    const childLine = lines.find(l => l.includes('.child'))
    expect(parentLine).toBeDefined()
    expect(childLine).toBeDefined()
    expect(childLine!.startsWith('  ')).toBe(true)
  })

  it('returns rootMaxWidth from first depth-0 node with a maxWidth', () => {
    const input: LayoutExtractionResult = {
      containers: [
        makeEntry({ selector: '.no-max' }),
        makeEntry({ selector: '.with-max', maxWidth: '960px' }),
      ],
      breakpoints: [],
      rootMaxWidth: null,
    }
    const result = generateLayoutBlueprint(input)
    expect(result.rootMaxWidth).toBe('960px')
  })

  it('returns null rootMaxWidth when no nodes have maxWidth', () => {
    const input: LayoutExtractionResult = {
      containers: [makeEntry({ selector: '.foo' })],
      breakpoints: [],
      rootMaxWidth: null,
    }
    const result = generateLayoutBlueprint(input)
    expect(result.rootMaxWidth).toBeNull()
  })
})
