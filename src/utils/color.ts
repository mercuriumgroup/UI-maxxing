export interface RgbColor {
  r: number
  g: number
  b: number
  a: number
}

export function parseRgb(rgb: string): RgbColor {
  const match = rgb.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (!match) return { r: 0, g: 0, b: 0, a: 1 }
  return {
    r: Math.round(Number(match[1])),
    g: Math.round(Number(match[2])),
    b: Math.round(Number(match[3])),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  }
}

export function rgbToHex(rgb: string): string {
  const { r, g, b, a } = parseRgb(rgb)
  const hex = `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`
  if (a < 1) {
    return hex + Math.round(a * 255).toString(16).padStart(2, '0')
  }
  return hex
}

export function rgbToHsl(rgb: string): string {
  const { r, g, b, a } = parseRgb(rgb)
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2

  if (max === min) {
    return a < 1 ? `hsla(0, 0%, ${Math.round(l * 100)}%, ${a})` : `hsl(0, 0%, ${Math.round(l * 100)}%)`
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6

  const hDeg = Math.round(h * 360)
  const sPct = Math.round(s * 100)
  const lPct = Math.round(l * 100)

  return a < 1 ? `hsla(${hDeg}, ${sPct}%, ${lPct}%, ${a})` : `hsl(${hDeg}, ${sPct}%, ${lPct}%)`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '')
  const full = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned.slice(0, 6)

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/**
 * CIE76 deltaE — perceptual color distance.
 * Accepts rgb() or hex strings.
 */
export function deltaE(color1: string, color2: string): number {
  const toLab = (rgb: RgbColor) => {
    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

    let x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
    let y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.00000
    let z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116

    return { L: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z) }
  }

  const parseColor = (c: string): RgbColor => {
    if (c.startsWith('#')) {
      const { r, g, b } = hexToRgb(c)
      return { r, g, b, a: 1 }
    }
    return parseRgb(c)
  }

  const lab1 = toLab(parseColor(color1))
  const lab2 = toLab(parseColor(color2))

  return Math.sqrt(
    Math.pow(lab2.L - lab1.L, 2) +
    Math.pow(lab2.a - lab1.a, 2) +
    Math.pow(lab2.b - lab1.b, 2)
  )
}

export function clusterColors(colors: string[], threshold: number): string[][] {
  const clusters: string[][] = []
  const assigned = new Set<number>()

  for (let i = 0; i < colors.length; i++) {
    if (assigned.has(i)) continue
    const cluster = [colors[i]]
    assigned.add(i)

    for (let j = i + 1; j < colors.length; j++) {
      if (assigned.has(j)) continue
      if (deltaE(colors[i], colors[j]) < threshold) {
        cluster.push(colors[j])
        assigned.add(j)
      }
    }
    clusters.push(cluster)
  }

  return clusters
}
