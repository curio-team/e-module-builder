import { getAnchorCenter } from './utils.js'

export function confetti(anchor) {
  const canvas = document.createElement('canvas')
  canvas.className = 'x-confetti-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`
  ctx.scale(dpr, dpr)

  const { x: originX, y: originY } = getAnchorCenter(anchor)

  const colors = ['#FF6D6D', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899']
  const particles = Array.from({ length: 100 }, () => ({
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -14 - 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    w: Math.random() * 7 + 4,
    h: Math.random() * 4 + 3,
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 12,
    life: 1,
  }))

  let frame = 0
  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    let alive = false

    for (const p of particles) {
      if (p.life <= 0) continue
      alive = true
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.4
      p.vx *= 0.99
      p.rotation += p.spin
      p.life -= 0.014

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = Math.max(p.life, 0)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }

    frame += 1
    if (alive && frame < 160) requestAnimationFrame(tick)
    else canvas.remove()
  }

  requestAnimationFrame(tick)
}
