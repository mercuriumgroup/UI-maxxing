function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { interactions: [], scrollBehaviors: [], forms: [], error: 'Root element not found' }

  const interactions = []
  const scrollBehaviors = []
  const forms = []

  function getSelector(el) {
    let s = el.tagName.toLowerCase()
    if (el.id) s += '#' + el.id
    else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.')
      if (cls) s += '.' + cls
    }
    return s
  }

  const allElements = root.querySelectorAll('*')
  for (const el of allElements) {
    try {
      const cs = getComputedStyle(el)
      const selector = getSelector(el)

      // Sticky/fixed elements
      if (cs.position === 'sticky' || cs.position === 'fixed') {
        scrollBehaviors.push({
          selector,
          events: [],
          scrollBehavior: null,
          position: cs.position,
          formValidation: null,
        })
      }

      // Scroll containers
      const overflow = cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY
      if (overflow.includes('auto') || overflow.includes('scroll')) {
        const snapType = cs.scrollSnapType || 'none'
        scrollBehaviors.push({
          selector,
          events: [],
          scrollBehavior: snapType !== 'none' ? 'snap: ' + snapType : 'scroll',
          position: null,
          formValidation: null,
        })
      }

      // Scroll snap containers
      if (cs.scrollSnapType && cs.scrollSnapType !== 'none') {
        scrollBehaviors.push({
          selector,
          events: [],
          scrollBehavior: 'snap: ' + cs.scrollSnapType,
          position: null,
          formValidation: null,
        })
      }
    } catch (_) {}
  }

  // Check for smooth scrolling on html/body
  try {
    const htmlCs = getComputedStyle(document.documentElement)
    const bodyCs = getComputedStyle(document.body)
    if (htmlCs.scrollBehavior === 'smooth' || bodyCs.scrollBehavior === 'smooth') {
      scrollBehaviors.push({
        selector: htmlCs.scrollBehavior === 'smooth' ? 'html' : 'body',
        events: [],
        scrollBehavior: 'smooth',
        position: null,
        formValidation: null,
      })
    }
  } catch (_) {}

  // Form elements with validation
  const formElements = root.querySelectorAll('input, select, textarea')
  for (const el of formElements) {
    try {
      const selector = getSelector(el)
      const hasValidation = el.required || el.pattern || el.minLength > -1 || el.maxLength > -1 || el.min || el.max

      if (hasValidation) {
        forms.push({
          selector,
          events: [],
          scrollBehavior: null,
          position: null,
          formValidation: {
            type: el.type || 'text',
            required: el.required || false,
            pattern: el.pattern || null,
            minLength: el.minLength > -1 ? el.minLength : null,
            maxLength: el.maxLength > -1 ? el.maxLength : null,
            min: el.min || null,
            max: el.max || null,
          },
        })
      }
    } catch (_) {}
  }

  // Interactive elements (links, buttons, etc.)
  const interactiveSelectors = 'a[href], button, [role="button"], [tabindex], details, dialog, [contenteditable]'
  const interactiveElements = root.querySelectorAll(interactiveSelectors)
  for (const el of interactiveElements) {
    try {
      interactions.push({
        selector: getSelector(el),
        events: [], // CDP will fill these
        scrollBehavior: null,
        position: null,
        formValidation: null,
      })
    } catch (_) {}
  }

  return { interactions, scrollBehaviors, forms }
}
