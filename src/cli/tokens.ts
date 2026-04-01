import { Command } from 'commander'
import chalk from 'chalk'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ExtractionManifest, VisualExtractionResult, TypographyExtractionResult, LayoutExtractionResult } from '../types/extraction.js'
import type { TokenOutputFormat } from '../types/tokens.js'
import { generateDesignTokens, formatTokens } from '../generators/design-tokens.js'

const ALL_FORMATS: TokenOutputFormat[] = ['json', 'css', 'tailwind', 'scss']

const FORMAT_EXTENSIONS: Record<TokenOutputFormat, string> = {
  json: 'tokens.json',
  css: 'tokens.css',
  tailwind: 'tokens.tailwind.ts',
  scss: 'tokens.scss',
}

export function createTokensCommand(): Command {
  return new Command('tokens')
    .description('Generate design tokens from extraction data')
    .argument('<dir>', 'Path to extraction output directory')
    .option('--format <type>', 'Output format: json, css, tailwind, scss, all', 'all')
    .option('-o, --output <dir>', 'Output directory (default: same as extraction dir)')
    .action(async (dir: string, options: Record<string, unknown>) => {
      // 1. Read manifest.json
      const manifestPath = join(dir, 'manifest.json')
      let manifest: ExtractionManifest
      try {
        const raw = await readFile(manifestPath, 'utf-8')
        manifest = JSON.parse(raw) as ExtractionManifest
      } catch {
        console.error(
          chalk.red(`No extraction data found in ${dir}. Run \`designmaxxing extract <url>\` first.`),
        )
        process.exit(1)
      }

      // 2. Resolve file paths from manifest results
      const outputDir = (options.output as string | undefined) ?? dir

      function resolveResultPath(key: string): string | null {
        const filename = manifest.results[key]
        if (!filename) return null
        return join(manifest.outputDir, filename)
      }

      const visualPath = resolveResultPath('visual')
      const typographyPath = resolveResultPath('typography')

      const missing: string[] = []
      if (!visualPath) missing.push('visual.json')
      if (!typographyPath) missing.push('typography.json')

      if (missing.length > 0) {
        console.error(chalk.red(`Missing required extraction files: ${missing.join(', ')}`))
        console.error(chalk.gray(`Re-run: designmaxxing extract <url> --modules visual,typography`))
        process.exit(1)
      }

      // 3. Read required files
      let visual: VisualExtractionResult
      let typography: TypographyExtractionResult

      try {
        visual = JSON.parse(await readFile(visualPath!, 'utf-8')) as VisualExtractionResult
      } catch {
        console.error(chalk.red(`Could not read visual extraction data from: ${visualPath}`))
        process.exit(1)
      }

      try {
        typography = JSON.parse(await readFile(typographyPath!, 'utf-8')) as TypographyExtractionResult
      } catch {
        console.error(chalk.red(`Could not read typography extraction data from: ${typographyPath}`))
        process.exit(1)
      }

      // 4. Optionally read layout
      let layout: LayoutExtractionResult | undefined
      const layoutPath = resolveResultPath('layout')
      if (layoutPath) {
        try {
          layout = JSON.parse(await readFile(layoutPath, 'utf-8')) as LayoutExtractionResult
        } catch {
          // Layout is optional — skip silently
        }
      }

      // 5. Generate tokens
      const tokens = generateDesignTokens(visual!, typography!, layout)

      // 6. Determine formats to write
      const formatOption = options.format as string
      const formats: TokenOutputFormat[] =
        formatOption === 'all'
          ? ALL_FORMATS
          : (formatOption.split(',').map(f => f.trim()) as TokenOutputFormat[])

      // 7. Write output files
      const written: string[] = []
      for (const fmt of formats) {
        const content = formatTokens(tokens, fmt)
        const filename = FORMAT_EXTENSIONS[fmt]
        const outPath = join(outputDir, filename)
        await writeFile(outPath, content, 'utf-8')
        written.push(outPath)
      }

      // 8. Print summary
      console.log(chalk.cyan('\n✦ designmaxxing') + chalk.gray(' — tokens generated'))
      console.log(chalk.gray(`\nSource: ${dir}`))
      console.log(chalk.gray('Output files:'))
      for (const p of written) {
        console.log(chalk.white(`  ${p}`))
      }

      const colorCount = Object.keys(tokens.colors).length
      const typographyCount = Object.keys(tokens.typography).length
      const spacingCount = Object.keys(tokens.spacing).length
      console.log(chalk.gray(`\nTokens extracted:`))
      console.log(chalk.white(`  Colors: ${colorCount}`))
      console.log(chalk.white(`  Typography: ${typographyCount}`))
      console.log(chalk.white(`  Spacing: ${spacingCount}`))
    })
}
