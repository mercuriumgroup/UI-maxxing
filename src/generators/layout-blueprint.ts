import type { LayoutExtractionResult, LayoutEntry, BreakpointEntry } from '../types/extraction.js'
import type { LayoutBlueprint, LayoutNode, BreakpointSummary } from '../types/tokens.js'

function nameBreakpoint(entry: BreakpointEntry): string {
  if (entry.minWidth === null) return entry.query
  if (entry.minWidth >= 1536) return '2xl'
  if (entry.minWidth >= 1280) return 'xl'
  if (entry.minWidth >= 1024) return 'lg'
  if (entry.minWidth >= 768) return 'md'
  if (entry.minWidth >= 640) return 'sm'
  return 'xs'
}

function entryToNode(entry: LayoutEntry, depth: number): LayoutNode {
  if (depth > 10) {
    return {
      selector: entry.selector,
      display: entry.display,
      direction: entry.flexDirection,
      justify: entry.justifyContent,
      align: entry.alignItems,
      gap: entry.gap,
      gridColumns: entry.gridTemplateColumns,
      gridRows: entry.gridTemplateRows,
      maxWidth: entry.maxWidth,
      children: [],
      depth,
    }
  }
  return {
    selector: entry.selector,
    display: entry.display,
    direction: entry.flexDirection,
    justify: entry.justifyContent,
    align: entry.alignItems,
    gap: entry.gap,
    gridColumns: entry.gridTemplateColumns,
    gridRows: entry.gridTemplateRows,
    maxWidth: entry.maxWidth,
    children: entry.children.map(child => entryToNode(child, depth + 1)),
    depth,
  }
}

function renderAscii(nodes: readonly LayoutNode[], indent = 0): string {
  if (indent > 10) return ''
  return nodes.map(node => {
    const prefix = '  '.repeat(indent)
    const label = node.selector || 'element'
    const props: string[] = []
    if (node.display) props.push(node.display)
    if (node.direction) props.push(node.direction)
    if (node.gap) props.push(`gap: ${node.gap}`)
    if (node.gridColumns) props.push(`cols: ${node.gridColumns}`)
    if (node.maxWidth) props.push(`max-w: ${node.maxWidth}`)
    const propsStr = props.length > 0 ? ` [${props.join(', ')}]` : ''
    const childLines = renderAscii(node.children, indent + 1)
    return `${prefix}${label}${propsStr}${childLines ? '\n' + childLines : ''}`
  }).join('\n')
}

export function generateLayoutBlueprint(layout: LayoutExtractionResult): LayoutBlueprint {
  const tree = layout.containers.map(entry => entryToNode(entry, 0))

  const breakpoints: readonly BreakpointSummary[] = layout.breakpoints.map(entry => ({
    name: nameBreakpoint(entry),
    minWidth: entry.minWidth,
    maxWidth: entry.maxWidth,
    query: entry.query,
  }))

  const rootMaxWidth = (() => {
    for (const node of tree) {
      if (node.maxWidth) return node.maxWidth
    }
    return null
  })()

  const ascii = renderAscii(tree)

  return { tree, breakpoints, rootMaxWidth, ascii }
}
