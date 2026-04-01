import { z } from 'zod'

export const ExtractionModules = [
  'visual',
  'typography',
  'layout',
  'components',
  'assets',
  'animations',
  'behavior',
  'framework',
  'network',
] as const

export type ExtractionModule = typeof ExtractionModules[number]

export const ConfigSchema = z.object({
  url: z.string().url(),
  modules: z.array(z.enum(ExtractionModules)).default([...ExtractionModules]),
  breakpoints: z.array(z.number().int().positive()).default([375, 768, 1024, 1280, 1536]),
  output: z.string().default('./designmaxxing-output'),
  selector: z.string().optional(),
  fullPage: z.boolean().default(true),
  headless: z.boolean().default(true),
  timeout: z.number().int().positive().default(30000),
  authCookies: z.string().optional(),
  waitForSelector: z.string().optional(),
  userAgent: z.string().optional(),
  viewport: z.object({
    width: z.number().default(1280),
    height: z.number().default(800),
  }).default({}),
})

export type ExtractionConfig = z.infer<typeof ConfigSchema>

export const VerifyConfigSchema = z.object({
  originalUrl: z.string().url(),
  rebuildUrl: z.string().url(),
  breakpoints: z.array(z.number().int().positive()).default([375, 768, 1024, 1280, 1536]),
  threshold: z.number().min(0).max(1).default(0.02),
  output: z.string().default('./designmaxxing-verify'),
})

export type VerifyConfig = z.infer<typeof VerifyConfigSchema>
