/**
 * Resolve root-absolute paths (/pages/…) to URLs that work in dev, preview, and static dist.
 */
export function sitePath(href) {
  if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
    return href
  }

  const path = href.startsWith('/') ? href.slice(1) : href
  const loc = decodeURIComponent(window.location.pathname).replace(/\\/g, '/')
  const inPages = /\/pages\/[^/]+\.html$/i.test(loc)

  if (!inPages) return path

  if (path === 'index.html') return '../index.html'
  if (path.startsWith('pages/')) return path.slice('pages/'.length)
  return `../${path}`
}
