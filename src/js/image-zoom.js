const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`

let overlay = null
let lastFocus = null

function isResized(img) {
  if (!img.complete || !img.naturalWidth) return false
  return Math.abs(img.clientWidth - img.naturalWidth) > 1
}

function closeLightbox() {
  if (!overlay) return
  overlay.remove()
  overlay = null
  document.removeEventListener('keydown', onKeydown, true)
  document.body.classList.remove('image-lightbox-open')
  lastFocus?.focus?.()
  lastFocus = null
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeLightbox()
  }
}

function openLightbox(img) {
  if (overlay) return
  lastFocus = document.activeElement

  overlay = document.createElement('div')
  overlay.className = 'image-lightbox'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', img.alt || 'Afbeelding')

  const full = document.createElement('img')
  full.src = img.currentSrc || img.src
  full.alt = img.alt

  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'image-lightbox-close'
  close.setAttribute('aria-label', 'Sluiten')
  close.innerHTML = CLOSE_ICON
  close.addEventListener('click', closeLightbox)

  overlay.addEventListener('click', (e) => {
    if (e.target !== full) closeLightbox()
  })

  overlay.append(full, close)
  document.body.appendChild(overlay)
  document.body.classList.add('image-lightbox-open')
  document.addEventListener('keydown', onKeydown, true)
  close.focus()
}

/** Make images that are displayed at a non-original size clickable to view full screen. */
export function initImageZoom(container) {
  if (!container) return

  const update = (img) => img.classList.toggle('image-zoomable', isResized(img))
  const images = [...container.querySelectorAll('img')]

  for (const img of images) {
    if (img.complete) update(img)
    img.addEventListener('load', () => update(img))
  }

  // Layout changes (viewport resize) can change whether an image is scaled.
  let frame = 0
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => images.forEach(update))
  })

  container.addEventListener('click', (e) => {
    const img = e.target.closest?.('img.image-zoomable')
    if (!img || !container.contains(img)) return
    e.preventDefault()
    openLightbox(img)
  })
}
