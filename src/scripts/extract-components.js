function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { components: [], totalElements: 0, error: 'Root element not found' }

  const allElements = root.querySelectorAll('*')
  const totalElements = allElements.length
  const components = []

  function getSelector(el) {
    let s = el.tagName.toLowerCase()
    if (el.id) s += '#' + el.id
    else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.')
      if (cls) s += '.' + cls
    }
    return s
  }

  function inferName(el) {
    // Try data attributes first
    const dataComponent = el.getAttribute('data-component') || el.getAttribute('data-testid') || el.getAttribute('data-slot')
    if (dataComponent) return dataComponent

    // Try class-based naming
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/)[0]
      // Remove framework hashes
      const clean = cls.replace(/[-_][a-z0-9]{5,}$/i, '').replace(/^(svelte-|sc-|css-)/, '')
      if (clean.length > 2) return clean
    }

    // Try tag + role
    const role = el.getAttribute('role')
    if (role) return el.tagName.toLowerCase() + '-' + role

    return el.tagName.toLowerCase()
  }

  function detectFramework(el) {
    // React
    for (const key of Object.keys(el)) {
      if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) return 'react'
    }
    // Vue
    if (el.__vue__) return 'vue'
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-v-')) return 'vue'
    }
    // Angular
    for (const attr of el.attributes) {
      if (attr.name.startsWith('_ngcontent-') || attr.name === 'ng-version') return 'angular'
    }
    // Svelte
    if (el.className && typeof el.className === 'string' && /svelte-[a-z0-9]+/.test(el.className)) return 'svelte'

    return null
  }

  function getDimensions(el) {
    const cs = getComputedStyle(el)
    return { width: cs.width, height: cs.height }
  }

  // Phase 1: Detect component boundaries via framework markers
  for (const el of allElements) {
    try {
      const fw = detectFramework(el)
      const hasDataAttr = el.hasAttribute('data-component') || el.hasAttribute('data-testid') || el.hasAttribute('data-slot')

      if (fw || hasDataAttr) {
        components.push({
          name: inferName(el),
          selector: getSelector(el),
          html: el.outerHTML.slice(0, 500),
          states: {},
          dimensions: getDimensions(el),
          children: [],
          framework: fw,
        })
      }
    } catch (_) {}
  }

  // Phase 2: Heuristic — find repeated DOM patterns (same tag + class structure, 3+ occurrences)
  if (components.length === 0) {
    const patternCounts = new Map() // tag+classes -> elements[]

    for (const el of allElements) {
      try {
        if (el.children.length === 0) continue // skip leaf nodes
        const key = el.tagName + '|' + (typeof el.className === 'string' ? el.className.trim().split(/\s+/).sort().join('.') : '')
        if (!key || key.length < 5) continue

        const existing = patternCounts.get(key) || []
        existing.push(el)
        patternCounts.set(key, existing)
      } catch (_) {}
    }

    for (const [, elements] of patternCounts) {
      if (elements.length >= 3) {
        const el = elements[0]
        components.push({
          name: inferName(el),
          selector: getSelector(el),
          html: el.outerHTML.slice(0, 500),
          states: {},
          dimensions: getDimensions(el),
          children: [],
          framework: null,
        })
      }
    }
  }

  return { components, totalElements }
}
