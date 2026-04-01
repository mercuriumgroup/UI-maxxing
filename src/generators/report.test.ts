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
})
