import '../css/main.css'
import { sitePath } from './site-path.js'

const MENU_SVG = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>`

/**
 * Wraps [data-page-content] in the shared app shell (sidebar + topbar).
 * Pages only need their unique <main> content inside data-page-content.
 */
export function mountLayout() {
  const icon = document.querySelector('link[rel="icon"]')
  if (icon) icon.href = sitePath('/favicon.svg')

  const contentEl = document.querySelector('[data-page-content]')
  if (!contentEl || document.querySelector('[data-app-shell]')) return

  const content = contentEl.innerHTML.trim()
  contentEl.remove()

  const shell = document.createElement('div')
  shell.className = 'app-shell'
  shell.dataset.appShell = ''
  shell.innerHTML = `
    <div data-nav-overlay class="nav-overlay"></div>
    <aside data-sidebar class="sidebar-panel">
      <nav data-module-nav></nav>
    </aside>
    <div class="md:pl-60">
      <header class="topbar">
        <div class="flex items-center gap-4 px-4 py-3 md:px-8">
          <button data-nav-toggle type="button" class="p-2 text-zinc-600 transition hover:text-zinc-900 md:hidden" aria-label="Menu openen">
            ${MENU_SVG}
          </button>
          <div data-breadcrumbs></div>
        </div>
      </header>
      ${content}
    </div>
  `

  document.body.insertBefore(shell, document.body.firstChild)
}
