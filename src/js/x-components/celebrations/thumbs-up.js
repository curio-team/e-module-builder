import { createOverlay, removeAfter } from './utils.js'

export function thumbsUp() {
  const overlay = createOverlay('x-celebrate-overlay x-celebrate-overlay--dim x-celebrate-overlay--center')

  const icon = document.createElement('span')
  icon.className = 'x-celebrate-thumbs'
  icon.textContent = '👍'
  icon.setAttribute('aria-hidden', 'true')
  overlay.appendChild(icon)

  removeAfter(overlay, 1400)
}
