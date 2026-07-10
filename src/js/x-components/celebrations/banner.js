import { createOverlay, removeAfter } from './utils.js'

export function goedBanner() {
  const overlay = createOverlay('x-celebrate-overlay')

  const banner = document.createElement('div')
  banner.className = 'x-celebrate-banner'
  banner.setAttribute('aria-hidden', 'true')
  banner.textContent = 'Goed gedaan!'
  overlay.appendChild(banner)

  removeAfter(overlay, 1600)
}
