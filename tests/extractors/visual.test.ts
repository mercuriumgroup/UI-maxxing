/**
 * Visual extractor integration tests — exercise the extractor against the
 * static HTML fixture and assert known color/shadow/border-radius values.
 *
 * NOTE: VisualExtractor.extract() is a stub (throws "not implemented").
 * These tests are marked todo and will be activated when Phase 3 ships.
 */
import { describe, it } from 'vitest'

describe('VisualExtractor — integration (against fixture)', () => {
  it.todo('extracts the six known CSS custom property colors from the fixture')
  // Fixture defines: #1a1a2e, #16213e, #e94560, #ffffff, #333333, #e0e0e0

  it.todo('returns diffPercent=0 diff between two identical screenshots')

  it.todo('extracts border-radius values: 8px (btn), 12px (card), 6px (input)')

  it.todo('extracts box-shadow from .card: 0 2px 4px rgba(0,0,0,0.05)')
})
