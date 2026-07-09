import manifest from '../data/manifest.json'
import { sitePath } from './site-path.js'

export function initHome() {
  const mod = manifest.module
  const contentStatus = manifest.content?.status || 'empty'
  const isReady = contentStatus === 'generated'
  const titleEl = document.querySelector('[data-home-title]')
  const descEl = document.querySelector('[data-home-description]')
  const labelEl = document.querySelector('[data-home-label]')
  const setupEl = document.querySelector('[data-home-setup]')
  const readyEl = document.querySelector('[data-home-ready]')
  const curriculumEl = document.querySelector('[data-home-curriculum]')

  if (labelEl) labelEl.textContent = mod.subtitle
  if (titleEl) titleEl.textContent = mod.name
  if (descEl) descEl.innerHTML = mod.description

  if (setupEl) setupEl.classList.toggle('hidden', isReady)
  if (readyEl) readyEl.classList.toggle('hidden', !isReady)
  if (!isReady || !curriculumEl) return

  const sectionLinks = (section) => section.pages
    .filter((p) => p.key !== 'oefening')
    .map((p) => `<a href="${sitePath(p.href)}" class="text-link">${p.label}</a>`)
    .join('\n                  ')

  curriculumEl.innerHTML = manifest.curriculum
    .map(
      (sec) => `
              <div class="card-interactive bg-white">
                <span class="week-label">${sec.label}</span>
                <h3 class="text-lg font-medium text-ink">${sec.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-muted">${sec.summary}</p>
                <div class="mt-6 flex flex-wrap gap-5">
                  ${sectionLinks(sec)}
                </div>
              </div>`
    )
    .join('\n')
}


