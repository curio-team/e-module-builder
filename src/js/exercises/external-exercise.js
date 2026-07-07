import { renderExerciseMeta, markExerciseSolved } from './exercise-shared.js'

function showFeedback(el, html) {
  if (!el) return
  el.classList.remove('hidden')
  el.innerHTML = html
}

function renderSteps(steps) {
  if (!steps?.length) return ''
  return `<ol class="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">${steps
    .map((step) => `<li>${step}</li>`)
    .join('')}</ol>`
}

function renderList(items, label) {
  if (!items?.length) return ''
  return `
    <div class="mt-6">
      <p class="text-sm font-medium text-ink">${label}</p>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">${items
        .map((item) => `<li>${item}</li>`)
        .join('')}</ul>
    </div>`
}

export function initExternalExercise(exercise, weekNum, { onSolved } = {}) {
  renderExerciseMeta(exercise)

  document.querySelector('[data-exercise-interactive]')?.classList.add('hidden')
  document.querySelector('[data-exercise-external]')?.classList.remove('hidden')
  document.querySelector('[data-solution-label]')?.replaceChildren(document.createTextNode('Toon voorbeeld'))
  document.querySelector('[data-check-label]')?.replaceChildren(document.createTextNode('Markeer als voltooid'))

  const taskEl = document.querySelector('[data-external-task]')
  const stepsEl = document.querySelector('[data-external-steps]')
  const envEl = document.querySelector('[data-external-environment]')
  const deliverablesEl = document.querySelector('[data-external-deliverables]')
  const feedback = document.querySelector('[data-feedback]')

  if (taskEl) taskEl.innerHTML = exercise.taskHtml || exercise.descriptionInlineHtml || ''
  if (stepsEl) stepsEl.innerHTML = renderSteps(exercise.steps)
  if (envEl) envEl.textContent = exercise.environment || 'Je eigen omgeving (editor, server of tool)'
  if (deliverablesEl) {
    deliverablesEl.innerHTML = renderList(exercise.deliverables, 'Inleveren / tonen')
  }

  document.querySelector('[data-hint]')?.addEventListener('click', () => {
    showFeedback(
      feedback,
      exercise.hintHtml || '<p class="text-muted">Werk de stappen rustig door in je eigen omgeving.</p>'
    )
  })

  document.querySelector('[data-solution]')?.addEventListener('click', () => {
    showFeedback(
      feedback,
      `<p class="font-medium text-ink">Voorbeelduitwerking</p>${exercise.solutionHtml || '<p class="mt-2 text-sm text-muted">Vergelijk je werk met de theorie en vraag feedback aan je docent.</p>'}`
    )
  })

  document.querySelector('[data-check]')?.addEventListener('click', () => {
    showFeedback(
      feedback,
      '<p class="font-medium text-ink">Opdracht afgerond in je eigen omgeving?</p><p class="mt-2 text-sm text-muted">Markeer als voltooid als je klaar bent. De docent beoordeelt buiten deze site.</p>'
    )
    onSolved?.(exercise.id)
    markExerciseSolved(weekNum, exercise.id)
  })
}
