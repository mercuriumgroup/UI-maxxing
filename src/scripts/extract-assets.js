function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { assets: [], error: 'Root element not found' }

  const assets = []

  // Images
  const images = root.querySelectorAll('img')
  for (const img of images) {
    try {
      assets.push({
        type: 'image',
        src: img.src || '',
        localPath: null,
        dimensions: img.naturalWidth ? { width: img.naturalWidth, height: img.naturalHeight } : null,
        format: (img.src.match(/\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i) || [])[1] || 'unknown',
        metadata: {
          alt: img.alt || '',
          loading: img.loading || '',
          srcset: img.srcset || '',
          sizes: img.sizes || '',
        },
      })
    } catch (_) {}
  }

  // Picture/source elements
  const pictures = root.querySelectorAll('picture')
  for (const pic of pictures) {
    try {
      const sources = pic.querySelectorAll('source')
      for (const source of sources) {
        assets.push({
          type: 'image',
          src: source.srcset || '',
          localPath: null,
          dimensions: null,
          format: source.type ? source.type.replace('image/', '') : 'unknown',
          metadata: {
            media: source.media || '',
            sizes: source.sizes || '',
            parent: 'picture',
          },
        })
      }
    } catch (_) {}
  }

  // Inline SVGs
  const svgs = root.querySelectorAll('svg')
  for (const svg of svgs) {
    try {
      const viewBox = svg.getAttribute('viewBox') || ''
      const w = svg.getAttribute('width') || ''
      const h = svg.getAttribute('height') || ''
      const paths = svg.querySelectorAll('path')
      const useRefs = svg.querySelectorAll('use')

      assets.push({
        type: 'svg',
        src: '',
        localPath: null,
        dimensions: w && h ? { width: parseFloat(w), height: parseFloat(h) } : null,
        format: 'svg',
        metadata: {
          viewBox,
          pathCount: String(paths.length),
          hasUseRefs: String(useRefs.length > 0),
          innerHTML: svg.innerHTML.slice(0, 1000),
        },
      })

      // Track sprite references
      for (const use of useRefs) {
        const href = use.getAttribute('href') || use.getAttribute('xlink:href') || ''
        if (href) {
          assets.push({
            type: 'icon',
            src: href,
            localPath: null,
            dimensions: null,
            format: 'svg-sprite',
            metadata: { parent: 'use' },
          })
        }
      }
    } catch (_) {}
  }

  // Background images
  const allElements = root.querySelectorAll('*')
  for (const el of allElements) {
    try {
      const bg = getComputedStyle(el).backgroundImage
      if (bg && bg !== 'none') {
        const urls = []
        const urlPattern = /url\(["']?([^"')]+)["']?\)/g
        let match
        while ((match = urlPattern.exec(bg)) !== null) {
          urls.push(match[1])
        }
        for (const url of urls) {
          assets.push({
            type: 'image',
            src: url,
            localPath: null,
            dimensions: null,
            format: (url.match(/\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i) || [])[1] || 'unknown',
            metadata: { source: 'background-image' },
          })
        }
      }
    } catch (_) {}
  }

  return { assets }
}
