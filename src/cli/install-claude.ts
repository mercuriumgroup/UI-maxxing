import { Command } from 'commander'
import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { access } from 'node:fs/promises'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function createInstallClaudeCommand(): Command {
  return new Command('install-claude')
    .description('Install the /designmaxxing skill and agents into Claude Code')
    .action(async () => {
      // Find the script relative to this file — works from both src/ and dist/
      const scriptPath = join(__dirname, '../../scripts/install-claude.sh')

      try {
        await access(scriptPath)
      } catch {
        console.log(chalk.yellow('install-claude script not found at:'), chalk.gray(scriptPath))
        console.log(chalk.white('Run manually: npm run install-claude'))
        process.exit(1)
      }

      console.log(chalk.cyan('Installing designmaxxing Claude Code integration...'))

      execFile('bash', [scriptPath], (err, stdout, stderr) => {
        if (err) {
          console.error(chalk.red('Installation failed:'), err.message)
          if (stderr) console.error(chalk.gray(stderr))
          process.exit(1)
        }
        if (stdout) console.log(stdout)
        console.log(chalk.green('✓ Claude Code integration installed'))
        console.log(chalk.gray('  /designmaxxing skill is now available in Claude Code'))
      })
    })
}
