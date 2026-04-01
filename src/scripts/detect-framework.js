function __extract() {
  const frameworks = []
  const cssMethodology = []
  const componentLibrary = []

  // --- Framework Detection ---

  // Next.js
  if (window.__NEXT_DATA__ || document.querySelector('#__next')) {
    const version = window.__NEXT_DATA__?.buildId ? null : null
    const meta = document.querySelector('meta[name="generator"]')
    const signals = []
    if (window.__NEXT_DATA__) signals.push('window.__NEXT_DATA__')
    if (document.querySelector('#__next')) signals.push('#__next')
    if (meta && meta.content.includes('Next')) signals.push('meta[generator]')
    frameworks.push({ name: 'Next.js', version: null, confidence: 0.95, signals })
  }

  // Nuxt
  if (window.__NUXT__ || document.querySelector('#__nuxt')) {
    const signals = []
    if (window.__NUXT__) signals.push('window.__NUXT__')
    if (document.querySelector('#__nuxt')) signals.push('#__nuxt')
    frameworks.push({ name: 'Nuxt', version: null, confidence: 0.95, signals })
  }

  // React (generic, not Next)
  {
    const signals = []
    if (document.querySelector('[data-reactroot]')) signals.push('[data-reactroot]')
    const body = document.body
    for (const key of Object.keys(body)) {
      if (key.startsWith('__reactFiber$') || key.startsWith('_reactRootContainer')) {
        signals.push(key.split('$')[0])
        break
      }
    }
    if (signals.length > 0 && !frameworks.some(f => f.name === 'Next.js')) {
      frameworks.push({ name: 'React', version: null, confidence: 0.9, signals })
    }
  }

  // Vue
  {
    const signals = []
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) signals.push('__VUE_DEVTOOLS_GLOBAL_HOOK__')
    if (document.querySelector('[data-v-]') || document.querySelector('[data-v-app]')) signals.push('[data-v-*]')
    const allEls = document.querySelectorAll('*')
    for (const el of allEls) {
      if (el.__vue__) { signals.push('__vue__'); break }
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-v-')) { signals.push('data-v-*'); break }
      }
      if (signals.length > 0) break
    }
    if (signals.length > 0 && !frameworks.some(f => f.name === 'Nuxt')) {
      frameworks.push({ name: 'Vue', version: null, confidence: 0.85, signals })
    }
  }

  // Angular
  {
    const signals = []
    const ngVersion = document.querySelector('[ng-version]')
    if (ngVersion) {
      signals.push('[ng-version]=' + ngVersion.getAttribute('ng-version'))
    }
    if (window.ng) signals.push('window.ng')
    for (const el of document.querySelectorAll('*')) {
      for (const attr of el.attributes) {
        if (attr.name.startsWith('_ngcontent-')) { signals.push('_ngcontent-*'); break }
      }
      if (signals.length > 1) break
    }
    if (signals.length > 0) {
      const version = ngVersion ? ngVersion.getAttribute('ng-version') : null
      frameworks.push({ name: 'Angular', version, confidence: 0.9, signals })
    }
  }

  // Svelte
  {
    const signals = []
    const svelteEls = document.querySelectorAll('[class*="svelte-"]')
    if (svelteEls.length > 0) signals.push('class*="svelte-" (' + svelteEls.length + ' elements)')
    if (signals.length > 0) {
      frameworks.push({ name: 'Svelte', version: null, confidence: 0.85, signals })
    }
  }

  // Remix
  if (window.__remixContext) {
    frameworks.push({ name: 'Remix', version: null, confidence: 0.95, signals: ['window.__remixContext'] })
  }

  // Gatsby
  if (window.__GATSBY) {
    frameworks.push({ name: 'Gatsby', version: null, confidence: 0.95, signals: ['window.__GATSBY'] })
  }

  // Astro
  {
    const meta = document.querySelector('meta[name="generator"][content*="Astro"]')
    if (meta) {
      frameworks.push({ name: 'Astro', version: meta.content.replace('Astro v', ''), confidence: 0.95, signals: ['meta[generator*=Astro]'] })
    }
  }

  // SvelteKit
  {
    const scripts = document.querySelectorAll('script')
    for (const s of scripts) {
      if (s.textContent && s.textContent.includes('__sveltekit')) {
        frameworks.push({ name: 'SvelteKit', version: null, confidence: 0.9, signals: ['__sveltekit in script'] })
        break
      }
    }
  }

  // --- CSS Methodology Detection ---

  // Tailwind — frequency analysis of utility classes
  {
    const tailwindPatterns = [
      /\bflex\b/, /\bp-\d/, /\bpx-\d/, /\bpy-\d/, /\bbg-/, /\btext-/,
      /\brounded/, /\bshadow/, /\bw-/, /\bh-/, /\bgrid\b/, /\bgap-/,
      /\bm-\d/, /\bmx-/, /\bmy-/, /\bborder\b/, /\bhidden\b/, /\brelative\b/,
    ]
    let matchCount = 0
    const allClasses = new Set()
    for (const el of document.querySelectorAll('[class]')) {
      const cls = el.getAttribute('class') || ''
      for (const c of cls.split(/\s+/)) allClasses.add(c)
    }
    const classStr = Array.from(allClasses).join(' ')
    for (const pattern of tailwindPatterns) {
      if (pattern.test(classStr)) matchCount++
    }
    if (matchCount >= 6) {
      cssMethodology.push({
        name: 'Tailwind CSS',
        confidence: Math.min(0.95, 0.5 + matchCount * 0.05),
        signals: [matchCount + '/' + tailwindPatterns.length + ' utility patterns matched'],
      })
    }
  }

  // BEM
  {
    let bemCount = 0
    for (const el of document.querySelectorAll('[class]')) {
      const cls = el.getAttribute('class') || ''
      if (/\w+__\w+--\w+/.test(cls) || /\w+__\w+/.test(cls)) bemCount++
    }
    if (bemCount >= 5) {
      cssMethodology.push({
        name: 'BEM',
        confidence: Math.min(0.9, 0.4 + bemCount * 0.02),
        signals: [bemCount + ' BEM-pattern classes found'],
      })
    }
  }

  // CSS Modules
  {
    let moduleCount = 0
    for (const el of document.querySelectorAll('[class]')) {
      const cls = el.getAttribute('class') || ''
      if (/\w+_\w+__[\w-]{5,}/.test(cls) || /styles_\w+__/.test(cls)) moduleCount++
    }
    if (moduleCount >= 3) {
      cssMethodology.push({
        name: 'CSS Modules',
        confidence: Math.min(0.9, 0.5 + moduleCount * 0.03),
        signals: [moduleCount + ' hashed module classes found'],
      })
    }
  }

  // CSS-in-JS: Emotion
  {
    let emotionCount = 0
    for (const el of document.querySelectorAll('[class*="css-"]')) emotionCount++
    if (emotionCount >= 5) {
      cssMethodology.push({
        name: 'Emotion (CSS-in-JS)',
        confidence: Math.min(0.85, 0.4 + emotionCount * 0.02),
        signals: [emotionCount + ' css-* prefixed classes'],
      })
    }
  }

  // CSS-in-JS: styled-components
  {
    let scCount = 0
    for (const el of document.querySelectorAll('[class*="sc-"]')) scCount++
    if (scCount >= 5) {
      cssMethodology.push({
        name: 'styled-components',
        confidence: Math.min(0.85, 0.4 + scCount * 0.02),
        signals: [scCount + ' sc-* prefixed classes'],
      })
    }
  }

  // --- Component Library Detection ---

  // MUI
  {
    const muiEls = document.querySelectorAll('[class*="Mui"]')
    if (muiEls.length >= 3) {
      componentLibrary.push({
        name: 'Material UI (MUI)',
        confidence: Math.min(0.95, 0.5 + muiEls.length * 0.01),
        signals: [muiEls.length + ' Mui* classes'],
      })
    }
  }

  // Chakra UI
  {
    const chakraEls = document.querySelectorAll('[class*="chakra-"]')
    if (chakraEls.length >= 3) {
      componentLibrary.push({
        name: 'Chakra UI',
        confidence: Math.min(0.95, 0.5 + chakraEls.length * 0.01),
        signals: [chakraEls.length + ' chakra-* classes'],
      })
    }
  }

  // Ant Design
  {
    const antEls = document.querySelectorAll('[class*="ant-"]')
    if (antEls.length >= 3) {
      componentLibrary.push({
        name: 'Ant Design',
        confidence: Math.min(0.95, 0.5 + antEls.length * 0.01),
        signals: [antEls.length + ' ant-* classes'],
      })
    }
  }

  // Radix UI
  {
    const radixEls = document.querySelectorAll('[data-radix-collection-item], [data-radix-popper-content-wrapper]')
    let radixAttrCount = 0
    for (const el of document.querySelectorAll('*')) {
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-radix-')) { radixAttrCount++; break }
      }
    }
    if (radixAttrCount >= 2) {
      componentLibrary.push({
        name: 'Radix UI',
        confidence: Math.min(0.9, 0.5 + radixAttrCount * 0.05),
        signals: [radixAttrCount + ' data-radix-* attributes'],
      })
    }
  }

  // shadcn/ui (Radix + Tailwind + data-slot)
  {
    const slotEls = document.querySelectorAll('[data-slot]')
    const hasRadix = componentLibrary.some(c => c.name === 'Radix UI')
    const hasTailwind = cssMethodology.some(c => c.name === 'Tailwind CSS')
    if (slotEls.length >= 2 && (hasRadix || hasTailwind)) {
      componentLibrary.push({
        name: 'shadcn/ui',
        confidence: Math.min(0.9, 0.5 + slotEls.length * 0.05),
        signals: [slotEls.length + ' data-slot attributes', hasRadix ? 'Radix detected' : '', hasTailwind ? 'Tailwind detected' : ''].filter(Boolean),
      })
    }
  }

  // Headless UI
  {
    let headlessCount = 0
    for (const el of document.querySelectorAll('*')) {
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-headlessui-')) { headlessCount++; break }
      }
    }
    if (headlessCount >= 2) {
      componentLibrary.push({
        name: 'Headless UI',
        confidence: Math.min(0.9, 0.5 + headlessCount * 0.05),
        signals: [headlessCount + ' data-headlessui-* attributes'],
      })
    }
  }

  // DaisyUI
  {
    const daisyClasses = ['btn', 'card', 'navbar', 'drawer', 'modal', 'badge', 'alert']
    let daisyCount = 0
    const hasTailwind = cssMethodology.some(c => c.name === 'Tailwind CSS')
    for (const cls of daisyClasses) {
      if (document.querySelector('.' + cls)) daisyCount++
    }
    if (daisyCount >= 3 && hasTailwind) {
      componentLibrary.push({
        name: 'DaisyUI',
        confidence: Math.min(0.85, 0.4 + daisyCount * 0.1),
        signals: [daisyCount + '/' + daisyClasses.length + ' DaisyUI classes found', 'Tailwind detected'],
      })
    }
  }

  return { frameworks, cssMethodology, componentLibrary }
}
