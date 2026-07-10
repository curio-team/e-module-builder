export function renderComponentLabel(label) {
  return `<p class="x-component-label">${label}</p>`
}

export function shuffleArray(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function renderFeedback(correct, message, { variant, title } = {}) {
  const resolvedVariant = variant ?? (correct ? 'success' : 'error')
  const resolvedTitle = title ?? (resolvedVariant === 'success' ? 'Goed!' : resolvedVariant === 'error' ? 'Nog niet goed' : 'Bezig')
  const icon = resolvedVariant === 'success' ? '✓' : resolvedVariant === 'error' ? '✗' : '…'

  return `
    <div class="x-feedback x-feedback--${resolvedVariant}" role="status">
      <p class="x-feedback__title">${icon} ${resolvedTitle}</p>
      <p class="x-feedback__message">${message}</p>
    </div>
  `
}

export function validateKoppelvraag(pairs, matches) {
  const results = pairs.map((pair, index) => {
    const selectedRight = matches[index]
    const correct = selectedRight === pair.right
    return { index, correct, expected: pair.right, selected: selectedRight }
  })
  const allCorrect = results.every((r) => r.correct)
  return { allCorrect, results }
}

export function validateVindDeFout(errorLines, selectedLine) {
  const acceptable = Array.isArray(errorLines) ? errorLines : [errorLines]
  return acceptable.includes(selectedLine)
}

export { celebrateSuccess, setComponentResult, getComponentRoot } from './confetti.js'
