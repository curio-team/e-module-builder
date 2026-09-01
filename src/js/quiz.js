import { getQuizScore, setQuizScore, removeQuizScore } from './storage.js'
import { getManifest } from './nav.js'
import { sitePath } from './site-path.js'
import { celebrateSuccess } from './x-components/celebrations/index.js'

function renderPreview(preview) {
  if (!preview) return ''
  return `
    <div class="my-4 overflow-hidden border border-ink/10 bg-surface-subtle p-4">
      <style>${preview.css}</style>
      ${preview.html}
    </div>
  `
}

// Accepts the legacy string (container selector) or an options object.
function normalizeOptions(options) {
  if (typeof options === 'string') return { containerSelector: options, section: null }
  return { containerSelector: '[data-quiz]', section: null, ...options }
}

function sectionPages(section) {
  if (!section) return {}
  const entry = getManifest().curriculum?.find((c) => c.dirName === section)
  if (!entry) return {}
  const byKey = {}
  for (const page of entry.pages ?? []) byKey[page.key] = page.href
  return byKey
}

export function initQuiz(quizData, options = {}) {
  const { containerSelector, section } = normalizeOptions(options)
  const container = document.querySelector(containerSelector)
  if (!container) return

  const previous = getQuizScore(quizData.title)
  if (previous) {
    showResults(container, quizData, previous, { section, fromStorage: true })
    return
  }

  container.innerHTML = `
    <form data-quiz-form class="space-y-6">
      ${quizData.questions
      .map(
        (q, qi) => `
        <fieldset class="card" data-question="${q.id}">
          <legend class="inline-block rounded-lg bg-primary-light px-3 py-1.5 text-base font-medium text-ink">
            <span class="mr-3 font-mono text-sm text-ink/60">${String(qi + 1).padStart(2, '0')}</span>
            ${q.question}
          </legend>
          ${renderPreview(q.preview)}
          <div class="space-y-2">
            ${q.options
            .map(
              (opt, oi) => `
              <label data-option="${oi}" class="quiz-option flex cursor-pointer items-center gap-3 border border-ink/15 p-3 transition hover:bg-surface-subtle has-checked:border-primary has-checked:bg-surface-subtle">
                <input type="radio" name="${q.id}" value="${oi}" class="h-4 w-4 border-ink/20 text-primary focus:ring-primary" required />
                <span class="text-sm text-ink/80">${opt}</span>
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

    revealAnswers(container, quizData, answers)
    showResults(container, quizData, result, { section, fromStorage: false, form })
  })
}

// Mark the option labels + per-question explanation once the quiz is submitted.
function revealAnswers(container, quizData, answers) {
  quizData.questions.forEach((q) => {
    const fieldset = container.querySelector(`[data-question="${q.id}"]`)
    if (!fieldset) return
    fieldset.dataset.answered = 'true'
    fieldset.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.disabled = true
    })
    fieldset.querySelectorAll('[data-option]').forEach((label) => {
      const oi = parseInt(label.dataset.option, 10)
      if (oi === q.correct) label.dataset.state = 'correct'
      else if (oi === answers[q.id]) label.dataset.state = 'incorrect'
    })

    const isCorrect = answers[q.id] === q.correct
    const el = container.querySelector(`[data-explanation="${q.id}"]`)
    if (!el) return
    el.classList.remove('hidden')
    el.classList.add(isCorrect ? 'text-ink/80' : 'text-muted')
    el.textContent = isCorrect ? `✓ Correct. ${q.explanation}` : `✗ Fout. ${q.explanation}`
  })
}

function renderSummary(quizData, result) {
  const rows = quizData.questions
    .map((q, qi) => {
      const given = result.answers?.[q.id] ?? -1
      const isCorrect = given === q.correct
      const givenText = given >= 0 && q.options[given] != null
        ? q.options[given]
        : 'niet beantwoord'
      const correctText = q.options[q.correct] ?? ''
      return `
        <li class="quiz-summary-row" data-correct="${isCorrect}">
          <p class="text-sm font-medium text-ink">
            <span class="mr-2 font-mono text-xs text-ink/50">${String(qi + 1).padStart(2, '0')}</span>
            ${q.question}
          </p>
          <p class="quiz-summary-answer mt-1.5 text-sm" data-correct="${isCorrect}">
            ${isCorrect ? '✓' : '✗'} Jouw antwoord: ${givenText}
          </p>
          ${isCorrect ? '' : `<p class="quiz-summary-answer mt-1 text-sm" data-correct="true">✓ Juist antwoord: ${correctText}</p>`}
          ${q.explanation ? `<p class="mt-1 text-sm text-muted">${q.explanation}</p>` : ''}
        </li>
      `
    })
    .join('')

  return `
    <div class="card mt-6">
      <h3 class="text-lg font-medium text-ink">Overzicht</h3>
      <p class="mt-1 text-sm text-muted">${result.correct} van ${result.total} vragen goed.</p>
      <ol class="mt-4 space-y-4">${rows}</ol>
    </div>
  `
}

function renderCta(quizData, section) {
  const pages = sectionPages(section)
  const links = [
    pages.theorie ? `<a href="${sitePath(pages.theorie)}" class="btn-primary shrink-0">Naar de theorie</a>` : '',
    pages.oefeningen ? `<a href="${sitePath(pages.oefeningen)}" class="btn-secondary shrink-0">Naar de oefeningen</a>` : '',
  ].join('')

  return `
    <div class="x-feedback x-feedback--info mt-6">
      <p class="x-feedback__title">Nog even oefenen</p>
      <p class="x-feedback__message">
        Je hebt ${quizData.passScore}% nodig om te slagen. Bekijk de theorie nog eens en maak de oefeningen voordat je het opnieuw probeert.
      </p>
      ${links ? `<div class="mt-3 flex flex-wrap gap-3">${links}</div>` : ''}
    </div>
  `
}

function showResults(container, quizData, result, { section = null, fromStorage = false, form = null } = {}) {
  const passed = result.passed
  const perfect = result.correct === result.total
  const heading = perfect ? 'Gefeliciteerd! 🎉' : passed ? 'Geslaagd' : 'Nog niet geslaagd'
  const resultHtml = `
    <div class="card mb-6 scroll-mt-24 ${passed ? 'bg-surface-subtle' : ''}" data-quiz-result>
      <h2 class="text-xl font-medium text-ink">
        ${heading}
      </h2>
      <p class="mt-2 text-muted">
        Score: ${result.correct} / ${result.total} (${result.percent}%)
        — minimaal ${quizData.passScore}% nodig
      </p>
      ${passed ? '' : renderCta(quizData, section)}
      ${renderSummary(quizData, result)}
      <p class="mt-4 text-sm text-muted">
        ${fromStorage ? 'Eerder resultaat (opgeslagen in browser). ' : ''}
        <button type="button" data-reset-quiz class="text-link">Opnieuw maken</button>
      </p>
    </div>
  `

  if (fromStorage) {
    container.innerHTML = resultHtml
  } else {
    form.querySelector('button[type="submit"]').disabled = true
    form.insertAdjacentHTML('beforebegin', resultHtml)
  }

  const card = container.querySelector('[data-quiz-result]')
  card.querySelector('[data-reset-quiz]')?.addEventListener('click', () => {
    removeQuizScore(quizData.title)
    location.reload()
  })

  if (!fromStorage) {
    card.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    if (perfect) {
      // wait for the scroll so the celebration anchors on the visible card
      window.setTimeout(() => celebrateSuccess(card), 350)
    }
  }
}
