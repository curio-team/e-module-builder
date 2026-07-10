import { renderExerciseMeta, markExerciseSolved, markExerciseUnsolved, getSolvedExercises } from './exercise-shared.js'
import { sitePath } from '../site-path.js'
import { initExternalExercise } from './external-exercise.js'
import { initTheoryPanel } from './theory-panel.js'
import { initProseContent } from '../x-components/index.js'

async function loadWeekData(sectionId) {
  return import(`../../data/exercises/${sectionId}.json`).then((m) => m.default)
}

function isExternalMode(weekData, exercise) {
  return weekData?.mode === 'external' || exercise?.type === 'external'
}

function showMissingContent(weekNum) {
  const panel = document.querySelector('[data-exercise-content]')

  panel?.querySelector('[data-exercise-interactive]')?.classList.add('hidden')
  panel?.querySelector('[data-exercise-external]')?.classList.add('hidden')
  panel?.querySelector('[data-hint]')?.closest('.mb-4')?.classList.add('hidden')
  panel?.insertAdjacentHTML(
    'beforeend',
    `<div class="card border-l-4 border-l-amber-500">
      <p class="font-medium text-ink">Content ontbreekt</p>
      <p class="mt-2 text-sm text-muted">De oefening staat in de navigatie, maar de inhoud is niet beschikbaar.</p>
    </div>`
  )
}

export async function initExercisePage(sectionId) {
  const params = new URLSearchParams(window.location.search)
  const id = parseInt(params.get('id') || '1', 10)
  let weekData

  try {
    weekData = await loadWeekData(sectionId)
  } catch {
    document.querySelector('[data-exercise-content]')?.insertAdjacentHTML(
      'beforeend',
      `<p class="text-red-600">Oefeningdata voor ${sectionId} niet gevonden.</p>`
    )

    return
  }

  const exercise = weekData?.exercises?.find((e) => e.id === id)

  if (!exercise) {
    document.querySelector('[data-exercise-content]')?.insertAdjacentHTML(
      'beforeend',
      '<p class="text-red-600">Oefening niet gevonden.</p>'
    )

    return
  }

  initTheoryPanel(exercise.linked_theory)

  if (!exercise.type || exercise.type === 'text') {
    const panel = document.querySelector('[data-exercise-content]')
    panel?.querySelector('[data-exercise-interactive]')?.classList.add('hidden')
    panel?.querySelector('[data-exercise-external]')?.classList.add('hidden')
    panel?.querySelector('[data-exercise-actions]')?.classList.add('hidden')

    const descEl = document.querySelector('[data-exercise-description]')
    if (descEl) {
      descEl.classList.remove('hidden')
      descEl.innerHTML = exercise.descriptionHtml ?? ''
      initProseContent(descEl)
    }

    renderExerciseMeta(exercise)
    renderNavButtons(sectionId, id, weekData.exercises.length)
    initCompletionToggle(sectionId, id)
    return
  }

  if (isExternalMode(weekData, exercise)) {
    const missing = !exercise.task?.trim() && !exercise.description?.trim()

    if (missing) {
      showMissingContent(sectionId)
      return
    }

    initExternalExercise(exercise, sectionId, {
      onSolved: () => markExerciseSolved(sectionId, exercise.id),
    })

    renderNavButtons(sectionId, id, weekData.exercises.length)
    initCompletionToggle(sectionId, id)
    return
  }

  renderExerciseMeta(exercise)

  const missingContent =
    (exercise.type === 'areas' ? !exercise.starterAreas?.trim() : !exercise.starterCss?.trim()) ||
    !exercise.previewHtml?.trim() ||
    (exercise.type !== 'areas' && !exercise.checks?.length)

  if (missingContent) {
    showMissingContent(sectionId)
    return
  }

  const {
    initCssPlayground,
    initAreasExercise,
    initResponsiveExercise,
    renderAreaSelects,
  } = await import('./exercise-runner.js')

  document.querySelector('[data-exercise-external]')?.classList.add('hidden')
  document.querySelector('[data-exercise-interactive]')?.classList.remove('hidden')

  const cssPanel = document.querySelector('[data-exercise-css-panel]')
  const areasPanel = document.querySelector('[data-exercise-areas-panel]')
  const responsiveBar = document.querySelector('[data-responsive-bar]')
  const onSolved = () => markExerciseSolved(sectionId, exercise.id)

  if (exercise.type === 'areas') {
    cssPanel?.classList.add('hidden')
    areasPanel?.classList.remove('hidden')
    responsiveBar?.classList.add('hidden')
    document.querySelector('[data-solution]')?.classList.add('hidden')

    const containerInput = document.querySelector('[data-areas-container]')

    if (containerInput) containerInput.value = exercise.starterAreas || ''

    const selectsEl = document.querySelector('[data-area-selects]')

    if (selectsEl) {
      selectsEl.innerHTML = renderAreaSelects(exercise.areaItems, exercise.areaOptions)
    }

    initAreasExercise(exercise, { onSolved })
  } else {
    areasPanel?.classList.add('hidden')
    cssPanel?.classList.remove('hidden')

    if (exercise.type === 'responsive') {
      responsiveBar?.classList.remove('hidden')
      initResponsiveExercise(exercise, { onSolved })
    } else {
      responsiveBar?.classList.add('hidden')
      initCssPlayground(exercise, { onSolved })
    }
  }

  renderNavButtons(sectionId, id, weekData.exercises.length)
  initCompletionToggle(sectionId, id)
}

function initCompletionToggle(sectionId, id) {
  const btn = document.querySelector('[data-mark-complete]')
  if (!btn) return

  let done = getSolvedExercises(sectionId).includes(id)

  function update() {
    btn.textContent = done ? 'Voltooid ✓' : 'Markeer als voltooid'
    btn.classList.toggle('btn-primary', done)
    btn.classList.toggle('btn-secondary', !done)
  }

  update()
  btn.addEventListener('click', () => {
    done = !done
    done ? markExerciseSolved(sectionId, id) : markExerciseUnsolved(sectionId, id)
    update()
  })
}

function renderNavButtons(sectionId, currentId, total) {
  const prev = document.querySelector('[data-prev-exercise]')
  const next = document.querySelector('[data-next-exercise]')

  if (prev) {
    if (currentId > 1) {
      prev.href = `${sitePath(`/pages/${sectionId}-oefening.html`)}?id=${currentId - 1}`
      prev.classList.remove('hidden')
    } else {
      prev.classList.add('hidden')
    }
  }

  if (next) {
    if (currentId < total) {
      next.href = `${sitePath(`/pages/${sectionId}-oefening.html`)}?id=${currentId + 1}`
      next.classList.remove('hidden')
    } else {
      next.classList.add('hidden')
    }
  }
}
