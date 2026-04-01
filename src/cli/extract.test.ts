import { describe, it, expect } from 'vitest'
import { createExtractCommand } from './extract.js'

describe('createExtractCommand', () => {
  it('creates a command named extract', () => {
    const cmd = createExtractCommand()
    expect(cmd.name()).toBe('extract')
  })

  it('has a url argument', () => {
    const cmd = createExtractCommand()
    expect(cmd.registeredArguments.length).toBe(1)
    expect(cmd.registeredArguments[0].name()).toBe('url')
  })

  it('has default output option', () => {
    const cmd = createExtractCommand()
    const outputOpt = cmd.options.find(o => o.long === '--output')
    expect(outputOpt?.defaultValue).toBe('./designmaxxing-output')
  })
})
