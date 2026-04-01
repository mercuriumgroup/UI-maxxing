# Phase 5: Tests, Fixtures, Documentation & Polish

**Model**: Sonnet
**Branch**: `feat/tests-polish`
**Estimated time**: 45–60 minutes
**Dependencies**: All previous phases must be merged to main

## Objective

Add comprehensive tests, create test fixtures, write documentation, and polish the package for publication. After this phase, the package is ready for `npm publish`.

## Pre-flight

```bash
git checkout main && git pull
git checkout -b feat/tests-polish
npm install
```

---

## Step 0: Fix Known Bugs (before tests)

These are real bugs found during Phase 4 review. Fix them first so tests can validate correct behaviour.

### Bug 1 — `compareScreenshots` ignores `threshold` parameter

**File**: `src/utils/screenshot-diff.ts:50`
**Problem**: `threshold` is accepted as a parameter but hardcoded to `0.1` in the pixelmatch call.
**Fix**: Replace `threshold: 0.1` with `threshold`.

```typescript
// Before (line 49-52)
const diffPixels = pixelmatch(data1, data2, diff.data, width, height, {
  threshold: 0.1,
  includeAA: false,
})

// After
const diffPixels = pixelmatch(data1, data2, diff.data, width, height, {
  threshold,
  includeAA: false,
})
```

---

## Step 1: HIGH Priority Unit Tests (12 cases)

These cover logic that is untested or where a known bug was just fixed.

### 1a — `escapeHtml` (report.ts)

`escapeHtml` is a private function but fully exercisable via `generateReport`. Add to `src/generators/report.test.ts`:

```typescript
it('escapes HTML special characters in URL', () => {
  const result = generateReport(
    { url: '<script>alert(1)</script>', timestamp: '2024-01-01' },
    { colors: [], shadows: [], borderRadii: [], spacing: [] },
    { scale: [], fontFaces: [] },
    undefined, undefined, undefined, undefined, undefined, undefined,
    { frameworks: [] },
  )
  expect(result).toContain('&lt;script&gt;')
  expect(result).not.toContain('<script>')
})

it('escapes all five HTML characters: & < > " \'', () => {
  // Each must survive a round-trip through escapeHtml
  // Test via a color token value that contains them
  // (build a minimal extraction with a crafted color hex that triggers each)
  const result = generateReport(
    { url: 'a&b "c" \'d\' <e>', timestamp: '' },
    { colors: [], shadows: [], borderRadii: [], spacing: [] },
    { scale: [], fontFaces: [] },
  )
  expect(result).toContain('a&amp;b')
  expect(result).toContain('&quot;c&quot;')
  expect(result).toContain('&#39;d&#39;')
  expect(result).toContain('&lt;e&gt;')
})
```

> Note: Check the actual `generateReport` signature in `src/generators/report.ts` and use
> the minimal factory that builds the required extraction shapes. Use `makeVisual()` /
> `makeTypography()` helper pattern from existing tests if possible.

### 1b — `compareScreenshots` threshold (screenshot-diff.test.ts)

After applying the Bug 1 fix, verify threshold is forwarded:

```typescript
it('respects threshold: 0 flags any pixel difference as a diff', async () => {
  // Use two images that differ only slightly (e.g., one pixel is #FF0000 vs #FF0100)
  // With threshold=0 this should register as a diff; with threshold=1.0 it should not
  const dir = tmpdir()
  const buf1 = makePNG(4, 4, [255, 0, 0, 255])
  const buf2 = makePNG(4, 4, [255, 1, 0, 255])  // nearly identical
  const img1 = join(dir, 'thresh-img1.png')
  const img2 = join(dir, 'thresh-img2.png')
  const diff0 = join(dir, 'thresh-diff0.png')
  const diff1 = join(dir, 'thresh-diff1.png')
  await writeFile(img1, buf1)
  await writeFile(img2, buf2)
  const strict = await compareScreenshots(img1, img2, diff0, 0)
  const lenient = await compareScreenshots(img1, img2, diff1, 1.0)
  expect(strict.diffPixels).toBeGreaterThan(0)
  expect(lenient.diffPixels).toBe(0)
})
```

### 1c — `cropImageData` via size-mismatched images (screenshot-diff.test.ts)

```typescript
it('handles images with different widths (crops to min)', async () => {
  const dir = tmpdir()
  const wide = makePNG(20, 10, [255, 0, 0, 255])
  const narrow = makePNG(10, 10, [255, 0, 0, 255])
  const img1 = join(dir, 'wide.png')
  const img2 = join(dir, 'narrow.png')
  const diff = join(dir, 'diff-mismatch.png')
  await writeFile(img1, wide)
  await writeFile(img2, narrow)
  const result = await compareScreenshots(img1, img2, diff, 0.1)
  expect(result.totalPixels).toBe(100)   // 10 × 10, cropped
  expect(result.diffPixels).toBe(0)      // same color in overlap region
})

it('handles images with different heights (crops to min)', async () => {
  const dir = tmpdir()
  const tall = makePNG(10, 20, [0, 255, 0, 255])
  const short = makePNG(10, 10, [0, 255, 0, 255])
  const img1 = join(dir, 'tall.png')
  const img2 = join(dir, 'short.png')
  const diff = join(dir, 'diff-height.png')
  await writeFile(img1, tall)
  await writeFile(img2, short)
  const result = await compareScreenshots(img1, img2, diff, 0.1)
  expect(result.totalPixels).toBe(100)   // 10 × 10, cropped
  expect(result.diffPixels).toBe(0)
})
```

### 1d — Font size name collision suffix (design-tokens.test.ts)

The dedup loop (lines 181–187) appends `-2`, `-3`, etc. when `closestSizeName` returns the same bucket for multiple sizes. This is never triggered in existing tests.

```typescript
it('deduplicates font size token names with numeric suffix', () => {
  // Two sizes that both map to the same closestSizeName bucket
  // e.g. 13px and 14px may both return 'sm' depending on thresholds
  // Use values that DEFINITELY collide: two sizes that are both <= 12px
  const visual = makeVisual()
  const typography = makeTypography([
    makeScaleEntry({ fontSize: '11px', usageCount: 5 }),
    makeScaleEntry({ fontSize: '10px', usageCount: 3 }),
    makeScaleEntry({ fontSize: '9px',  usageCount: 2 }),
  ])
  const tokens = generateDesignTokens(visual, typography)
  const names = Object.keys(tokens.typography)
  // All three sizes must have unique names
  expect(new Set(names).size).toBe(names.length)
  // At least one must end in -2 or -3
  expect(names.some(n => /\-\d+$/.test(n))).toBe(true)
})
```

> Identify the `closestSizeName` thresholds in `src/generators/design-tokens.ts:107` first,
> then pick sizes that collide in the same bucket.

### 1e — Border radius threshold boundaries (design-tokens.test.ts)

The `normalizeBorderRadiusName` function has thresholds at 0, 2, 4, 6, 12, 9999px and 50%. Test each boundary:

```typescript
it('names border radii at threshold boundaries', () => {
  const cases: [string, string][] = [
    ['0px',     'rounded-none'],
    ['0',       'rounded-none'],
    ['2px',     'rounded-sm'],    // ≤ 2
    ['3px',     'rounded'],       // ≤ 4 but > 2
    ['4px',     'rounded'],       // ≤ 4
    ['6px',     'rounded-md'],    // ≤ 6 but > 4
    ['12px',    'rounded-lg'],    // ≤ 12 but > 6
    ['13px',    'rounded-1'],     // > 12, index 0 → rounded-1
    ['9999px',  'rounded-full'],  // ≥ 9999
    ['50%',     'rounded-full'],
  ]
  for (const [input, expected] of cases) {
    const visual = makeVisual({ borderRadii: [input] })
    const tokens = generateDesignTokens(visual, makeTypography())
    expect(Object.keys(tokens.borderRadius)[0]).toBe(expected)
  }
})
```

### 1f — Layout depth limit guard (layout-blueprint.test.ts)

`entryToNode` stops recursing at depth > 10 by returning `children: []`. Not tested.

```typescript
it('truncates children beyond depth 10', () => {
  // Build 12-deep nested structure
  function nest(depth: number): LayoutEntry {
    return makeEntry({
      selector: `.d${depth}`,
      display: 'flex',
      children: depth < 12 ? [nest(depth + 1)] : [],
    })
  }
  const input: LayoutExtractionResult = {
    containers: [nest(0)],
    breakpoints: [],
    rootMaxWidth: null,
  }
  const result = generateLayoutBlueprint(input)
  // Walk tree to depth 10 — node at depth 11 must have no children
  let node = result.tree[0]
  for (let i = 0; i < 10; i++) {
    expect(node.children.length).toBeGreaterThan(0)
    node = node.children[0]
  }
  // node is now at depth 10 — its children were truncated
  expect(node.children).toHaveLength(0)
})
```

---

## Step 2: MEDIUM Priority Tests (18 cases)

Cover edge cases across generators and CLI.

### 2a — `generateReport` edge cases

- Empty arrays for all extraction fields (no crashes)
- Typography tokens with missing / empty fontFamily
- Screenshot section omitted when no breakpoints provided
- Framework section omitted when `frameworks: []`

### 2b — `generateDesignTokens` edge cases

- Empty visual / typography inputs produce valid empty-object tokens
- Color token name collisions deduplicated (`color-1`, `color-2`)
- Shadow count > SHADOW_NAMES length falls back to `shadow-N`
- Border radius: duplicate raw values deduplicated before naming
- `buildSpacingTokens` returns `{}` (spacing is not yet implemented — verify it stays that way without error)

### 2c — `generateComponentInventory` edge cases

- Components with no variants return empty `variants: []`
- Components with no states return empty `states: []`
- Selector deduplication when the same selector appears twice

### 2d — CLI `tokens` command edge cases

- `--format css` output includes `--` prefix on every variable
- `--format tailwind` output wraps in valid TypeScript `export default`
- `--format scss` output starts with `$`
- Unknown `--format` value produces a useful error message (not a crash)

### 2e — `generateLayoutBlueprint` edge cases

- Breakpoint with `minWidth: null` uses `entry.query` as name
- `rootMaxWidth` is null when no containers have a maxWidth
- ASCII art does not include trailing whitespace on any line

---

## Step 3: LOW Priority Tests (7 cases)

Less critical, but rounds out coverage.

### 3a — `report.ts` — token section ordering

- Colors section appears before Typography section in HTML output
- Typography section appears before Breakpoints section

### 3b — `compareScreenshots` — totalPixels math

- `totalPixels` always equals `width × height` even with cropped images

### 3c — `generateDesignTokens` — `toScss` output

- Every line in SCSS output that is a variable starts with `$`
- CSS output lines with values containing spaces are quoted correctly

### 3d — `generateComponentInventory` — empty input

- `generateComponentInventory([])` returns `{ components: [], summary: ... }` without error

---

## Step 4: Test Fixture HTML Page

Create `tests/fixtures/test-page.html` — a static HTML page with KNOWN, exact CSS values that tests can assert against. (Content unchanged from original plan — see fixture definition in Step 1 of the original plan.)

---

## Step 5: Integration Tests — Extractors

Create `tests/extractors/visual.test.ts` using the fixture. (Content unchanged from original plan Step 3.)

---

## Step 6: Integration Test — Full Pipeline

Create `tests/e2e/pipeline.test.ts`. (Content unchanged from original plan Step 5.)

---

## Step 7: README.md

Write a comprehensive README. (Content unchanged from original plan Step 6.)

---

## Step 8: Example Config File

Create `.designmaxxingrc.example`. (Content unchanged from original plan Step 7.)

---

## Step 9: Polish

- Ensure `package.json` `bin` field points to correct path
- Ensure `package.json` `files` includes all necessary dirs
- Add `LICENSE` file (MIT)
- Add `#!/usr/bin/env node` to CLI entry point
- Ensure `prepublishOnly` script works: `npm run build && npm run test`
- Run `npm pack --dry-run` to verify published contents

---

## Step 10: Verify & Commit

```bash
npm run build
npm run test
npm pack --dry-run  # verify package contents
```

```bash
git add -A
git commit -m "feat: tests, fixtures, README, config example — package ready for publish"
git push -u origin feat/tests-polish
```

---

## Completion Criteria

- [ ] Bug 1 fixed: `compareScreenshots` uses `threshold` param (not hardcoded 0.1)
- [ ] All 12 HIGH priority cases covered (escapeHtml, cropImageData, threshold, font dedup, border radius boundaries, depth limit)
- [ ] All 18 MEDIUM priority cases covered
- [ ] All 7 LOW priority cases covered
- [ ] Test fixture page has all known values documented in comments
- [ ] Integration tests verify each extractor against the fixture
- [ ] Pipeline E2E test runs full extraction and verifies output
- [ ] All tests pass: `npm run test`
- [ ] README is comprehensive with all sections
- [ ] Example config file provided
- [ ] LICENSE file exists
- [ ] `npm pack --dry-run` shows correct package contents
- [ ] `npm run build && npm run test` passes (prepublishOnly)
- [ ] 80%+ test coverage on utilities and generators

---

## Implementation Order

1. **Step 0** — fix the threshold bug first (unblocks Step 1b)
2. **Steps 1a–1f** — HIGH priority unit tests (colocated in existing `.test.ts` files)
3. **Steps 2a–2e** — MEDIUM priority unit tests
4. **Steps 3a–3d** — LOW priority unit tests
5. Verify all 67 + new tests pass
6. **Step 4** — create fixture
7. **Steps 5–6** — integration + E2E tests (require Playwright, may be slow)
8. **Steps 7–9** — documentation + polish
9. **Step 10** — final verify + commit
