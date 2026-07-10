import { getItem, setItem } from './storage.js'
import { initProseContent } from './x-components/index.js'

function storageKey(week) {
  return `inleveropdracht:week${week}`
}

export function initInleveropdracht(data) {
  const container = document.querySelector('[data-inleveropdracht]')
  if (!container) return

  const state = getItem(storageKey(data.week), { criteria: {}, submitted: false })

  const criteriaHtml = data.criteria
    .map((c) => {
      const checked = !!state.criteria[c.id]
      const optional = c.optional ? ' <span class="text-muted">(bonus)</span>' : ''
      return `
        <label class="flex cursor-pointer items-start gap-3 border-b border-ink/10 py-3 last:border-0">
          <input
            type="checkbox"
            data-criterion-id="${c.id}"
            class="mt-0.5 h-4 w-4 border-ink/20 text-primary focus:ring-primary"
            ${checked ? 'checked' : ''}
          />
          <span class="flex-1 text-sm text-ink/80">
            ${c.text}${optional}
            <span class="ml-2 font-mono text-xs text-muted">${c.points}p</span>
          </span>
        </label>
      `
    })
    .join('')

  const deliverablesHtml = data.deliverables
    .map((d) => `<li class="text-sm text-muted">${d}</li>`)
    .join('')

  const tipsHtml = data.tips.map((t) => `<li class="text-sm text-muted">${t}</li>`).join('')

  container.innerHTML = `
    <section class="card prose-inleveropdracht mb-6">
      ${data.html}
    </section>

    <section class="card mb-6">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Inleveren</p>
      <ul class="mt-2 list-inside list-disc space-y-1">${deliverablesHtml}</ul>
    </section>

    <section class="card mb-6">
      <div class="mb-4 flex items-end justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Beoordelingscriteria</p>
          <p class="mt-1 text-sm text-muted">Maximaal ${data.maxPoints} punten — gebruik als checklist vóór je inlevert</p>
        </div>
        <span data-criteria-score class="font-mono text-sm text-ink">0 / ${data.maxPoints}</span>
      </div>
      <div data-criteria-list>${criteriaHtml}</div>
    </section>

    <section class="card-muted mb-6">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Tips</p>
      <ul class="mt-3 list-inside list-disc space-y-1">${tipsHtml}</ul>
    </section>

    <div class="flex flex-wrap gap-3">
      <button type="button" data-export-inleveropdracht class="btn-secondary">Exporteer checklist</button>
      <button type="button" data-mark-submitted class="btn-primary">${state.submitted ? 'Ingeleverd ✓' : 'Markeer als ingeleverd'}</button>
    </div>
    <p data-submitted-hint class="mt-3 text-sm text-muted ${state.submitted ? '' : 'hidden'}">Je hebt deze opdracht gemarkeerd als ingeleverd. Lever ook in via het kanaal van je docent.</p>
  `

  const prose = container.querySelector('.prose-inleveropdracht')
  initProseContent(prose)

  const saveState = (updates) => {
    const current = getItem(storageKey(data.week), { criteria: {}, submitted: false })
    setItem(storageKey(data.week), { ...current, ...updates })
  }

  const updateScore = () => {
    const checked = container.querySelectorAll('[data-criterion-id]:checked')
    let points = 0
    checked.forEach((input) => {
      const c = data.criteria.find((x) => x.id === input.dataset.criterionId)
      if (c) points += c.points
    })
    const el = container.querySelector('[data-criteria-score]')
    if (el) el.textContent = `${points} / ${data.maxPoints}`
  }

  container.querySelectorAll('[data-criterion-id]').forEach((input) => {
    input.addEventListener('change', () => {
      const criteria = {}
      container.querySelectorAll('[data-criterion-id]').forEach((cb) => {
        criteria[cb.dataset.criterionId] = cb.checked
      })
      saveState({ criteria })
      updateScore()
    })
  })

  container.querySelector('[data-export-inleveropdracht]')?.addEventListener('click', async () => {
    const criteria = getItem(storageKey(data.week), {}).criteria || {}
    const lines = [
      data.subtitle,
      data.title,
      '='.repeat(40),
      '',
      'Criteria:',
    ]
    for (const c of data.criteria) {
      const mark = criteria[c.id] ? '[x]' : '[ ]'
      lines.push(`  ${mark} (${c.points}p) ${c.text}`)
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      const btn = container.querySelector('[data-export-inleveropdracht]')
      btn.textContent = 'Gekopieerd!'
      setTimeout(() => { btn.textContent = 'Exporteer checklist' }, 2000)
    } catch { /* ignore */ }
  })

  container.querySelector('[data-mark-submitted]')?.addEventListener('click', () => {
    const current = getItem(storageKey(data.week), { submitted: false })
    const submitted = !current.submitted
    saveState({ submitted })
    const btn = container.querySelector('[data-mark-submitted]')
    const hint = container.querySelector('[data-submitted-hint]')
    btn.textContent = submitted ? 'Ingeleverd ✓' : 'Markeer als ingeleverd'
    hint?.classList.toggle('hidden', !submitted)
  })

  updateScore()
}
