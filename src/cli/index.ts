#!/usr/bin/env node
import { Command } from 'commander'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runCleanup } from './cleanup.js'
import { createExtractCommand } from './extract.js'
import { createTokensCommand } from './tokens.js'
import { createVerifyCommand } from './verify.js'
import { createReportCommand } from './report.js'
import { createInstallClaudeCommand } from './install-claude.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function getVersion(): Promise<string> {
  const raw = await readFile(join(__dirname, '../../package.json'), 'utf-8')
  return (JSON.parse(raw) as { version: string }).version
}

async function main(): Promise<void> {
  process.on('SIGINT', async () => {
    await runCleanup()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await runCleanup()
    process.exit(0)
  })

  const version = await getVersion()

  const program = new Command()
    .name('designmaxxing')
    .description('Pixel-perfect UI reverse engineering toolkit')
    .version(version)

  // Commands will be registered here as they are built in later phases
  program.addCommand(createExtractCommand())
  program.addCommand(createTokensCommand())
  program.addCommand(createVerifyCommand())
  program.addCommand(createReportCommand())
  program.addCommand(createInstallClaudeCommand())

  await program.parseAsync(process.argv)
}

main().catch((err: unknown) => {
  console.error((err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
