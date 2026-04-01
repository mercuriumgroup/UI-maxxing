function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { styles: [], count: 0, error: 'Root element not found' }

  const maxDepth = args?.maxDepth ?? 20
  const results = []

  function getPath(el) {
    const parts = []
    let current = el
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase()
      if (current.id) selector += '#' + current.id
      else if (current.className && typeof current.className === 'string') {
        const cls = current.className.trim().split(/\s+/).slice(0, 2).join('.')
        if (cls) selector += '.' + cls
      }
      parts.unshift(selector)
      current = current.parentElement
    }
    return parts.join(' > ')
  }

  function walk(el, depth) {
    if (depth > maxDepth) return
    try {
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()

      results.push({
        selector: {
          tag: el.tagName.toLowerCase(),
          classes: typeof el.className === 'string' ? el.className : '',
          id: el.id || '',
          depth,
          path: getPath(el),
        },
        display: cs.display,
        position: cs.position,
        width: cs.width,
        height: cs.height,
        margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '),
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
        gap: cs.gap,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        opacity: cs.opacity,
        zIndex: cs.zIndex,
        overflow: cs.overflow,
        textTransform: cs.textTransform,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      })
    } catch (_) {
      // Skip elements that can't be styled (e.g. SVG internals)
    }

    for (const child of el.children) {
      walk(child, depth + 1)
    }
  }

  walk(root, 0)
  return { styles: results, count: results.length }
}
