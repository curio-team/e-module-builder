import { createCssEditor, setEditorValue, getEditorValue } from '../monaco-setup.js'
import { runChecks, validateAreas } from './validators.js'
import { renderExerciseMeta, markExerciseSolved, getSolvedExercises } from './exercise-shared.js'

export { renderExerciseMeta, markExerciseSolved, getSolvedExercises }

function buildPreviewDoc(previewHtml, css) {
  if (previewHtml.includes('</style>')) {
    return previewHtml.replace('</style>', `\n${css}\n</style>`)
  }
  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>${previewHtml}</body></html>`
}

function showFeedback(el, html, type = 'info') {
  if (!el) return
  el.classList.remove('hidden')
  el.innerHTML = html
}

export function initCssPlayground(exercise, { onSolved } = {}) {
  const container = document.querySelector('[data-editor]')
  const iframe = document.querySelector('[data-preview]')
  const feedback = document.querySelector('[data-feedback]')
  if (!container || !iframe) return

  const editor = createCssEditor(container, exercise.starterCss, (css) => {
    iframe.srcdoc = buildPreviewDoc(exercise.previewHtml, css)
  })

  iframe.srcdoc = buildPreviewDoc(exercise.previewHtml, exercise.starterCss)

  document.querySelector('[data-hint]')?.addEventListener('click', () => {
    showFeedback(feedback, `<p class="text-muted">${exercise.hint.replace(/\n/g, '<br>')}</p>`)
  })

  document.querySelector('[data-solution]')?.addEventListener('click', () => {
    setEditorValue(editor, exercise.solution)
    iframe.srcdoc = buildPreviewDoc(exercise.previewHtml, exercise.solution)
    showFeedback(feedback, '<p class="text-muted">Oplossing geladen. Bestudeer de code en probeer het daarna zelf.</p>')
  })

  document.querySelector('[data-check]')?.addEventListener('click', () => {
    const css = getEditorValue(editor)
    const results = runChecks(css, exercise.checks)
    const failed = results.filter((r) => !r.ok)

    if (failed.length === 0) {
      showFeedback(feedback, '<p class="font-medium text-ink">Goed gedaan — oefening voltooid.</p>')
      onSolved?.(exercise.id)
    } else {
      showFeedback(
        feedback,
        `<p class="font-medium text-ink">Nog niet compleet:</p><ul class="mt-2 list-inside list-disc text-sm text-muted">${failed.map((f) => `<li>${f.msg}</li>`).join('')}</ul>`
      )
    }
  })

  return editor
}

export function initAreasExercise(exercise, { onSolved } = {}) {
  const containerInput = document.querySelector('[data-areas-container]')
  const preview = document.querySelector('[data-areas-preview]')
  const feedback = document.querySelector('[data-feedback]')
  const selects = document.querySelectorAll('[data-area-item]')

  if (!containerInput || !preview) return

  const outerClassMatch = exercise.previewHtml.match(/<\w+[^>]*\bclass="([^"]*)"/)
  const gridClass = (outerClassMatch?.[1] ?? '').split(/\s+/)[0] || 'grid-container'

  const updatePreview = () => {
    const areas = containerInput.value.trim()
    const itemStyles = Array.from(selects)
      .map((s) => `.${s.dataset.areaItem} { grid-area: ${s.value}; }`)
      .join('\n')

    preview.innerHTML = `
      <style>
        .${gridClass} {
          display: grid;
          grid-template-columns: ${exercise.gridColumns || '1fr 1fr 1fr'};
          grid-template-areas: ${areas || '"a b c"'};
          gap: 6px;
          min-height: 180px;
        }
        ${exercise.previewStyles || ''}
        ${itemStyles}
      </style>
      ${exercise.previewHtml}
    `
  }

  containerInput.addEventListener('input', updatePreview)
  selects.forEach((s) => s.addEventListener('change', updatePreview))
  updatePreview()

  document.querySelector('[data-hint]')?.addEventListener('click', () => {
    showFeedback(feedback, `<p class="text-muted">${exercise.hint}</p>`)
  })

  document.querySelector('[data-check]')?.addEventListener('click', () => {
    const errors = validateAreas(containerInput.value, selects, exercise.expected)
    if (errors.length === 0) {
      showFeedback(feedback, '<p class="font-medium text-ink">Perfect — oefening voltooid.</p>')
      onSolved?.(exercise.id)
    } else {
      showFeedback(
        feedback,
        `<p class="font-medium text-ink">Nog niet goed:</p><ul class="mt-2 list-inside list-disc text-sm text-muted">${errors.map((e) => `<li>${e}</li>`).join('')}</ul>`
      )
    }
  })
}

export function initResponsiveExercise(exercise, { onSolved } = {}) {
  const container = document.querySelector('[data-editor]')
  const iframe = document.querySelector('[data-preview]')
  const feedback = document.querySelector('[data-feedback]')
  const viewportLabel = document.querySelector('[data-viewport-label]')
  if (!container || !iframe) return

  let currentViewport = 'desktop'
  const viewports = exercise.viewports || { desktop: 960, tablet: 700, mobile: 360 }

  const editor = createCssEditor(container, exercise.starterCss, (css) => {
    iframe.srcdoc = buildPreviewDoc(exercise.previewHtml, css)
  })

  const applyViewport = () => {
    iframe.style.width = `${viewports[currentViewport]}px`
    iframe.style.maxWidth = '100%'
    if (viewportLabel) viewportLabel.textContent = `${currentViewport} (${viewports[currentViewport]}px)`
    iframe.srcdoc = buildPreviewDoc(exercise.previewHtml, getEditorValue(editor))
  }

  document.querySelectorAll('[data-viewport]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentViewport = btn.dataset.viewport
      document.querySelectorAll('[data-viewport]').forEach((b) => {
        b.classList.toggle('btn-primary', b.dataset.viewport === currentViewport)
        b.classList.toggle('btn-secondary', b.dataset.viewport !== currentViewport)
      })
      applyViewport()
    })
  })

  document.querySelector('[data-solution]')?.addEventListener('click', () => {
    setEditorValue(editor, exercise.solution)
    applyViewport()
    showFeedback(feedback, '<p class="text-muted">Oplossing geladen.</p>')
  })

  document.querySelector('[data-check]')?.addEventListener('click', () => {
    const css = getEditorValue(editor)
    const results = runChecks(css, exercise.checks)
    const failed = results.filter((r) => !r.ok)

    if (failed.length === 0) {
      showFeedback(feedback, '<p class="font-medium text-ink">Uitstekend — oefening voltooid.</p>')
      onSolved?.(exercise.id)
    } else {
      showFeedback(
        feedback,
        `<p class="font-medium text-ink">Nog niet compleet:</p><ul class="mt-2 list-inside list-disc text-sm text-muted">${failed.map((f) => `<li>${f.msg}</li>`).join('')}</ul>`
      )
    }
  })

  applyViewport()
}

export function renderAreaSelects(items, options) {
  return items
    .map(
      (id) => `
    <div class="flex items-center justify-between border-b border-ink/10 py-3 last:border-0">
      <span class="font-medium text-ink/80">Item ${id.toUpperCase()}</span>
      <select data-area-item="${id}" class="border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink/80 focus:border-primary focus:outline-none">
        ${options.map((o) => `<option value="${o}" ${o === id ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>
  `
    )
    .join('')
}

