import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { join, resolve } from 'node:path'
import { readFile, writeFile, access, readdir } from 'node:fs/promises'
import { exec, execFile } from 'node:child_process'
import { generateReport } from '../generators/report.js'
import type { ReportData, ReportFormat } from '../types/report.js'
import type { ExtractionManifest, VisualExtractionResult, TypographyExtractionResult, LayoutExtractionResult, ComponentExtractionResult, AnimationExtractionResult } from '../types/extraction.js'
import type { DesignTokens } from '../types/tokens.js'

async function tryReadJson<T>(filePath: string): Promise<T | null> {
  try {
    await access(filePath)
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function createReportCommand(): Command {
  return new Command('report')
    .description('Generate a visual HTML report from extraction data')
    .argument('<dir>', 'Path to extraction output directory')
    .option('--format <type>', 'Report format: html, markdown', 'html')
    .option('--open', 'Open report in browser after generation')
    .option('--no-screenshots', 'Skip embedding screenshots')
    .action(async (dir: string, options: { format: string; open?: boolean; screenshots?: boolean }) => {
      const outputDir = resolve(dir)
      const spinner = ora('Loading extraction data…').start()

      try {
        // 1. Read manifest.json
        const manifestPath = join(outputDir, 'manifest.json')
        const manifest = await tryReadJson<ExtractionManifest>(manifestPath)
        if (!manifest) {
          spinner.fail(chalk.red(`No manifest.json found in ${outputDir}`))
          process.exit(1)
        }

        // 2. Read available module JSONs (gracefully skip missing ones)
        const visual = await tryReadJson<VisualExtractionResult>(join(outputDir, 'visual.json'))
        const typography = await tryReadJson<TypographyExtractionResult>(join(outputDir, 'typography.json'))
        const layout = await tryReadJson<LayoutExtractionResult>(join(outputDir, 'layout.json'))
        const components = await tryReadJson<ComponentExtractionResult>(join(outputDir, 'components.json'))
        const animations = await tryReadJson<AnimationExtractionResult>(join(outputDir, 'animations.json'))

        // 3. Read tokens.json if it exists
        const tokens = await tryReadJson<DesignTokens>(join(outputDir, 'tokens.json'))

        // 4. Build screenshot paths map from screenshots/ dir
        const screenshotPaths: Record<number, string> = {}
        const screenshotDir = join(outputDir, 'screenshots')
        try {
          const files = await readdir(screenshotDir)
          for (const file of files) {
            const match = /breakpoint-(\d+)\.png$/.exec(file)
            if (match) {
              screenshotPaths[parseInt(match[1], 10)] = join(screenshotDir, file)
            }
          }
        } catch {
          // no screenshots directory — that's fine
        }

        // Count assets and endpoints from nested results
        const assetCount = (await tryReadJson<{ assets: unknown[] }>(join(outputDir, 'assets.json')))?.assets.length ?? 0
        const endpointCount = (await tryReadJson<{ endpoints: unknown[] }>(join(outputDir, 'network.json')))?.endpoints.length ?? 0

        // 5. Build ReportData
        const includeScreenshots = options.screenshots !== false
        const reportData: ReportData = {
          manifest,
          tokens,
          visual,
          typography,
          layout,
          components,
          animations,
          screenshotPaths,
          frameworkReport: manifest.framework ?? null,
          assetCount,
          endpointCount,
          includeScreenshots,
        }

        // 6. Validate format
        const format = (options.format === 'markdown' ? 'markdown' : 'html') as ReportFormat

        spinner.text = 'Generating report…'

        // 7. Call generateReport
        const reportContent = await generateReport(reportData, format)

        // 8. Write report file
        const filename = format === 'markdown' ? 'report.md' : 'report.html'
        const reportPath = join(outputDir, filename)
        await writeFile(reportPath, reportContent, 'utf-8')

        spinner.succeed(chalk.green(`Report written to ${reportPath}`))

        // 9. If --open: open in browser (use execFile to avoid shell injection)
        if (options.open) {
          const platform = process.platform
          if (platform === 'win32') {
            // 'start' is a shell built-in on Windows; strip quotes from path to prevent injection
            const safePath = reportPath.replace(/['"]/g, '')
            exec(`start "" "${safePath}"`, (err) => {
              if (err) console.error(chalk.yellow('Could not open report automatically.'))
            })
          } else {
            const openCmd = platform === 'darwin' ? 'open' : 'xdg-open'
            execFile(openCmd, [reportPath], (err) => {
              if (err) console.error(chalk.yellow('Could not open report automatically.'))
            })
          }
        }
      } catch (err: unknown) {
        spinner.fail(chalk.red('Report generation failed'))
        console.error(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
