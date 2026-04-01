import { describe, it, expect, vi } from 'vitest'
import { registerCleanup, runCleanup } from './cleanup.js'

describe('cleanup', () => {
  it('runs registered handlers', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    registerCleanup(fn)
    await runCleanup()
    expect(fn).toHaveBeenCalled()
  })

  it('runs all handlers even if one rejects', async () => {
    const fn1 = vi.fn().mockRejectedValue(new Error('fail'))
    const fn2 = vi.fn().mockResolvedValue(undefined)
    registerCleanup(fn1)
    registerCleanup(fn2)
    await runCleanup()
    expect(fn1).toHaveBeenCalled()
    expect(fn2).toHaveBeenCalled()
  })
})
