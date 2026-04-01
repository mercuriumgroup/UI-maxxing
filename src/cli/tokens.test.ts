import { describe, it, expect } from 'vitest'
import { createTokensCommand } from './tokens.js'
import type { Command } from 'commander'

describe('createTokensCommand', () => {
  it('returns a Command named "tokens"', () => {
    const cmd = createTokensCommand()
    expect(cmd.name()).toBe('tokens')
  })

  it('has a "<dir>" argument', () => {
    const cmd = createTokensCommand()
    const args = cmd.registeredArguments
    expect(args.length).toBeGreaterThanOrEqual(1)
    expect(args[0].name()).toBe('dir')
  })

  it('default format option is "all"', () => {
    const cmd = createTokensCommand()
    // Parse with just the required arg to get defaults
    cmd.exitOverride()
    cmd.parseOptions(['./some-dir'])
    const opts = cmd.opts<{ format: string }>()
    expect(opts.format).toBe('all')
  })

  it('has a --format option', () => {
    const cmd = createTokensCommand()
    const formatOption = cmd.options.find(o => o.long === '--format')
    expect(formatOption).toBeDefined()
  })

  it('has a --output option', () => {
    const cmd = createTokensCommand()
    const outputOption = cmd.options.find(o => o.long === '--output')
    expect(outputOption).toBeDefined()
  })

  it('accepts a custom format value', () => {
    const cmd = createTokensCommand()
    cmd.exitOverride()
    cmd.parseOptions(['./some-dir', '--format', 'css'])
    const opts = cmd.opts<{ format: string }>()
    expect(opts.format).toBe('css')
  })
})
