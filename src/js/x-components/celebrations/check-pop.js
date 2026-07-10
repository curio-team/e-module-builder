import { createOverlay, getAnchorCenter, removeAfter } from './utils.js'

export function checkPop(anchor) {
  const { rect } = getAnchorCenter(anchor)
  const overlay = createOverlay('x-celebrate-overlay')

  if (rect) {
    const hub = document.createElement('div')
    hub.className = 'x-celebrate-check-hub'
    hub.setAttribute('aria-hidden', 'true')
    hub.style.left = `${rect.left}px`
    hub.style.top = `${rect.top}px`
    hub.style.width = `${rect.width}px`
    hub.style.height = `${rect.height}px`

    const ring = document.createElement('span')
    ring.className = 'x-celebrate-ring'
    hub.appendChild(ring)

    const check = document.createElement('span')
    check.className = 'x-celebrate-check'
    check.textContent = '✓'
    hub.appendChild(check)

    overlay.appendChild(hub)
  }

  removeAfter(overlay, 1400)
}
