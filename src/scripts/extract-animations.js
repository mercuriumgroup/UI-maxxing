function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { transitions: [], keyframes: [], error: 'Root element not found' }

  const transitions = []
  const keyframeMap = new Map()

  function getSelector(el) {
    let s = el.tagName.toLowerCase()
    if (el.id) s += '#' + el.id
    else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.')
      if (cls) s += '.' + cls
    }
    return s
  }

  // Scan elements for transitions and animations
  const allElements = root.querySelectorAll('*')
  for (const el of allElements) {
    try {
      const cs = getComputedStyle(el)

      // Transitions — filter out defaults
      const transition = cs.transition
      if (transition && transition !== 'all 0s ease 0s' && transition !== 'none') {
        // Parse individual transitions
        const parts = transition.split(/,(?![^(]*\))/).map(p => p.trim())
        for (const part of parts) {
          const tokens = part.split(/\s+/)
          if (tokens[0] === 'all' && tokens[1] === '0s') continue
          transitions.push({
            selector: getSelector(el),
            type: 'transition',
            property: tokens[0] || 'all',
            duration: tokens[1] || '0s',
            timingFunction: tokens[2] || 'ease',
            delay: tokens[3] || '0s',
            keyframes: null,
          })
        }
      }

      // Animation names
      const animName = cs.animationName
      if (animName && animName !== 'none') {
        const names = animName.split(',').map(n => n.trim())
        const durations = (cs.animationDuration || '0s').split(',').map(d => d.trim())
        const timings = (cs.animationTimingFunction || 'ease').split(',').map(t => t.trim())
        const delays = (cs.animationDelay || '0s').split(',').map(d => d.trim())

        for (let i = 0; i < names.length; i++) {
          if (names[i] === 'none') continue
          transitions.push({
            selector: getSelector(el),
            type: 'keyframes',
            property: names[i],
            duration: durations[i % durations.length] || '0s',
            timingFunction: timings[i % timings.length] || 'ease',
            delay: delays[i % delays.length] || '0s',
            keyframes: null, // will be filled from stylesheet parsing
          })
        }
      }
    } catch (_) {}
  }

  // Extract @keyframes from stylesheets
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSKeyframesRule) {
          const frames = []
          for (const kf of rule.cssRules) {
            const styles = {}
            for (let i = 0; i < kf.style.length; i++) {
              const prop = kf.style[i]
              styles[prop] = kf.style.getPropertyValue(prop)
            }
            frames.push({
              offset: kf.keyText,
              styles,
            })
          }
          keyframeMap.set(rule.name, frames)
        }
      }
    } catch (_) {
      // Cross-origin stylesheet
    }
  }

  // Attach keyframe data to matching animation entries
  for (const entry of transitions) {
    if (entry.type === 'keyframes' && keyframeMap.has(entry.property)) {
      entry.keyframes = keyframeMap.get(entry.property)
    }
  }

  // Build separate keyframes array for standalone reference
  const keyframes = Array.from(keyframeMap.entries()).map(([name, frames]) => ({
    selector: '',
    type: 'keyframes',
    property: name,
    duration: '',
    timingFunction: '',
    delay: '',
    keyframes: frames,
  }))

  return { transitions, keyframes }
}
