export interface ValueCount {
  value: string
  count: number
}

export function deduplicateValues(values: string[]): ValueCount[] {
  const counts = new Map<string, number>()

  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

export interface ScaleDetection {
  base: number
  multipliers: number[]
}

export function detectScale(values: number[]): ScaleDetection | null {
  if (values.length < 3) return null

  const sorted = [...new Set(values)].sort((a, b) => a - b).filter(v => v > 0)
  if (sorted.length < 3) return null

  // Try common bases: 2, 4, 8
  for (const base of [4, 8, 2]) {
    const multipliers = sorted.map(v => v / base)
    const allIntegers = multipliers.every(m => Math.abs(m - Math.round(m)) < 0.01)

    if (allIntegers) {
      return { base, multipliers: multipliers.map(m => Math.round(m)) }
    }
  }

  // Try using the smallest value as base
  const base = sorted[0]
  const multipliers = sorted.map(v => v / base)
  const allClean = multipliers.every(m => Math.abs(m - Math.round(m * 2) / 2) < 0.01)

  if (allClean) {
    return { base, multipliers: multipliers.map(m => Math.round(m * 2) / 2) }
  }

  return null
}

export function suggestTokenName(value: string, scale: string[]): string {
  const index = scale.indexOf(value)
  if (index === -1) return value

  // Use t-shirt sizing for small scales, numeric for larger
  if (scale.length <= 7) {
    const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
    return names[index] || `${index + 1}`
  }

  return `${index + 1}`
}
