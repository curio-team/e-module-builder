import { getItem, setItem } from './storage.js'

function storageKey(week) {
  return `inleveropdracht:week${week}`
}

export function initInleveropdracht(data) {
  const container = document.querySelector('[data-inleveropdracht]')
  if (!container) return

  const state = getItem(storageKey(data.week), { criteria: {}, notes: '', submitted: false })

  const criteriaHtml = data.criteria
    .map((c) => {
      const checked = !!state.criteria[c.id]
      const optional = c.optional ? ' <span class="text-zinc-400">(bonus)</span>' : ''
      return `
        <label class="flex cursor-pointer items-start gap-3 border-b border-zinc-100 py-3 last:border-0">
          <input
            type="checkbox"
            data-criterion-id="${c.id}"
            class="mt-0.5 h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            ${checked ? 'checked' : ''}
          />
          <span class="flex-1 text-sm text-zinc-700">
            ${c.text}${optional}
            <span class="ml-2 font-mono text-xs text-zinc-400">${c.points}p</span>
          </span>
        </label>
      `
    })
    .join('')

  const deliverablesHtml = data.deliverables
    .map((d) => `<li class="text-sm text-zinc-600">${d}</li>`)
    .join('')

  const tipsHtml = data.tips.map((t) => `<li class="text-sm text-zinc-600">${t}</li>`).join('')

  container.innerHTML = `
    <section class="card mb-6">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Casus</p>
      <h2 class="mt-2 text-xl font-medium text-zinc-900">${data.client}</h2>
      <p class="mt-4 leading-relaxed text-zinc-600">${data.case}</p>
    </section>

    <section class="card mb-6">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Opdracht</p>
      <p class="mt-3 leading-relaxed text-zinc-600">${data.assignment}</p>
      <div class="mt-6">
        <p class="text-sm font-medium text-zinc-900">Inleveren</p>
        <ul class="mt-2 list-inside list-disc space-y-1">${deliverablesHtml}</ul>
      </div>
    </section>

    <section class="card mb-6">
      <div class="mb-4 flex items-end justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Beoordelingscriteria</p>
          <p class="mt-1 text-sm text-zinc-500">Maximaal ${data.maxPoints} punten — gebruik als checklist vóór je inlevert</p>
        </div>
        <span data-criteria-score class="font-mono text-sm text-zinc-900">0 / ${data.maxPoints}</span>
      </div>
      <div data-criteria-list>${criteriaHtml}</div>
    </section>

    <section class="card mb-6">
      <label class="block">
        <p class="text-sm font-medium text-zinc-900">Notities / link naar je bestanden</p>
        <p class="mt-1 text-sm text-zinc-500">Bijv. GitHub-link, Google Drive, of een korte toelichting voor je docent.</p>
        <textarea
          data-inleveropdracht-notes
          class="mt-3 min-h-[120px] w-full border border-zinc-200 bg-white p-4 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
          placeholder="Plak hier je inlever-link of notities..."
        >${state.notes || ''}</textarea>
      </label>
    </section>

    <section class="card-muted mb-6">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Tips</p>
      <ul class="mt-3 list-inside list-disc space-y-1">${tipsHtml}</ul>
    </section>

    <div class="flex flex-wrap gap-3">
      <button type="button" data-export-inleveropdracht class="btn-secondary">Exporteer checklist</button>
      <button type="button" data-mark-submitted class="btn-primary">${state.submitted ? 'Ingeleverd ✓' : 'Markeer als ingeleverd'}</button>
    </div>
    <p data-submitted-hint class="mt-3 text-sm text-zinc-500 ${state.submitted ? '' : 'hidden'}">Je hebt deze opdracht gemarkeerd als ingeleverd. Lever ook in via het kanaal van je docent.</p>
  `

  const saveState = (updates) => {
    const current = getItem(storageKey(data.week), { criteria: {}, notes: '', submitted: false })
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

  const notesEl = container.querySelector('[data-inleveropdracht-notes]')
  notesEl?.addEventListener('input', () => {
    saveState({ notes: notesEl.value })
  })

  container.querySelector('[data-export-inleveropdracht]')?.addEventListener('click', async () => {
    const criteria = getItem(storageKey(data.week), {}).criteria || {}
    const notes = notesEl?.value || ''
    const lines = [
      data.subtitle,
      data.title,
      '='.repeat(40),
      '',
      `Klant: ${data.client}`,
      '',
      'Criteria:',
    ]
    for (const c of data.criteria) {
      const mark = criteria[c.id] ? '[x]' : '[ ]'
      lines.push(`  ${mark} (${c.points}p) ${c.text}`)
    }
    if (notes) {
      lines.push('', 'Notities:', notes)
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
