import { renderExerciseMeta, markExerciseSolved } from './exercise-shared.js'
import { sitePath } from '../site-path.js'
import { initExternalExercise } from './external-exercise.js'

async function loadWeekData(weekNum) {
  return import(`../../data/exercises/week${weekNum}.json`).then((m) => m.default)
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
      <p class="font-medium text-zinc-900">Content ontbreekt</p>
      <p class="mt-2 text-sm text-zinc-600">De oefening staat in de navigatie, maar de inhoud is niet beschikbaar.</p>
    </div>`
  )
}

export async function initExercisePage(weekNum) {
  const params = new URLSearchParams(window.location.search)
  const id = parseInt(params.get('id') || '1', 10)
  let weekData

  try {
    weekData = await loadWeekData(weekNum)
  } catch {
    document.querySelector('[data-exercise-content]')?.insertAdjacentHTML(
      'beforeend',
      `<p class="text-red-600">Oefeningdata voor week ${weekNum} niet gevonden.</p>`
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

  if (!exercise.type || exercise.type === 'text') {
    const panel = document.querySelector('[data-exercise-content]')
    panel?.querySelector('[data-exercise-interactive]')?.classList.add('hidden')
    panel?.querySelector('[data-exercise-external]')?.classList.add('hidden')
    panel?.querySelector('[data-exercise-actions]')?.classList.add('hidden')

    const descEl = document.querySelector('[data-exercise-description]')
    if (descEl) {
      descEl.classList.remove('hidden')
      descEl.innerHTML = exercise.descriptionHtml ?? ''
    }

    renderExerciseMeta(exercise)
    renderNavButtons(weekNum, id, weekData.exercises.length)
    return
  }

  if (isExternalMode(weekData, exercise)) {
    const missing = !exercise.task?.trim() && !exercise.description?.trim()

    if (missing) {
      showMissingContent(weekNum)
      return
    }

    initExternalExercise(exercise, weekNum, {
      onSolved: () => markExerciseSolved(weekNum, exercise.id),
    })

    renderNavButtons(weekNum, id, weekData.exercises.length)
    return
  }

  renderExerciseMeta(exercise)

  const missingContent =
    (exercise.type === 'areas' ? !exercise.starterAreas?.trim() : !exercise.starterCss?.trim()) ||
    !exercise.previewHtml?.trim() ||
    (exercise.type !== 'areas' && !exercise.checks?.length)

  if (missingContent) {
    showMissingContent(weekNum)
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
  const onSolved = () => markExerciseSolved(weekNum, exercise.id)

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

  renderNavButtons(weekNum, id, weekData.exercises.length)
}

function renderNavButtons(week, currentId, total) {
  const prev = document.querySelector('[data-prev-exercise]')
  const next = document.querySelector('[data-next-exercise]')

  if (prev) {
    if (currentId > 1) {
      prev.href = `${sitePath(`/pages/week${week}-oefening.html`)}?id=${currentId - 1}`
      prev.classList.remove('hidden')
    } else {
      prev.classList.add('hidden')
    }
  }

  if (next) {
    if (currentId < total) {
      next.href = `${sitePath(`/pages/week${week}-oefening.html`)}?id=${currentId + 1}`
      next.classList.remove('hidden')
    } else {
      next.classList.add('hidden')
    }
  }
}
