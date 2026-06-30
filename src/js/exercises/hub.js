import { getSolvedExercises } from './exercise-shared.js'
import { sitePath } from '../site-path.js'

const DIFFICULTY = ['', 'Beginner', 'Beginner', 'Gemiddeld', 'Gemiddeld', 'Gevorderd', 'Gevorderd', 'Expert', 'Expert']

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function initExerciseHub(weekData, sectionId) {
  const container = document.querySelector('[data-exercise-list]')
  if (!container) return

  const solved = getSolvedExercises(sectionId)
  const external = weekData.mode === 'external'

  const subtitle = document.querySelector('[data-hub-subtitle]')
  if (subtitle) {
    subtitle.textContent = external
      ? `${weekData.title} — 8 opdrachten voor je eigen omgeving`
      : `${weekData.title} — 8 oefeningen met oplopende moeilijkheid`
  }

  const meetmomentCta = document.querySelector('[data-meetmoment-cta]')
  if (meetmomentCta && meetmomentCta.dataset.meetmomentCta !== 'true') {
    meetmomentCta.remove()
  }

  const items = weekData.exercises
    .map((ex) => {
      const label = DIFFICULTY[ex.difficulty] || 'Beginner'
      const done = solved.includes(ex.id)
      const modeBadge = external
        ? '<span class="badge mt-3">Eigen omgeving</span>'
        : `<span class="badge mt-3">${label}</span>`

      return `
        <a
          href="${sitePath(`/pages/${sectionId}-oefening.html`)}?id=${ex.id}"
          class="group flex items-start gap-5 px-6 py-5 transition hover:bg-zinc-50"
        >
          <span class="mt-0.5 font-mono text-sm text-zinc-300 transition group-hover:text-zinc-900">${String(ex.id).padStart(2, '0')}</span>
          <div class="flex-1">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 class="font-medium text-zinc-900">${ex.title}</h3>
              ${done ? '<span class="badge-done">Voltooid</span>' : ''}
            </div>
            <p class="mt-1.5 text-sm leading-relaxed text-zinc-500">${ex.descriptionInlineHtml ?? ex.description ?? ''}</p>
            ${modeBadge}
          </div>
        </a>
      `
    })
    .join('')

  container.innerHTML = `<div class="card divide-y divide-zinc-100 p-0">${items}</div>`

  const progressEl = document.querySelector('[data-hub-progress-text]')
  const progressBar = document.querySelector('[data-hub-progress-bar]')
  if (progressEl) {
    const total = weekData.exercises.length
    const percent = total ? Math.round((solved.length / total) * 100) : 0
    progressEl.textContent = `${solved.length} / ${total}`
    if (progressBar) progressBar.style.width = `${percent}%`
  }
}
