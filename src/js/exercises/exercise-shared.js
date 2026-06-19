import { getItem, setItem } from '../storage.js'

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

export function getSolvedExercises(week) {
  return getItem(`exercises:week${week}`, [])
}

export function markExerciseSolved(week, id) {
  const solved = getSolvedExercises(week)
  if (!solved.includes(id)) setItem(`exercises:week${week}`, [...solved, id])
}

export function markExerciseUnsolved(week, id) {
  const solved = getSolvedExercises(week)
  setItem(`exercises:week${week}`, solved.filter((s) => s !== id))
}
