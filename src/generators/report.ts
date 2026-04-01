import { readFile } from 'node:fs/promises'
import type { ReportData, ReportFormat } from '../types/report.js'

export async function generateReport(data: ReportData, format: ReportFormat): Promise<string> {
  if (format === 'markdown') {
    return generateMarkdown(data)
  }
  return generateHtml(data)
}

async function generateHtml(data: ReportData): Promise<string> {
  const { manifest, tokens, typography, components, frameworkReport, assetCount, endpointCount, includeScreenshots, screenshotPaths } = data

  const url = manifest.url
  const timestamp = manifest.timestamp

  // Build color swatches
  let colorSection = '<p class="empty">No tokens generated yet.</p>'
  if (tokens && Object.keys(tokens.colors).length > 0) {
    const swatches = Object.entries(tokens.colors)
      .map(([name, value]) => `
        <div class="swatch">
          <div class="swatch-color" style="background: ${escapeHtml(value)}"></div>
          <span class="token-name">${escapeHtml(name)}</span>
          <span class="hex">${escapeHtml(value)}</span>
        </div>`)
      .join('')
    colorSection = `<div class="swatch-grid">${swatches}</div>`
  }

  // Build typography section
  let typographySection = '<p class="empty">No typography tokens generated yet.</p>'
  if (tokens && Object.keys(tokens.typography).length > 0) {
    const rows = Object.entries(tokens.typography)
      .map(([name, token]) => `
        <div class="type-sample">
          <div class="type-meta">
            <span class="token-name">${escapeHtml(name)}</span>
            <span class="type-detail">${escapeHtml(token.fontFamily)} / ${escapeHtml(token.fontSize)} / ${escapeHtml(token.fontWeight)}</span>
          </div>
          <div class="type-preview" style="font-family: ${escapeHtml(token.fontFamily)}; font-size: ${escapeHtml(token.fontSize)}; font-weight: ${escapeHtml(token.fontWeight)}; line-height: ${escapeHtml(token.lineHeight)}; letter-spacing: ${escapeHtml(token.letterSpacing)}">
            The quick brown fox jumps over the lazy dog
          </div>
        </div>`)
      .join('')
    typographySection = `<div class="type-list">${rows}</div>`
  }

  // Build screenshots section
  let screenshotSection = ''
  if (includeScreenshots && Object.keys(screenshotPaths).length > 0) {
    const imgs: string[] = []
    for (const [bp, filePath] of Object.entries(screenshotPaths)) {
      try {
        const buf = await readFile(filePath)
        const b64 = buf.toString('base64')
        imgs.push(`
          <div class="screenshot">
            <p class="screenshot-label">Breakpoint: ${escapeHtml(String(bp))}px</p>
            <img src="data:image/png;base64,${b64}" alt="Screenshot at ${escapeHtml(String(bp))}px" />
          </div>`)
      } catch {
        // skip missing screenshot files silently
      }
    }
    if (imgs.length > 0) {
      screenshotSection = `
        <section>
          <h2>Screenshots</h2>
          <div class="screenshot-list">${imgs.join('')}</div>
        </section>`
    }
  }

  // Build framework section
  let frameworkSection = ''
  if (frameworkReport && frameworkReport.frameworks.length > 0) {
    const items = frameworkReport.frameworks
      .map(f => `<li><strong>${escapeHtml(f.name)}</strong>${f.version ? ` v${escapeHtml(f.version)}` : ''} <span class="confidence">(${Math.round(f.confidence * 100)}% confidence)</span></li>`)
      .join('')
    frameworkSection = `
      <section>
        <h2>Framework Detection</h2>
        <ul class="framework-list">${items}</ul>
      </section>`
  }

  const componentCount = components?.components.length ?? 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Design System Report — ${escapeHtml(url)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #1a1a1a; line-height: 1.5; }
    header { background: #111; color: #fff; padding: 24px 40px; }
    header h1 { font-size: 1.5rem; font-weight: 600; }
    header .meta { font-size: 0.85rem; color: #aaa; margin-top: 4px; font-family: 'Courier New', monospace; }
    main { max-width: 1100px; margin: 0 auto; padding: 40px; }
    section { background: #fff; border-radius: 8px; padding: 28px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 20px; color: #111; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
    .empty { color: #888; font-style: italic; font-size: 0.9rem; }
    .swatch-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .swatch { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100px; }
    .swatch-color { width: 80px; height: 60px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); }
    .token-name { font-size: 0.7rem; font-family: 'Courier New', monospace; color: #555; text-align: center; word-break: break-all; }
    .hex { font-size: 0.75rem; font-family: 'Courier New', monospace; color: #222; }
    .type-list { display: flex; flex-direction: column; gap: 20px; }
    .type-sample { border: 1px solid #eee; border-radius: 6px; overflow: hidden; }
    .type-meta { background: #f8f8f8; padding: 8px 14px; display: flex; gap: 16px; align-items: center; }
    .type-detail { font-size: 0.75rem; font-family: 'Courier New', monospace; color: #666; }
    .type-preview { padding: 14px; color: #222; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .stat { background: #f8f8f8; border-radius: 6px; padding: 16px; text-align: center; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #111; }
    .stat-label { font-size: 0.8rem; color: #777; margin-top: 4px; }
    .framework-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .framework-list li { padding: 10px 14px; background: #f8f8f8; border-radius: 6px; font-size: 0.9rem; }
    .confidence { font-size: 0.8rem; color: #888; }
    .screenshot-list { display: flex; flex-direction: column; gap: 24px; }
    .screenshot-label { font-size: 0.85rem; font-family: 'Courier New', monospace; color: #555; margin-bottom: 8px; }
    .screenshot img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
  </style>
</head>
<body>
  <header>
    <h1>Design System Report</h1>
    <p class="meta">${escapeHtml(url)} &mdash; ${escapeHtml(timestamp)}</p>
  </header>
  <main>
    <section>
      <h2>Summary</h2>
      <div class="stats-grid">
        <div class="stat"><div class="stat-value">${componentCount}</div><div class="stat-label">Components</div></div>
        <div class="stat"><div class="stat-value">${assetCount}</div><div class="stat-label">Assets</div></div>
        <div class="stat"><div class="stat-value">${endpointCount}</div><div class="stat-label">Endpoints</div></div>
        <div class="stat"><div class="stat-value">${tokens ? Object.keys(tokens.colors).length : 0}</div><div class="stat-label">Color Tokens</div></div>
        <div class="stat"><div class="stat-value">${tokens ? Object.keys(tokens.typography).length : 0}</div><div class="stat-label">Typography Tokens</div></div>
      </div>
    </section>
    <section>
      <h2>Colors</h2>
      ${colorSection}
    </section>
    <section>
      <h2>Typography</h2>
      ${typographySection}
    </section>
    ${frameworkSection}
    ${screenshotSection}
  </main>
</body>
</html>`
}

function generateMarkdown(data: ReportData): string {
  const { manifest, tokens, components, assetCount, endpointCount, frameworkReport } = data
  const url = manifest.url
  const timestamp = manifest.timestamp
  const componentCount = components?.components.length ?? 0

  const lines: string[] = []
  lines.push('# Design System Report')
  lines.push('')
  lines.push(`**URL**: ${url}`)
  lines.push(`**Generated**: ${timestamp}`)
  lines.push('')

  // Colors table
  lines.push('## Colors')
  lines.push('')
  if (tokens && Object.keys(tokens.colors).length > 0) {
    lines.push('| Token | Value |')
    lines.push('|-------|-------|')
    for (const [name, value] of Object.entries(tokens.colors)) {
      lines.push(`| \`${name}\` | ${value} |`)
    }
  } else {
    lines.push('No color tokens generated yet.')
  }
  lines.push('')

  // Typography table
  lines.push('## Typography')
  lines.push('')
  if (tokens && Object.keys(tokens.typography).length > 0) {
    lines.push('| Token | Family | Size | Weight |')
    lines.push('|-------|--------|------|--------|')
    for (const [name, token] of Object.entries(tokens.typography)) {
      lines.push(`| \`${name}\` | ${token.fontFamily} | ${token.fontSize} | ${token.fontWeight} |`)
    }
  } else {
    lines.push('No typography tokens generated yet.')
  }
  lines.push('')

  // Framework
  if (frameworkReport && frameworkReport.frameworks.length > 0) {
    lines.push('## Frameworks')
    lines.push('')
    for (const f of frameworkReport.frameworks) {
      const ver = f.version ? ` v${f.version}` : ''
      lines.push(`- **${f.name}**${ver} (${Math.round(f.confidence * 100)}% confidence)`)
    }
    lines.push('')
  }

  // Stats
  lines.push('## Stats')
  lines.push('')
  lines.push(`- Components: ${componentCount}`)
  lines.push(`- Assets: ${assetCount}`)
  lines.push(`- Endpoints: ${endpointCount}`)
  lines.push('')

  return lines.join('\n')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
