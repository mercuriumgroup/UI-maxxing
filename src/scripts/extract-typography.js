function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { scale: [], fontFaces: [], fontLoadStrategy: null, error: 'Root element not found' }

  // Extract unique typography combinations
  const typoMap = new Map() // compound key -> { entry, count }

  const elements = root.querySelectorAll('*')
  for (const el of elements) {
    try {
      // Only process elements that contain direct text
      const hasText = Array.from(el.childNodes).some(
        n => n.nodeType === 3 && n.textContent.trim().length > 0
      )
      if (!hasText) continue

      const cs = getComputedStyle(el)
      const entry = {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
      }

      const key = [entry.fontFamily, entry.fontSize, entry.fontWeight, entry.lineHeight, entry.letterSpacing, entry.textTransform].join('|')
      const existing = typoMap.get(key)
      if (existing) {
        existing.count++
      } else {
        const sampleText = el.textContent.trim().slice(0, 60)
        typoMap.set(key, { entry: { ...entry, sampleText }, count: 1 })
      }
    } catch (_) {}
  }

  const scale = Array.from(typoMap.values())
    .map(({ entry, count }) => ({ ...entry, usageCount: count }))
    .sort((a, b) => b.usageCount - a.usageCount)

  // Extract @font-face rules from stylesheets
  const fontFaces = []
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSFontFaceRule) {
          fontFaces.push({
            family: rule.style.getPropertyValue('font-family').replace(/["']/g, ''),
            weight: rule.style.getPropertyValue('font-weight') || 'normal',
            style: rule.style.getPropertyValue('font-style') || 'normal',
            src: rule.style.getPropertyValue('src') || '',
            format: (rule.style.getPropertyValue('src').match(/format\(['"]?(\w+)['"]?\)/) || [])[1] || '',
            display: rule.style.getPropertyValue('font-display') || '',
            unicodeRange: rule.style.getPropertyValue('unicode-range') || '',
          })
        }
      }
    } catch (_) {
      // Cross-origin stylesheet — skip
    }
  }

  // Detect font-display strategy
  let fontLoadStrategy = null
  const displays = fontFaces.map(f => f.display).filter(Boolean)
  if (displays.length > 0) {
    const counts = {}
    for (const d of displays) counts[d] = (counts[d] || 0) + 1
    fontLoadStrategy = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  return { scale, fontFaces, fontLoadStrategy }
}
