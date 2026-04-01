function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { colors: [], error: 'Root element not found' }

  const colorProps = [
    'color', 'backgroundColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor',
  ]

  const colorMap = new Map() // hex -> { rgb, count, properties, elements }

  function rgbToHex(rgb) {
    const m = rgb.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/)
    if (!m) return null
    const r = Math.round(Number(m[1]))
    const g = Math.round(Number(m[2]))
    const b = Math.round(Number(m[3]))
    const a = m[4] !== undefined ? Number(m[4]) : 1
    if (a === 0) return null // fully transparent
    const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
    return { hex, r, g, b, a, rgb }
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const l = (max + min) / 2
    if (max === min) return `hsl(0, 0%, ${Math.round(l * 100)}%)`
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h = 0
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
  }

  function parseShadowColors(shadow) {
    if (!shadow || shadow === 'none') return []
    const colors = []
    const rgbaPattern = /rgba?\([^)]+\)/g
    let match
    while ((match = rgbaPattern.exec(shadow)) !== null) {
      colors.push(match[0])
    }
    return colors
  }

  function getSelector(el) {
    let s = el.tagName.toLowerCase()
    if (el.id) s += '#' + el.id
    else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.')
      if (cls) s += '.' + cls
    }
    return s
  }

  function addColor(rawRgb, property, el) {
    const parsed = rgbToHex(rawRgb)
    if (!parsed) return
    const existing = colorMap.get(parsed.hex)
    if (existing) {
      existing.count++
      existing.properties.add(property)
      if (existing.elements.size < 3) existing.elements.add(getSelector(el))
    } else {
      colorMap.set(parsed.hex, {
        rgb: rawRgb,
        r: parsed.r, g: parsed.g, b: parsed.b, a: parsed.a,
        count: 1,
        properties: new Set([property]),
        elements: new Set([getSelector(el)]),
      })
    }
  }

  const elements = root.querySelectorAll('*')
  for (const el of elements) {
    try {
      const cs = getComputedStyle(el)
      for (const prop of colorProps) {
        const val = cs[prop]
        if (val && val !== 'transparent' && val !== 'rgba(0, 0, 0, 0)') {
          addColor(val, prop, el)
        }
      }
      // Extract shadow colors
      for (const shadowColor of parseShadowColors(cs.boxShadow)) {
        addColor(shadowColor, 'boxShadow', el)
      }
    } catch (_) {}
  }

  const colors = Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      hex,
      rgb: data.rgb,
      hsl: rgbToHsl(data.r, data.g, data.b),
      usageCount: data.count,
      properties: Array.from(data.properties),
      sampleElements: Array.from(data.elements),
    }))
    .sort((a, b) => b.usageCount - a.usageCount)

  return { colors }
}
