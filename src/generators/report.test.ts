import { describe, it, expect } from 'vitest'
import { generateReport } from './report.js'
import type { ReportData } from '../types/report.js'

const minimalData: ReportData = {
  manifest: {
    url: 'https://example.com',
    timestamp: '2026-04-01T00:00:00Z',
    breakpoints: [],
    modules: [],
    outputDir: '/tmp/test',
    framework: null,
    results: {},
  },
  tokens: null,
  visual: null,
  typography: null,
  layout: null,
  components: null,
  animations: null,
  screenshotPaths: {},
  frameworkReport: null,
  assetCount: 0,
  endpointCount: 0,
  includeScreenshots: false,
}

describe('generateReport', () => {
  it('generates HTML with title', async () => {
    const html = await generateReport(minimalData, 'html')
    expect(html).toContain('<title>')
    expect(html).toContain('example.com')
  })

  it('generates HTML with summary stats section', async () => {
    const html = await generateReport(minimalData, 'html')
    expect(html).toContain('Summary')
    expect(html).toContain('Components')
    expect(html).toContain('Assets')
  })

  it('generates HTML with empty state messages when no tokens', async () => {
    const html = await generateReport(minimalData, 'html')
    expect(html).toContain('No tokens generated yet.')
  })

  it('generates markdown with header', async () => {
    const md = await generateReport(minimalData, 'markdown')
    expect(md).toContain('# Design System Report')
    expect(md).toContain('example.com')
  })

  it('generates markdown with colors and typography sections', async () => {
    const md = await generateReport(minimalData, 'markdown')
    expect(md).toContain('## Colors')
    expect(md).toContain('## Typography')
    expect(md).toContain('## Stats')
  })

  it('renders color swatches when tokens are provided', async () => {
    const dataWithTokens: ReportData = {
      ...minimalData,
      tokens: {
        colors: { '--color-primary': '#0070f3', '--color-bg': '#ffffff' },
        typography: {},
        spacing: {},
        borderRadius: {},
        shadows: {},
        breakpoints: {},
        transitions: {},
        zIndex: {},
      },
    }
    const html = await generateReport(dataWithTokens, 'html')
    expect(html).toContain('background: #0070f3')
    expect(html).toContain('--color-primary')
  })

  it('escapes HTML special characters in the URL', async () => {
    const xssData: ReportData = {
      ...minimalData,
      manifest: {
        ...minimalData.manifest,
        url: '<script>alert(1)</script>',
      },
    }
    const html = await generateReport(xssData, 'html')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes all five HTML special characters: & < > " \'', async () => {
    const data: ReportData = {
      ...minimalData,
      manifest: {
        ...minimalData.manifest,
        url: 'a&b "c" \'d\' <e>',
      },
    }
    const html = await generateReport(data, 'html')
    expect(html).toContain('a&amp;b')
    expect(html).toContain('&quot;c&quot;')
    expect(html).toContain('&#39;d&#39;')
    expect(html).toContain('&lt;e&gt;')
    expect(html).not.toContain('a&b')
    expect(html).not.toContain('"c"')
    expect(html).not.toContain("'d'")
    expect(html).not.toContain('<e>')
  })

  it('escapes color token values used in inline styles', async () => {
    // Craft a malicious color value — if unescaped it would close the style attribute
    const data: ReportData = {
      ...minimalData,
      tokens: {
        colors: { 'bad-token': '"><img src=x onerror=alert(1)>' },
        typography: {},
        spacing: {},
        borderRadius: {},
        shadows: {},
        breakpoints: {},
        transitions: {},
        zIndex: {},
      },
    }
    const html = await generateReport(data, 'html')
    // The raw injection string must not appear verbatim (angle brackets and quotes escaped)
    expect(html).not.toContain('"><img')
    // The escaped form should appear instead
    expect(html).toContain('&quot;&gt;&lt;img')
  })

  it('framework section is omitted when frameworks list is empty', async () => {
    const data: ReportData = {
      ...minimalData,
      frameworkReport: { frameworks: [], cssMethodology: [], componentLibrary: [] },
    }
    const html = await generateReport(data, 'html')
    expect(html).not.toContain('Framework Detection')
  })

  it('framework section is rendered when frameworks are detected', async () => {
    const data: ReportData = {
      ...minimalData,
      frameworkReport: {
        frameworks: [{ name: 'React', version: '18.0.0', confidence: 0.95, signals: [] }],
        cssMethodology: [],
        componentLibrary: [],
      },
    }
    const html = await generateReport(data, 'html')
    expect(html).toContain('Framework Detection')
    expect(html).toContain('React')
    expect(html).toContain('v18.0.0')
    expect(html).toContain('95%')
  })

  it('renders typography tokens in markdown', async () => {
    const dataWithTypo: ReportData = {
      ...minimalData,
      tokens: {
        colors: {},
        typography: {
          'heading-lg': {
            fontFamily: 'Inter',
            fontSize: '2rem',
            fontWeight: '700',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
          },
        },
        spacing: {},
        borderRadius: {},
        shadows: {},
        breakpoints: {},
        transitions: {},
        zIndex: {},
      },
    }
    const md = await generateReport(dataWithTypo, 'markdown')
    expect(md).toContain('heading-lg')
    expect(md).toContain('Inter')
    expect(md).toContain('2rem')
  })

  it('HTML Colors section appears before Typography section', async () => {
    const html = await generateReport(minimalData, 'html')
    const colorsIdx = html.indexOf('<h2>Colors</h2>')
    const typoIdx = html.indexOf('<h2>Typography</h2>')
    expect(colorsIdx).toBeGreaterThan(-1)
    expect(typoIdx).toBeGreaterThan(-1)
    expect(colorsIdx).toBeLessThan(typoIdx)
  })

  it('typography token with empty fontFamily does not crash HTML render', async () => {
    const data: ReportData = {
      ...minimalData,
      tokens: {
        colors: {},
        typography: {
          'text-base': {
            fontFamily: '',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
          },
        },
        spacing: {},
        borderRadius: {},
        shadows: {},
        breakpoints: {},
        transitions: {},
        zIndex: {},
      },
    }
    await expect(generateReport(data, 'html')).resolves.not.toThrow()
  })
})
