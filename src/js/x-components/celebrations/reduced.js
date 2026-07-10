import { createOverlay, removeAfter } from './utils.js'

export function reducedMotionCelebration() {
  const overlay = createOverlay('x-celebrate-overlay x-celebrate-overlay--dim')

  const message = document.createElement('span')
  message.className = 'x-celebrate-reduced'
  message.textContent = '✓ Goed!'
  message.setAttribute('aria-hidden', 'true')
  overlay.appendChild(message)

  removeAfter(overlay, 900)
}
