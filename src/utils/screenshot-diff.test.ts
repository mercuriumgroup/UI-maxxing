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
})
