import { renderFeedback, celebrateSuccess, setComponentResult } from './shared.js'

export function initKeuzevraag(el, config) {
  const name = `x-keuzevraag-${Math.random().toString(36).slice(2, 9)}`

  el.innerHTML = `
    <fieldset class="x-keuzevraag-fieldset">
      <legend class="x-keuzevraag-legend">${config.question}</legend>
      <div class="x-keuzevraag-options space-y-2">
        ${config.options
          .map(
            (opt, i) => `
          <label class="x-keuzevraag-option">
            <input type="radio" name="${name}" value="${i}" class="h-4 w-4 border-ink/20 text-primary focus:ring-primary" />
            <span class="x-keuzevraag-option-text text-sm text-ink/80">${opt}</span>
          </label>
        `
          )
          .join('')}
      </div>
      <button type="button" class="x-keuzevraag-check btn-primary mt-4">Controleer</button>
      <div data-feedback></div>
    </fieldset>
  `

  const feedbackEl = el.querySelector('[data-feedback]')
  const checkBtn = el.querySelector('.x-keuzevraag-check')

  checkBtn.addEventListener('click', () => {
    const selected = el.querySelector(`input[name="${name}"]:checked`)
    if (!selected) {
      setComponentResult(el, 'error')
      feedbackEl.innerHTML = renderFeedback(false, 'Kies eerst een antwoord.')
      return
    }

    const answer = parseInt(selected.value, 10)
    const correct = answer === config.correct

    el.querySelectorAll('.x-keuzevraag-option').forEach((label, i) => {
      if (i === config.correct) label.dataset.state = 'correct'
      else if (i === answer && !correct) label.dataset.state = 'incorrect'
      else label.removeAttribute('data-state')
    })

    feedbackEl.innerHTML = renderFeedback(
      correct,
      correct ? config.explanation : config.explanation
    )

    if (correct) {
      celebrateSuccess(el)
    } else {
      setComponentResult(el, 'error')
    }

    checkBtn.disabled = true
    el.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.disabled = true
    })
  })
}
