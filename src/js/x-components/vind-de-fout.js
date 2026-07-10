import { renderFeedback, validateVindDeFout, celebrateSuccess, setComponentResult } from './shared.js'

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function initVindDeFout(el, config) {
  const lines = (config.code ?? '').replace(/\r\n/g, '\n').split('\n')
  const errorLines = config.errorLines ?? (config.errorLine != null ? [config.errorLine] : [])

  el.innerHTML = `
    <p class="x-vind-de-fout-instructie mb-3 text-sm text-muted">Klik op de regel met de fout in de code.</p>
    <div class="x-vind-de-fout-code" role="group" aria-label="Code met fout">
      ${lines
        .map(
          (line, i) => `
        <button type="button" class="x-vind-de-fout-line" data-line="${i + 1}">
          <span class="x-vind-de-fout-linenum">${i + 1}</span>
          <code class="x-vind-de-fout-text">${escapeHtml(line) || ' '}</code>
        </button>
      `
        )
        .join('')}
    </div>
    <div data-feedback class="mt-3"></div>
  `

  const feedbackEl = el.querySelector('[data-feedback]')
  let answered = false

  el.querySelectorAll('.x-vind-de-fout-line').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (answered) return

      const line = parseInt(btn.dataset.line, 10)
      const correct = validateVindDeFout(errorLines, line)
      answered = true

      el.querySelectorAll('.x-vind-de-fout-line').forEach((b) => {
        const ln = parseInt(b.dataset.line, 10)
        if (errorLines.includes(ln)) b.dataset.state = 'correct'
        else if (ln === line && !correct) b.dataset.state = 'incorrect'
        else b.dataset.state = 'neutral'
        b.disabled = true
      })

      const message = correct
        ? config.explanation ?? 'Je hebt de juiste regel gevonden!'
        : `${config.hint ? `${config.hint} ` : ''}${config.explanation ?? 'Dat is niet de foutieve regel.'}`

      feedbackEl.innerHTML = renderFeedback(correct, message)

      if (correct) {
        celebrateSuccess(el)
      } else {
        setComponentResult(el, 'error')
      }
    })
  })
}
