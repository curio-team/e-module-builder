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



  const weekLinks = (week) => week.pages

    .filter((p) => p.key !== 'oefening')

    .map((p) => `<a href="${sitePath(p.href)}" class="text-link">${p.label}</a>`)

    .join('\n                  ')



  curriculumEl.innerHTML = manifest.weeks

    .map(

      (w) => `

              <div class="card-interactive bg-white">

                <span class="week-label">Week ${String(w.week).padStart(2, '0')}</span>

                <h3 class="text-lg font-medium text-zinc-900">${w.title}</h3>

                <p class="mt-2 text-sm leading-relaxed text-zinc-500">${w.summary}</p>

                <div class="mt-6 flex flex-wrap gap-5">

                  ${weekLinks(w)}

                </div>

              </div>`

    )

    .join('\n')

}


