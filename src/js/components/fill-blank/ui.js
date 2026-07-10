import { splitCodeBlanks, validateFillBlank, assertBlankCount } from './engine.js'

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderBlankInput(blank, index) {
  if (blank.options?.length) {
    const options = blank.options
      .map(
        (opt) =>
          `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`
      )
      .join('')
    return `<select class="fill-blank-input" data-blank-index="${index}" aria-label="Invulveld ${index + 1}">
      <option value="">…</option>
      ${options}
    </select>`
  }

  return `<input type="text" class="fill-blank-input" data-blank-index="${index}" aria-label="Invulveld ${index + 1}" spellcheck="false" autocomplete="off" />`
}

/**
 * Mount a fill-in-the-blank code exercise into any container.
 */
export function mountFillBlank(container, {
  code,
  blanks = [],
  prompt,
  explanation = '',
  onCheck,
} = {}) {
  assertBlankCount(code, blanks)
  const { parts } = splitCodeBlanks(code)

  const codeHtml = parts
    .map((part, i) => {
      const text = `<span class="fill-blank-text">${escapeHtml(part)}</span>`
      if (i >= blanks.length) return text
      return `${text}${renderBlankInput(blanks[i], i)}`
    })
    .join('')

  container.innerHTML = `
    ${prompt ? `<p class="fill-blank-prompt mb-3 text-sm text-ink/80">${escapeHtml(prompt)}</p>` : ''}
    <pre class="fill-blank-code" tabindex="0"><code>${codeHtml}</code></pre>
    <button type="button" class="fill-blank-check btn-primary mt-4">Controleer</button>
    <div data-feedback class="mt-3"></div>
  `

  const feedbackEl = container.querySelector('[data-feedback]')
  const checkBtn = container.querySelector('.fill-blank-check')

  checkBtn.addEventListener('click', () => {
    const values = blanks.map((_, i) => {
      const input = container.querySelector(`[data-blank-index="${i}"]`)
      return input?.value ?? ''
    })

    if (values.some((v) => !String(v).trim())) {
      onCheck?.({ allCorrect: false, incomplete: true, results: [] })
      return { allCorrect: false, incomplete: true }
    }

    const { allCorrect, results } = validateFillBlank(blanks, values)

    results.forEach((r) => {
      const input = container.querySelector(`[data-blank-index="${r.index}"]`)
      if (input) input.dataset.state = r.correct ? 'correct' : 'incorrect'
    })

    onCheck?.({ allCorrect, results })

    checkBtn.disabled = true
    container.querySelectorAll('.fill-blank-input').forEach((input) => {
      input.disabled = true
    })

    return { allCorrect, results }
  })

  return { destroy() {} }
}
