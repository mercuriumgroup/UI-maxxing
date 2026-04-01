import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { extractAll } from '../extractors/orchestrator.js'
import { ConfigSchema, ExtractionModules } from '../types/config.js'
import { registerCleanup } from './cleanup.js'
import { ZodError } from 'zod'

const VALID_MODULES = [...ExtractionModules]

export function createExtractCommand(): Command {
  return new Command('extract')
    .description('Extract design data from a web page')
    .argument('<url>', 'URL to extract from')
    .option('--modules <list>', 'Comma-separated modules to run (or "all")', 'all')
    .option('--breakpoints <list>', 'Comma-separated viewport widths', '375,768,1024,1280,1536')
    .option('-o, --output <dir>', 'Output directory', './designmaxxing-output')
    .option('--auth-cookies <file>', 'Path to cookies JSON for authenticated pages')
    .option('--selector <css>', 'Limit extraction to elements matching CSS selector')
    .option('--full-page', 'Extract entire page (not just viewport)', true)
    .option('--no-headless', 'Run browser in headed mode')
    .option('--timeout <ms>', 'Navigation timeout in milliseconds', '30000')
    .option('--wait-for-selector <css>', 'Wait for this selector before extracting')
    .action(async (url: string, options: Record<string, unknown>) => {
      // 1. Parse modules
      let parsedModules: typeof VALID_MODULES[number][]
      if (options.modules === 'all') {
        parsedModules = [...VALID_MODULES]
      } else {
        const rawModules = (options.modules as string).split(',').map(m => m.trim())
        const invalid = rawModules.filter(m => !VALID_MODULES.includes(m as typeof VALID_MODULES[number]))
        if (invalid.length > 0) {
          console.error(chalk.red(`Invalid module(s): ${invalid.join(', ')}`))
          console.error(chalk.gray(`Valid modules: ${VALID_MODULES.join(', ')}`))
          process.exit(1)
        }
        parsedModules = rawModules as typeof VALID_MODULES[number][]
      }

      // 2. Parse breakpoints
      const parsedBreakpoints = (options.breakpoints as string)
        .split(',')
        .map(b => parseInt(b.trim(), 10))
        .filter(b => !isNaN(b))

      // 3. Build config and validate
      let config
      try {
        config = ConfigSchema.parse({
          url,
          modules: parsedModules,
          breakpoints: parsedBreakpoints,
          output: options.output,
          authCookies: options.authCookies,
          selector: options.selector,
          fullPage: options.fullPage,
          headless: options.headless !== false,
          timeout: parseInt(options.timeout as string),
          waitForSelector: options.waitForSelector,
        })
      } catch (err) {
        if (err instanceof ZodError) {
          console.error(chalk.red('Invalid configuration:'))
          for (const issue of err.issues) {
            console.error(chalk.red(`  ${issue.path.join('.')}: ${issue.message}`))
          }
          process.exit(1)
        }
        throw err
      }

      // 4. Show banner
      console.log(chalk.cyan('\n✦ designmaxxing') + chalk.gray(' — extracting from ') + chalk.white(url))

      // 5. Create spinner
      const spinner = ora('Initializing browser...').start()

      // 6. Register cleanup
      registerCleanup(async () => { spinner.stop() })

      try {
        // 7. Call extractAll
        await extractAll(config)

        // 8. On success
        spinner.succeed(chalk.green('Extraction complete'))
        console.log(chalk.gray('\nOutput saved to: ') + chalk.white(config.output))
        console.log(chalk.gray('Next step: ') + chalk.white(`designmaxxing tokens ${config.output}`))
      } catch (err) {
        if (err instanceof ZodError) {
          // 9. ZodError
          spinner.fail('Invalid configuration')
          for (const issue of err.issues) {
            console.error(chalk.red(`  ${issue.path.join('.')}: ${issue.message}`))
          }
          process.exit(1)
        } else if (err instanceof Error) {
          // 10. Other Error
          spinner.fail(chalk.red(err.message))
          console.error(chalk.gray('Tip: check that the URL is accessible and the server is reachable.'))
          process.exit(1)
        } else {
          spinner.fail(chalk.red('Unknown error'))
          process.exit(1)
        }
      }
    })
}
