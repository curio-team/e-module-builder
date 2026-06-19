const DIFFICULTY = ['', 'Beginner', 'Beginner', 'Gemiddeld', 'Gemiddeld', 'Gevorderd', 'Gevorderd', 'Expert', 'Expert']

export function renderExerciseMeta(exercise) {
  const diffEl = document.querySelector('[data-difficulty]')
  const titleEl = document.querySelector('[data-exercise-title]')
  const descEl = document.querySelector('[data-exercise-desc]')

  if (diffEl) {
    const level = exercise.difficulty || 1
    const label = DIFFICULTY[level] || 'Beginner'
    diffEl.className = 'badge'
    diffEl.textContent = `Oefening ${String(exercise.id).padStart(2, '0')} · ${label}`
  }
  if (titleEl) titleEl.textContent = exercise.title
  if (descEl) descEl.innerHTML = exercise.descriptionInlineHtml ?? ''
}

export function markExerciseSolved(week, id) {
  const key = `grid-module:exercises:week${week}`
  try {
    const raw = localStorage.getItem(key)
    const solved = raw ? JSON.parse(raw) : []
    if (!solved.includes(id)) {
      solved.push(id)
      localStorage.setItem(key, JSON.stringify(solved))
    }
  } catch { /* ignore */ }
}

export function getSolvedExercises(week) {
  try {
    const raw = localStorage.getItem(`grid-module:exercises:week${week}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
