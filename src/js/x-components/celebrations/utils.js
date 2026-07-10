export function getAnchorCenter(anchor) {
  const rect = anchor?.getBoundingClientRect?.()
  return {
    x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
    y: rect ? rect.top + rect.height / 2 : window.innerHeight / 3,
    rect,
  }
}

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

export function removeAfter(el, ms) {
  window.setTimeout(() => el.remove(), ms)
}

export function createOverlay(className) {
  const overlay = document.createElement('div')
  overlay.className = className
  overlay.setAttribute('aria-hidden', 'true')
  document.body.appendChild(overlay)
  return overlay
}
