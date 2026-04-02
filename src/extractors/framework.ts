import { BaseExtractor } from './base.js'
import type { FrameworkDetection } from '../types/extraction.js'

export class FrameworkExtractor extends BaseExtractor<FrameworkDetection> {
  async extract(): Promise<FrameworkDetection> {
    const result = await this.page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>
      const frameworks: Array<{ name: string; version: string | null; confidence: number; signals: string[] }> = []
      const cssMethodology: Array<{ name: string; confidence: number; signals: string[] }> = []
      const componentLibrary: Array<{ name: string; confidence: number; signals: string[] }> = []

      const allClasses = Array.from(document.querySelectorAll('[class]'))
        .map(el => (el as HTMLElement).className)
        .join(' ')
      const scripts = Array.from(document.querySelectorAll('script[src]'))
        .map(s => (s as HTMLScriptElement).src)
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(l => (l as HTMLLinkElement).href)

      // Next.js
      {
        const signals: string[] = []
        if (w['__NEXT_DATA__']) signals.push('window.__NEXT_DATA__')
        if (document.getElementById('__NEXT_DATA__')) signals.push('#__NEXT_DATA__ script tag')
        if (document.querySelector('[data-nextjs-page]')) signals.push('data-nextjs-page attribute')
        if (scripts.some(s => s.includes('/_next/'))) signals.push('/_next/ script paths')
        if (signals.length) frameworks.push({ name: 'Next.js', version: null, confidence: Math.min(signals.length / 2, 1), signals })
      }

      // React
      {
        const signals: string[] = []
        if (w['__REACT_DEVTOOLS_GLOBAL_HOOK__']) signals.push('__REACT_DEVTOOLS_GLOBAL_HOOK__')
        if (w['React']) signals.push('window.React')
        if (document.querySelector('[data-reactroot]')) signals.push('data-reactroot attribute')
        if (scripts.some(s => s.includes('react'))) signals.push('react in script src')
        if (signals.length) frameworks.push({ name: 'React', version: null, confidence: Math.min(signals.length / 2, 1), signals })
      }

      // Vue
      {
        const signals: string[] = []
        if (w['__vue_devtools_global_hook__']) signals.push('__vue_devtools_global_hook__')
        if (w['Vue']) signals.push('window.Vue')
        if (document.querySelector('[data-v-app]')) signals.push('data-v-app attribute')
        if (scripts.some(s => s.includes('vue'))) signals.push('vue in script src')
        if (signals.length) frameworks.push({ name: 'Vue', version: null, confidence: Math.min(signals.length / 2, 1), signals })
      }

      // Nuxt
      {
        const signals: string[] = []
        if (w['__NUXT__']) signals.push('window.__NUXT__')
        if (w['__nuxt']) signals.push('window.__nuxt')
        if (scripts.some(s => s.includes('/_nuxt/'))) signals.push('/_nuxt/ script paths')
        if (signals.length) frameworks.push({ name: 'Nuxt', version: null, confidence: Math.min(signals.length / 2, 1), signals })
      }

      // Angular
      {
        const signals: string[] = []
        if (w['ng']) signals.push('window.ng')
        const ngVersion = document.querySelector('[ng-version]')
        if (ngVersion) signals.push('ng-version attribute')
        if (document.querySelector('app-root')) signals.push('app-root element')
        if (signals.length) {
          frameworks.push({
            name: 'Angular',
            version: (ngVersion as HTMLElement | null)?.getAttribute('ng-version') ?? null,
            confidence: Math.min(signals.length / 2, 1),
            signals,
          })
        }
      }

      // Svelte
      {
        const signals: string[] = []
        if (w['__svelte']) signals.push('window.__svelte')
        if (/svelte-[a-z0-9]{6,}/.test(allClasses)) signals.push('svelte-HASH class names')
        if (signals.length) frameworks.push({ name: 'Svelte', version: null, confidence: Math.min(signals.length, 1), signals })
      }

      // Tailwind CSS
      {
        const signals: string[] = []
        const twPatterns = [/\bflex\b/, /\bgrid\b/, /\btext-[a-z]/, /\bbg-[a-z]/, /\bp-\d/, /\bm-\d/, /\bw-\d/, /\bh-\d/, /\brounded/, /\bshadow/, /\bborder-/]
        const matchCount = twPatterns.filter(p => p.test(allClasses)).length
        if (matchCount >= 5) signals.push(`${matchCount}/${twPatterns.length} Tailwind utility patterns`)
        if (links.some(l => l.includes('tailwind'))) signals.push('tailwind in stylesheet href')
        if (scripts.some(s => s.includes('tailwind'))) signals.push('tailwind in script src')
        if (signals.length) cssMethodology.push({ name: 'Tailwind CSS', confidence: Math.min(matchCount / 8, 1), signals })
      }

      // Bootstrap
      {
        const signals: string[] = []
        if (w['bootstrap']) signals.push('window.bootstrap')
        if (/\b(btn|container|row|col-|navbar|modal|card|dropdown)\b/.test(allClasses)) signals.push('Bootstrap class patterns')
        if (links.some(l => l.includes('bootstrap'))) signals.push('bootstrap in stylesheet href')
        if (signals.length) cssMethodology.push({ name: 'Bootstrap', confidence: Math.min(signals.length / 2, 1), signals })
      }

      // shadcn/ui (Radix-based)
      {
        const signals: string[] = []
        if (document.querySelector('[data-radix-popper-content-wrapper]')) signals.push('data-radix-popper-content-wrapper')
        if (document.querySelectorAll('[data-state]').length > 3) signals.push('multiple data-state attributes')
        if (document.querySelector('[data-slot]')) signals.push('data-slot attribute')
        if (/\bcmdk-/.test(allClasses)) signals.push('cmdk- class prefix')
        if (signals.length) componentLibrary.push({ name: 'shadcn/ui', confidence: Math.min(signals.length / 2, 1), signals })
      }

      // Material UI
      {
        const signals: string[] = []
        if (w['__MUI_THEME__']) signals.push('window.__MUI_THEME__')
        if (/\bMui[A-Z]/.test(allClasses)) signals.push('MuiXxx class prefix')
        if (signals.length) componentLibrary.push({ name: 'Material UI', confidence: Math.min(signals.length, 1), signals })
      }

      return { frameworks, cssMethodology, componentLibrary }
    })

    return result as FrameworkDetection
  }
}
