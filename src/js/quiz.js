import { getQuizScore, setQuizScore, removeQuizScore } from './storage.js'

function renderPreview(preview) {
  if (!preview) return ''
  return `
    <div class="my-4 overflow-hidden border border-zinc-100 bg-zinc-50 p-4">
      <style>${preview.css}</style>
      ${preview.html}
    </div>
  `
}

export function initQuiz(quizData, containerSelector = '[data-quiz]') {
  const container = document.querySelector(containerSelector)
  if (!container) return

  const previous = getQuizScore(quizData.title)
  if (previous) {
    showResults(container, quizData, previous, true)
    return
  }

  container.innerHTML = `
    <form data-quiz-form class="space-y-6">
      ${quizData.questions
      .map(
        (q, qi) => `
        <fieldset class="card" data-question="${q.id}">
          <legend class="mb-4 text-base font-medium text-zinc-900">
            <span class="mr-3 font-mono text-sm text-zinc-400">${String(qi + 1).padStart(2, '0')}</span>
            ${q.question}
          </legend>
          ${renderPreview(q.preview)}
          <div class="space-y-2">
            ${q.options
            .map(
              (opt, oi) => `
              <label class="flex cursor-pointer items-center gap-3 border border-zinc-200 p-3 transition hover:bg-zinc-50 has-checked:border-zinc-900 has-checked:bg-zinc-50">
                <input type="radio" name="${q.id}" value="${oi}" class="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900" required />
                <span class="text-sm text-zinc-700">${opt}</span>
              </label>
            `
            )
            .join('')}
          </div>
          <p data-explanation="${q.id}" class="mt-3 hidden text-sm"></p>
        </fieldset>
      `
      )
      .join('')}
      <button type="submit" class="btn-primary">Indienen</button>
    </form>
  `

  container.querySelector('[data-quiz-form]').addEventListener('submit', (e) => {
    e.preventDefault()
    const form = e.target
    const answers = {}

    quizData.questions.forEach((q) => {
      const selected = form.querySelector(`input[name="${q.id}"]:checked`)
      answers[q.id] = selected ? parseInt(selected.value, 10) : -1
    })

    const correct = quizData.questions.filter((q) => answers[q.id] === q.correct).length
    const total = quizData.questions.length
    const percent = Math.round((correct / total) * 100)
    const passed = percent >= quizData.passScore

    const result = { correct, total, percent, passed, answers, date: new Date().toISOString() }
    setQuizScore(quizData.title, result)

    quizData.questions.forEach((q) => {
      const isCorrect = answers[q.id] === q.correct
      const el = container.querySelector(`[data-explanation="${q.id}"]`)
      el.classList.remove('hidden')
      el.classList.add(isCorrect ? 'text-zinc-700' : 'text-zinc-500')
      el.textContent = isCorrect ? `✓ Correct. ${q.explanation}` : `✗ Fout. ${q.explanation}`
    })

    showResults(container, quizData, result, false, form)
  })
}

function showResults(container, quizData, result, fromStorage, form = null) {
  const passed = result.passed
  const resultHtml = `
    <div class="card mb-6 ${passed ? 'bg-zinc-50' : ''}">
      <h2 class="text-xl font-medium text-zinc-900">
        ${passed ? 'Geslaagd' : 'Nog niet geslaagd'}
      </h2>
      <p class="mt-2 text-zinc-600">
        Score: ${result.correct} / ${result.total} (${result.percent}%)
        — minimaal ${quizData.passScore}% nodig
      </p>
      ${fromStorage ? '<p class="mt-2 text-sm text-zinc-500">Eerder resultaat (opgeslagen in browser). <button type="button" data-reset-quiz class="text-link">Opnieuw maken</button></p>' : ''}
    </div>
  `

  if (fromStorage) {
    container.innerHTML = resultHtml
    container.querySelector('[data-reset-quiz]')?.addEventListener('click', () => {
      removeQuizScore(quizData.title)
      location.reload()
    })
    return
  }

  form.querySelector('button[type="submit"]').disabled = true
  form.insertAdjacentHTML('beforebegin', resultHtml)
}
