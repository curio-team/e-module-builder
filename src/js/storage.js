const PREFIX = 'grid-module:'

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function setItem(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function getChecklistState() {
  return getItem('checklist', {})
}

export function setChecklistItem(id, checked) {
  const state = getChecklistState()
  state[id] = checked
  setItem('checklist', state)
}

export function getQuizScore(quizId) {
  return getItem(`quiz:${quizId}`, null)
}

export function setQuizScore(quizId, score) {
  setItem(`quiz:${quizId}`, score)
}

export function removeQuizScore(quizId) {
  localStorage.removeItem(PREFIX + `quiz:${quizId}`)
}

export function getChecklistProgress(checklistData) {
  const state = getChecklistState()
  let total = 0
  let checked = 0

  for (const group of checklistData.groups) {
    for (const item of group.items) {
      total++
      if (state[item.id]) checked++
    }
  }

  return { total, checked, percent: total ? Math.round((checked / total) * 100) : 0 }
}
