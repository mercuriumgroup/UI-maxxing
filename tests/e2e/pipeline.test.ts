/**
 * E2E pipeline tests — test the orchestrator scaffold (browser, navigation,
 * screenshots, manifest) against the static fixture.
 *
 * NOTE: Individual extractor results are not asserted here because all
 * extractors are currently stubs (Phase 3 work). When extractors are
 * implemented, update the assertions in tests/extractors/.
 */
import { test, expect, beforeAll, afterAll } from 'vitest'
import { existsSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { extractAll } from '../../src/extractors/orchestrator.js'
import type { ExtractionManifest } from '../../src/types/extraction.js'

const fixturePath = resolve(import.meta.dirname, '../fixtures/test-page.html')
const outputDir = resolve(import.meta.dirname, '../output-e2e-test')
const fixtureUrl = `file://${fixturePath}`

beforeAll(() => {
  // Clean up any previous run
  if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true })
})

afterAll(() => {
  if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true })
})

test(
  'orchestrator: creates manifest.json with correct structure',
  async () => {
    const manifest = await extractAll({
      url: fixtureUrl,
      output: outputDir,
      modules: [],  // empty: no extractors, just screenshots + manifest
      breakpoints: [375, 768, 1280],
      headless: true,
      fullPage: true,
      timeout: 15000,
      viewport: { width: 1280, height: 800 },
    })

    // Manifest returned in memory
    expect(manifest.url).toBe(fixtureUrl)
    expect(manifest.breakpoints).toEqual([375, 768, 1280])
    expect(manifest.modules).toEqual([])
    expect(typeof manifest.timestamp).toBe('string')
    expect(manifest.outputDir).toBe(outputDir)

    // manifest.json written to disk
    const manifestPath = join(outputDir, 'manifest.json')
    expect(existsSync(manifestPath)).toBe(true)
    const fromDisk = JSON.parse(await readFile(manifestPath, 'utf-8')) as ExtractionManifest
    expect(fromDisk.url).toBe(fixtureUrl)
  },
  30000,
)

test(
  'orchestrator: takes screenshots at each breakpoint',
  async () => {
    // Re-use the output from the previous test (both tests share the dir via beforeAll)
    const screenshotDir = join(outputDir, 'screenshots')
    expect(existsSync(join(screenshotDir, 'breakpoint-375.png'))).toBe(true)
    expect(existsSync(join(screenshotDir, 'breakpoint-768.png'))).toBe(true)
    expect(existsSync(join(screenshotDir, 'breakpoint-1280.png'))).toBe(true)
  },
  5000,
)

test(
  'orchestrator: screenshot files are non-empty valid PNGs',
  async () => {
    const pngPath = join(outputDir, 'screenshots', 'breakpoint-1280.png')
    const buf = await readFile(pngPath)
    // PNG magic bytes: 89 50 4E 47
    expect(buf[0]).toBe(0x89)
    expect(buf[1]).toBe(0x50)
    expect(buf[2]).toBe(0x4e)
    expect(buf[3]).toBe(0x47)
    expect(buf.length).toBeGreaterThan(1000) // non-trivial file
  },
  5000,
)
