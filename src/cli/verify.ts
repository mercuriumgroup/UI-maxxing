import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { ZodError } from 'zod'
import { compareScreenshots } from '../utils/screenshot-diff.js'
import { registerCleanup } from './cleanup.js'
import { VerifyConfigSchema } from '../types/config.js'

interface VerifyOptions {
  breakpoints: string
  threshold: string
  output: string
}

interface BreakpointResult {
  breakpoint: number
  diffPercent: number
  status: 'PASS' | 'NEAR' | 'FAIL'
}

export function createVerifyCommand(): Command {
  return new Command('verify')
    .description('Visual regression comparison between original and rebuild')
    .argument('<original-url>', 'Original website URL')
    .argument('<rebuild-url>', 'Your rebuild URL (e.g., http://localhost:3000)')
    .option('--breakpoints <list>', 'Comma-separated viewport widths', '375,768,1024,1280,1536')
    .option('--threshold <ratio>', 'Max acceptable pixel diff ratio (0-1)', '0.02')
    .option('-o, --output <dir>', 'Output directory', './designmaxxing-verify')
    .option('--no-screenshots', 'Skip embedding screenshots in report')
    .action(async (originalUrl: string, rebuildUrl: string, options: VerifyOptions) => {
      let config
      try {
        config = VerifyConfigSchema.parse({
          originalUrl,
          rebuildUrl,
          breakpoints: options.breakpoints.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
          threshold: parseFloat(options.threshold),
          output: options.output,
        })
      } catch (err) {
        if (err instanceof ZodError) {
          console.error(chalk.red('Invalid options:'))
          for (const issue of err.issues) console.error(chalk.red(`  ${issue.path.join('.')}: ${issue.message}`))
        } else {
          console.error(chalk.red(err instanceof Error ? err.message : String(err)))
        }
        process.exit(1)
      }
      const { breakpoints, threshold, output: outputDir } = config

      await mkdir(outputDir, { recursive: true })

      const spinner = ora('Launching browser...').start()
      const browser = await chromium.launch({ headless: true })

      registerCleanup(async () => {
        await browser.close()
        spinner.stop()
      })

      const results: BreakpointResult[] = []

      try {
        for (const bp of breakpoints) {
          spinner.text = `Comparing at ${bp}px...`
          const context = await browser.newContext({ viewport: { width: bp, height: 900 } })
          const page = await context.newPage()

          // Screenshot original
          await page.goto(originalUrl, { waitUntil: 'networkidle', timeout: 30000 })
          const origPath = join(outputDir, `original-${bp}.png`)
          await page.screenshot({ path: origPath, fullPage: true })

          // Screenshot rebuild
          await page.goto(rebuildUrl, { waitUntil: 'networkidle', timeout: 30000 })
          const rebuildPath = join(outputDir, `rebuild-${bp}.png`)
          await page.screenshot({ path: rebuildPath, fullPage: true })

          await context.close()

          // Compare
          const diffPath = join(outputDir, `diff-${bp}.png`)
          const diff = await compareScreenshots(origPath, rebuildPath, diffPath, 0.1)

          const status: BreakpointResult['status'] =
            diff.diffPercent <= threshold ? 'PASS' :
            diff.diffPercent <= threshold * 2 ? 'NEAR' : 'FAIL'

          results.push({ breakpoint: bp, diffPercent: diff.diffPercent, status })
        }

        // Write comparison.json
        const comparisonPath = join(outputDir, 'comparison.json')
        const { writeFile } = await import('node:fs/promises')
        await writeFile(comparisonPath, JSON.stringify(results, null, 2))

        spinner.succeed('Comparison complete')

        // Print results table
        console.log('\n' + chalk.bold('Breakpoint  Diff %    Status'))
        console.log(chalk.gray('─'.repeat(35)))
        for (const r of results) {
          const statusColor = r.status === 'PASS' ? chalk.green : r.status === 'NEAR' ? chalk.yellow : chalk.red
          const pct = (r.diffPercent * 100).toFixed(1)
          console.log(`${String(r.breakpoint).padEnd(12)}${pct.padEnd(10)}${statusColor(r.status)}`)
        }
        console.log(chalk.gray('\nOutput saved to: ') + chalk.white(outputDir))

      } catch (err) {
        spinner.fail(chalk.red(err instanceof Error ? err.message : String(err)))
        await browser.close()
        process.exit(1)
      }

      await browser.close()
    })
}
