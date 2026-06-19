import checklistData from '../data/checklist.json'
import { getChecklistState, setChecklistItem } from './storage.js'

export function initChecklist() {
  const container = document.querySelector('[data-checklist]')
  if (!container) return

  const state = getChecklistState()

  container.innerHTML = checklistData.groups
    .map((group) => {
      const items = group.items
        .map((item) => {
          const checked = !!state[item.id]
          return `
            <label class="flex cursor-pointer items-start gap-3 border-b border-zinc-100 py-3 transition last:border-0 hover:bg-zinc-50/50">
              <input
                type="checkbox"
                data-check-id="${item.id}"
                class="mt-0.5 h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                ${checked ? 'checked' : ''}
              />
              <span class="text-sm leading-relaxed ${checked ? 'text-zinc-400 line-through' : 'text-zinc-700'}">${item.textHtml ?? item.text}</span>
            </label>
          `
        })
        .join('')

      return `
        <section class="card">
          <h2 class="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">${group.title}</h2>
          <div class="mt-4">${items}</div>
        </section>
      `
    })
    .join('')

  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', () => {
      setChecklistItem(input.dataset.checkId, input.checked)
      const label = input.closest('label').querySelector('span')
      if (input.checked) {
        label.classList.add('text-zinc-400', 'line-through')
        label.classList.remove('text-zinc-700')
      } else {
        label.classList.remove('text-zinc-400', 'line-through')
        label.classList.add('text-zinc-700')
      }
      updateProgress()
    })
  })

  updateProgress()
}

function updateProgress() {
  const state = getChecklistState()
  let total = 0
  let checked = 0
  for (const group of checklistData.groups) {
    for (const item of group.items) {
      total++
      if (state[item.id]) checked++
    }
  }
  const percent = total ? Math.round((checked / total) * 100) : 0
  const bar = document.querySelector('[data-checklist-progress]')
  const label = document.querySelector('[data-checklist-progress-label]')
  if (bar) bar.style.width = `${percent}%`
  if (label) label.textContent = `${checked} / ${total}`
}

export function initChecklistExport() {
  const btn = document.querySelector('[data-export-checklist]')
  if (!btn) return

  btn.addEventListener('click', async () => {
    const state = getChecklistState()
    const lines = ['CSS Grid — Skills Checklist', '========================', '']

    for (const group of checklistData.groups) {
      lines.push(group.title)
      for (const item of group.items) {
        const mark = state[item.id] ? '[x]' : '[ ]'
        lines.push(`  ${mark} ${item.text.replace(/`/g, '')}`)
      }
      lines.push('')
    }

    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      btn.textContent = 'Gekopieerd'
      setTimeout(() => { btn.textContent = 'Exporteer naar klembord' }, 2000)
    } catch {
      btn.textContent = 'Kopiëren mislukt'
    }
  })
}
