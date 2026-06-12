import { mountLayout } from './layout.js'
import manifest from '../data/manifest.json'
import { sitePath } from './site-path.js'

function buildNavItems() {
  const items = [{ href: manifest.nav.home.href, label: manifest.nav.home.label }]

  for (const week of manifest.nav.weeks) {
    items.push({
      label: week.label,
      title: week.title,
      children: week.children,
    })
  }

  for (const page of manifest.nav.examPages) {
    items.push(page)
  }

  return items
}

const NAV_ITEMS = buildNavItems()

function isActive(href) {
  const path = window.location.pathname.replace(/\/$/, '')
  const target = href.replace(/\/$/, '')
  if (target.endsWith('index.html') || target === '/index.html') {
    return path.endsWith('/') || path.endsWith('/index.html') || path === ''
  }
  return path.endsWith(target) || path.includes(target)
}

function renderNavLink(item, nested = false) {
  const active = isActive(item.href)
  const base = nested
    ? 'block px-3 py-2 text-[13px] transition'
    : 'block px-3 py-2.5 text-[13px] font-medium transition'
  const classes = active
    ? `${base} text-white`
    : `${base} text-zinc-300 hover:text-white`

  const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : ''
  return `<a href="${sitePath(item.href)}" class="${classes}"${external}>${item.label}</a>`
}

function renderCrashCourseLink() {
  const url = manifest.module.youtube
  if (!url) return ''

  return `
    <a
      href="${url}"
      class="nav-cta"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg class="h-4 w-4 shrink-0 text-zinc-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
      </svg>
      Crash Course
    </a>
  `
}

function renderNavGroup(group) {
  const childLinks = group.children.map((c) => renderNavLink(c, true)).join('')
  const title = group.title
    ? `<p class="mt-0.5 text-[10px] font-normal leading-snug text-zinc-500">${group.title}</p>`
    : ''
  return `
    <div class="space-y-0.5">
      <div class="px-3 pb-1 pt-4">
        <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">${group.label}</p>
        ${title}
      </div>
      ${childLinks}
    </div>
  `
}

export function getManifest() {
  return manifest
}

export function initNav() {
  const navEl = document.querySelector('[data-module-nav]')
  if (!navEl) return

  const mod = manifest.module
  const parts = []
  for (const item of NAV_ITEMS) {
    if (item.label === 'Week 1' && mod.youtube) {
      parts.push(renderCrashCourseLink())
    }
    parts.push(item.children ? renderNavGroup(item) : renderNavLink(item))
  }
  const links = parts.join('')

  navEl.innerHTML = `
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="shrink-0 border-b border-zinc-800 px-5 py-5">
        <a href="${sitePath('/index.html')}" class="flex flex-col items-center text-center">
          <img src="${sitePath('/logo.svg')}" alt="${mod.logoAlt}" class="sidebar-logo" width="155" height="91" />
          <p class="mt-2.5 text-[11px] uppercase tracking-[0.15em] text-zinc-400">${mod.name} — ${mod.subtitle}</p>
        </a>
      </div>
      <div class="sidebar-scroll space-y-1">${links}</div>
    </div>
  `
}

export function initMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]')
  const sidebar = document.querySelector('[data-sidebar]')
  const overlay = document.querySelector('[data-nav-overlay]')

  if (!toggle || !sidebar) return

  const close = () => {
    sidebar.classList.add('-translate-x-full')
    overlay?.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
  }

  const open = () => {
    sidebar.classList.remove('-translate-x-full')
    overlay?.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
  }

  toggle.addEventListener('click', () => {
    if (sidebar.classList.contains('-translate-x-full')) open()
    else close()
  })

  overlay?.addEventListener('click', close)
  sidebar.querySelectorAll('a').forEach((a) => a.addEventListener('click', close))
}

export function renderBreadcrumbs(crumbs) {
  const el = document.querySelector('[data-breadcrumbs]')
  if (!el || !crumbs?.length) return

  el.innerHTML = crumbs
    .map((c, i) => {
      const isLast = i === crumbs.length - 1
      const content = c.href && !isLast
        ? `<a href="${sitePath(c.href)}" class="text-zinc-500 transition hover:text-zinc-900">${c.label}</a>`
        : `<span class="text-zinc-900">${c.label}</span>`
      const sep = i < crumbs.length - 1 ? '<span class="text-zinc-300">/</span>' : ''
      return `${content}${sep}`
    })
    .join(' ')
}

export function initPage({ breadcrumbs } = {}) {
  mountLayout()
  initNav()
  initMobileNav()
  renderBreadcrumbs(breadcrumbs)
}
