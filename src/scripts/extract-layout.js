function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { containers: [], breakpoints: [], rootMaxWidth: null, error: 'Root element not found' }

  function getSelector(el) {
    let s = el.tagName.toLowerCase()
    if (el.id) s += '#' + el.id
    else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.')
      if (cls) s += '.' + cls
    }
    return s
  }

  function buildLayoutTree(el, depth) {
    if (depth > 15) return null
    try {
      const cs = getComputedStyle(el)
      const display = cs.display

      const isFlex = display.includes('flex')
      const isGrid = display.includes('grid')

      if (!isFlex && !isGrid) return null

      const entry = {
        selector: getSelector(el),
        display,
        flexDirection: isFlex ? cs.flexDirection : '',
        flexWrap: isFlex ? cs.flexWrap : '',
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        gap: cs.gap,
        gridTemplateColumns: isGrid ? cs.gridTemplateColumns : '',
        gridTemplateRows: isGrid ? cs.gridTemplateRows : '',
        maxWidth: cs.maxWidth,
        children: [],
      }

      for (const child of el.children) {
        const childEntry = buildLayoutTree(child, depth + 1)
        if (childEntry) entry.children.push(childEntry)
      }

      return entry
    } catch (_) {
      return null
    }
  }

  // Build layout tree from root
  const containers = []
  for (const child of root.children) {
    const tree = buildLayoutTree(child, 0)
    if (tree) containers.push(tree)
  }

  // If root itself is a layout container, include it
  try {
    const rootCs = getComputedStyle(root)
    if (rootCs.display.includes('flex') || rootCs.display.includes('grid')) {
      const rootTree = buildLayoutTree(root, 0)
      if (rootTree) containers.unshift(rootTree)
    }
  } catch (_) {}

  // Find max-width containers (common page wrappers)
  let rootMaxWidth = null
  const allElements = root.querySelectorAll('*')
  for (const el of allElements) {
    try {
      const cs = getComputedStyle(el)
      const mw = parseFloat(cs.maxWidth)
      if (mw >= 500 && mw <= 2000) {
        const ml = cs.marginLeft, mr = cs.marginRight
        if (ml === mr || (ml === '0px' && mr === '0px') || ml === 'auto') {
          rootMaxWidth = cs.maxWidth
          break
        }
      }
    } catch (_) {}
  }

  // Extract media queries from stylesheets
  const breakpoints = []
  const seen = new Set()
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSMediaRule) {
          const query = rule.conditionText || rule.media.mediaText
          if (seen.has(query)) continue
          seen.add(query)

          let minWidth = null, maxWidth = null
          const minMatch = query.match(/min-width:\s*([\d.]+)px/)
          const maxMatch = query.match(/max-width:\s*([\d.]+)px/)
          if (minMatch) minWidth = Number(minMatch[1])
          if (maxMatch) maxWidth = Number(maxMatch[1])

          if (minWidth !== null || maxWidth !== null) {
            breakpoints.push({
              query,
              minWidth,
              maxWidth,
              source: sheet.href || 'inline',
            })
          }
        }
      }
    } catch (_) {
      // Cross-origin stylesheet
    }
  }

  breakpoints.sort((a, b) => (a.minWidth || 0) - (b.minWidth || 0))

  return { containers, breakpoints, rootMaxWidth }
}
