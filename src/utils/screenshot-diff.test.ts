import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import { compareScreenshots } from './screenshot-diff.js'

function makePNG(width: number, height: number, fill: [number, number, number, number]): Buffer {
  const png = new PNG({ width, height })
  for (let i = 0; i < width * height * 4; i += 4) {
    png.data[i] = fill[0]
    png.data[i + 1] = fill[1]
    png.data[i + 2] = fill[2]
    png.data[i + 3] = fill[3]
  }
  return PNG.sync.write(png)
}

describe('compareScreenshots', () => {
  it('returns 0 diff for identical images', async () => {
    const dir = tmpdir()
    const buf = makePNG(10, 10, [255, 0, 0, 255])
    const img1 = join(dir, 'img1-identical.png')
    const img2 = join(dir, 'img2-identical.png')
    const diff = join(dir, 'diff-identical.png')
    await writeFile(img1, buf)
    await writeFile(img2, buf)
    const result = await compareScreenshots(img1, img2, diff, 0.1)
    expect(result.diffPixels).toBe(0)
    expect(result.diffPercent).toBe(0)
  })

  it('returns nonzero diff for different images', async () => {
    const dir = tmpdir()
    const buf1 = makePNG(10, 10, [255, 0, 0, 255])
    const buf2 = makePNG(10, 10, [0, 0, 255, 255])
    const img1 = join(dir, 'img1-different.png')
    const img2 = join(dir, 'img2-different.png')
    const diff = join(dir, 'diff-different.png')
    await writeFile(img1, buf1)
    await writeFile(img2, buf2)
    const result = await compareScreenshots(img1, img2, diff, 0.1)
    expect(result.diffPixels).toBeGreaterThan(0)
    expect(result.totalPixels).toBe(100)
  })

  it('respects threshold: 0 flags near-identical images as different', async () => {
    const dir = tmpdir()
    // Two images differing by a single channel value (255 vs 254) — nearly identical
    const buf1 = makePNG(4, 4, [255, 0, 0, 255])
    const buf2 = makePNG(4, 4, [254, 0, 0, 255])
    const img1 = join(dir, 'thresh-strict-img1.png')
    const img2 = join(dir, 'thresh-strict-img2.png')
    const diff0 = join(dir, 'thresh-strict-diff0.png')
    const diff1 = join(dir, 'thresh-strict-diff1.png')
    await writeFile(img1, buf1)
    await writeFile(img2, buf2)
    const strict = await compareScreenshots(img1, img2, diff0, 0)
    const lenient = await compareScreenshots(img1, img2, diff1, 1.0)
    expect(strict.diffPixels).toBeGreaterThan(0)
    expect(lenient.diffPixels).toBe(0)
  })

  it('crops to min width when images differ in width', async () => {
    const dir = tmpdir()
    const wide = makePNG(20, 10, [255, 0, 0, 255])
    const narrow = makePNG(10, 10, [255, 0, 0, 255])
    const img1 = join(dir, 'wide-img.png')
    const img2 = join(dir, 'narrow-img.png')
    const diff = join(dir, 'diff-width-mismatch.png')
    await writeFile(img1, wide)
    await writeFile(img2, narrow)
    const result = await compareScreenshots(img1, img2, diff, 0.1)
    expect(result.totalPixels).toBe(100) // 10×10
    expect(result.diffPixels).toBe(0)    // same color in overlap
  })

  it('crops to min height when images differ in height', async () => {
    const dir = tmpdir()
    const tall = makePNG(10, 20, [0, 255, 0, 255])
    const short = makePNG(10, 10, [0, 255, 0, 255])
    const img1 = join(dir, 'tall-img.png')
    const img2 = join(dir, 'short-img.png')
    const diff = join(dir, 'diff-height-mismatch.png')
    await writeFile(img1, tall)
    await writeFile(img2, short)
    const result = await compareScreenshots(img1, img2, diff, 0.1)
    expect(result.totalPixels).toBe(100) // 10×10
    expect(result.diffPixels).toBe(0)
  })

  it('totalPixels always equals width × height', async () => {
    const dir = tmpdir()
    const buf1 = makePNG(8, 6, [100, 100, 100, 255])
    const buf2 = makePNG(8, 6, [100, 100, 100, 255])
    const img1 = join(dir, 'tp-img1.png')
    const img2 = join(dir, 'tp-img2.png')
    const diff = join(dir, 'tp-diff.png')
    await writeFile(img1, buf1)
    await writeFile(img2, buf2)
    const result = await compareScreenshots(img1, img2, diff, 0.1)
    expect(result.totalPixels).toBe(8 * 6)
  })
})
