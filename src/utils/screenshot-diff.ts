import { readFile, writeFile } from 'node:fs/promises'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

/**
 * Crops raw RGBA pixel data from srcWidth-wide image to a width×height region.
 * Needed because pixelmatch requires buffers of exactly width*height*4 bytes.
 */
function cropImageData(src: Buffer, srcWidth: number, width: number, height: number): Buffer {
  if (srcWidth === width) {
    // No cropping needed in width — just slice the required rows
    return src.subarray(0, width * height * 4)
  }
  const dest = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    src.copy(dest, y * width * 4, y * srcWidth * 4, y * srcWidth * 4 + width * 4)
  }
  return dest
}

export interface DiffResult {
  readonly diffPixels: number
  readonly totalPixels: number
  readonly diffPercent: number
}

export async function compareScreenshots(
  img1Path: string,
  img2Path: string,
  diffPath: string,
  threshold: number,
): Promise<DiffResult> {
  const [buf1, buf2] = await Promise.all([readFile(img1Path), readFile(img2Path)])

  const img1 = PNG.sync.read(buf1)
  const img2 = PNG.sync.read(buf2)

  // Handle size mismatches — crop pixel data to min dimensions
  const width = Math.min(img1.width, img2.width)
  const height = Math.min(img1.height, img2.height)

  const diff = new PNG({ width, height })

  // pixelmatch requires buffers of exactly width*height*4 bytes.
  // If images differ in size, crop each buffer to the target region.
  const data1 = cropImageData(img1.data, img1.width, width, height)
  const data2 = cropImageData(img2.data, img2.width, width, height)

  const diffPixels = pixelmatch(data1, data2, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false,
  })

  await writeFile(diffPath, PNG.sync.write(diff))

  const totalPixels = width * height
  return {
    diffPixels,
    totalPixels,
    diffPercent: diffPixels / totalPixels,
  }
}
