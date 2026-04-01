export interface BoxShadowPart {
  color: string
  offsetX: string
  offsetY: string
  blur: string
  spread: string
}

export interface MarginPaddingPart {
  top: string
  right: string
  bottom: string
  left: string
}

export interface FontShorthandPart {
  family: string
  size: string
  weight: string
  lineHeight: string
}

export interface TransitionPart {
  property: string
  duration: string
  timingFunction: string
  delay: string
}

export function parseBoxShadow(value: string): BoxShadowPart[] {
  if (!value || value === 'none') return []

  const shadows: BoxShadowPart[] = []
  // Split on commas that are not inside parentheses
  const parts = value.split(/,(?![^(]*\))/).map(s => s.trim())

  for (const part of parts) {
    const colorMatch = part.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[\da-fA-F]{3,8}|\b\w+\b)$/i)
      || part.match(/^(rgba?\([^)]+\)|hsla?\([^)]+\)|#[\da-fA-F]{3,8}|\b[a-z]+\b)/i)
    const color = colorMatch ? colorMatch[1] : ''

    const withoutColor = part.replace(color, '').trim()
    const values = withoutColor.split(/\s+/).filter(Boolean)

    shadows.push({
      offsetX: values[0] || '0',
      offsetY: values[1] || '0',
      blur: values[2] || '0',
      spread: values[3] || '0',
      color,
    })
  }

  return shadows
}

export function parseMarginPadding(value: string): MarginPaddingPart {
  const parts = value.split(/\s+/).filter(Boolean)

  switch (parts.length) {
    case 1: return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] }
    case 2: return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }
    case 3: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] }
    case 4: return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
    default: return { top: '0', right: '0', bottom: '0', left: '0' }
  }
}

export function parseFontShorthand(value: string): FontShorthandPart {
  // CSS font shorthand: [style] [variant] [weight] size[/lineHeight] family
  const parts = value.split(/\s+/)
  const result: FontShorthandPart = { family: '', size: '', weight: '400', lineHeight: 'normal' }

  // Find the size (contains digits + unit), everything after is family
  for (let i = 0; i < parts.length; i++) {
    const sizeMatch = parts[i].match(/^([\d.]+(?:px|rem|em|pt|%))(?:\/([\d.]+(?:px|rem|em|%|[\d.]+)?))?$/)
    if (sizeMatch) {
      result.size = sizeMatch[1]
      if (sizeMatch[2]) result.lineHeight = sizeMatch[2]
      result.family = parts.slice(i + 1).join(' ').replace(/["']/g, '')

      // Everything before size is weight/style/variant
      for (let j = 0; j < i; j++) {
        const w = parts[j]
        if (/^\d{3}$/.test(w) || ['bold', 'bolder', 'lighter', 'normal'].includes(w)) {
          result.weight = w
        }
      }
      break
    }
  }

  return result
}

export function parseTransition(value: string): TransitionPart[] {
  if (!value || value === 'none') return []

  return value.split(/,(?![^(]*\))/).map(part => {
    const tokens = part.trim().split(/\s+/)
    return {
      property: tokens[0] || 'all',
      duration: tokens[1] || '0s',
      timingFunction: tokens[2] || 'ease',
      delay: tokens[3] || '0s',
    }
  })
}

export function extractNumericValue(value: string): number | null {
  const match = value.match(/^(-?[\d.]+)/)
  if (!match) return null
  const num = parseFloat(match[1])
  return isNaN(num) ? null : num
}
