import { sitePath } from '../site-path.js'

const WEEK_RE = /^([a-zA-Z]+)(\d+)$/

const BOOK_SVG = `<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.966 8.966 0 0 0-6 2.292m0-14.25v14.25" /></svg>`

export function parseLinkedTheory(linkedTheory) {
  if (!Array.isArray(linkedTheory) || linkedTheory.length === 0) return []

  return linkedTheory
    .map((entry) => {
      if (typeof entry !== 'string') return null
      const m = entry.trim().match(WEEK_RE)
      if (!m) return null
      const prefix = m[1]
      const num = parseInt(m[2], 10)
      const label = `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)} ${num}`
      return { key: entry.trim(), label, num, dirName: entry.trim() }
    })
    .filter(Boolean)
}

export function theoryIframeSrc(dirName) {
  return sitePath(`/pages/${dirName}-theorie.html`) + '?embedded=1'
}

export function initTheoryPanel(linkedTheory) {
  const toggle = document.querySelector('[data-theory-toggle]')
  const panel = document.querySelector('[data-theory-panel]')

  const tabs = parseLinkedTheory(linkedTheory)

  if (!tabs.length) {
    toggle?.classList.add('hidden')
    panel?.classList.add('panel-hidden')
    return
  }

  toggle?.classList.remove('hidden')

  const tabsEl = panel?.querySelector('[data-theory-tabs]')
  const iframe = panel?.querySelector('[data-theory-iframe]')
  const loader = panel?.querySelector('[data-theory-loader]')

  if (!tabsEl || !iframe || !panel) return

  function showLoader() { loader?.classList.remove('theory-panel-loader-hidden') }
  function hideLoader() { loader?.classList.add('theory-panel-loader-hidden') }

  iframe.addEventListener('load', hideLoader)

  tabsEl.innerHTML = tabs
    .map(
      (t, i) =>
        `<button class="theory-tab${i === 0 ? ' theory-tab-active' : ''}" data-tab="${t.key}" type="button">${t.label}</button>`
    )
    .join('')

  function activateTab(key) {
    tabsEl.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.classList.toggle('theory-tab-active', btn.dataset.tab === key)
    })
    const tab = tabs.find((t) => t.key === key)
    if (tab) {
      showLoader()
      iframe.src = theoryIframeSrc(tab.dirName)
    }
  }

  tabsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]')
    if (btn) activateTab(btn.dataset.tab)
  })

  activateTab(tabs[0].key)

  const closeBtn = panel.querySelector('[data-theory-panel-close]')
  closeBtn?.addEventListener('click', () => {
    panel.classList.add('panel-hidden')
    toggle?.setAttribute('aria-expanded', 'false')
  })

  toggle?.addEventListener('click', () => {
    const isHidden = panel.classList.contains('panel-hidden')
    panel.classList.toggle('panel-hidden', !isHidden)
    toggle.setAttribute('aria-expanded', String(isHidden))
  })

  toggle?.setAttribute('aria-expanded', 'false')

  // Enable the slide transition after the first frame has been committed so
  // the panel doesn't animate from its off-screen position on page load.
  // Double-rAF ensures this works even when initTheoryPanel is called synchronously.
  requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('panel-ready')))
}
