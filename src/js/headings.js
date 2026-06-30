function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function makeCopyButton(id) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'heading-copy-link'
  btn.setAttribute('aria-label', 'Kopieer link')
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
  btn.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#${id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback: select a temporary input
      const inp = document.createElement('input')
      inp.value = url
      document.body.appendChild(inp)
      inp.select()
      document.execCommand('copy')
      document.body.removeChild(inp)
    }
    btn.classList.add('copied')
    setTimeout(() => btn.classList.remove('copied'), 2000)
  })
  return btn
}

export function initHeadings(container) {
  if (!container) return

  const headings = [...container.querySelectorAll('h2, h3')]
  if (!headings.length) return

  const usedIds = new Set()

  for (const h of headings) {
    let base = slugify(h.textContent.trim())
    if (!base) base = 'heading'
    let id = base
    let n = 2
    while (usedIds.has(id)) id = `${base}-${n++}`
    usedIds.add(id)
    h.id = id
    h.appendChild(makeCopyButton(id))
  }

  let ticking = false
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      let active = null
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= 56) active = h
      }
      const hash = active ? `#${active.id}` : ''
      if (location.hash !== hash) {
        history.replaceState(null, '', hash || location.pathname + location.search)
      }
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  if (location.hash) {
    try {
      const target = container.querySelector(location.hash)
      target?.scrollIntoView({ behavior: 'instant', block: 'start' })
    } catch {
      // invalid selector — ignore
    }
  }
}
