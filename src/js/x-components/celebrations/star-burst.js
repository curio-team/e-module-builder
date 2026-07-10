import { createOverlay, getAnchorCenter, removeAfter } from './utils.js'

const STARS = ['⭐', '✨', '🌟', '💫']

export function starBurst(anchor) {
  const { x, y } = getAnchorCenter(anchor)
  const overlay = createOverlay('x-celebrate-overlay')

  const count = 8 + Math.floor(Math.random() * 5)
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span')
    star.className = 'x-celebrate-star'
    star.textContent = STARS[i % STARS.length]
    star.setAttribute('aria-hidden', 'true')

    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
    const distance = 80 + Math.random() * 60
    star.style.left = `${x}px`
    star.style.top = `${y}px`
    star.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`)
    star.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`)
    star.style.animationDelay = `${Math.random() * 80}ms`

    overlay.appendChild(star)
  }

  removeAfter(overlay, 1300)
}
