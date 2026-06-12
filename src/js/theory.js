import { sitePath } from './site-path.js'

const BORDER_COLORS = {
  indigo: 'border-l-indigo-500',
  violet: 'border-l-violet-500',
  emerald: 'border-l-emerald-500',
  amber: 'border-l-amber-500',
  sky: 'border-l-sky-500',
  rose: 'border-l-rose-500',
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineHtml(s) {
  return s
}

function renderParagraphs(paragraphs) {
  return (paragraphs || [])
    .map((p) => `<p class="mt-3 text-zinc-600 leading-relaxed">${inlineHtml(p)}</p>`)
    .join('')
}

function renderSection(section, accent) {
  switch (section.type) {
    case 'intro':
      return `
        <section class="card border-l-4 ${accent}">
          <h2 class="text-lg font-medium text-zinc-900">${esc(section.title)}</h2>
          ${renderParagraphs(section.paragraphs)}
          ${section.callout ? `<div class="mt-4 callout">${inlineHtml(section.callout)}</div>` : ''}
        </section>`

    case 'card':
      return `
        <section class="card${section.muted ? ' bg-zinc-50' : ''}">
          <h2 class="text-lg font-medium text-zinc-900">${esc(section.title)}</h2>
          ${section.paragraphs ? renderParagraphs(section.paragraphs) : ''}
          ${section.code ? `<pre class="code-block mt-4"><code>${esc(section.code)}</code></pre>` : ''}
          ${section.note ? `<p class="mt-3 text-sm text-zinc-500">${inlineHtml(section.note)}</p>` : ''}
          ${section.callout ? `<p class="mt-3 callout text-sm">${inlineHtml(section.callout)}</p>` : ''}
          ${section.list ? `<ul class="mt-3 list-inside list-disc space-y-2 text-zinc-600 text-sm">${section.list.map((i) => `<li>${inlineHtml(i)}</li>`).join('')}</ul>` : ''}
        </section>`

    case 'compare': {
      const intro = section.intro || (section.paragraphs || []).join(' ')
      const items = section.items || []
      const comparison = section.comparison || []

      let compareBody = ''
      if (items.length) {
        compareBody = `
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            ${items
              .map(
                (item) => `
              <div class="compare-cell">
                <h3 class="font-medium text-zinc-900">${esc(item.title)}</h3>
                <p class="mt-2 text-sm text-zinc-600 leading-relaxed">${inlineHtml(item.text)}</p>
                ${item.code ? `<pre class="mt-3 overflow-x-auto bg-zinc-900 p-3 font-mono text-xs text-zinc-300"><code>${esc(item.code)}</code></pre>` : ''}
                ${item.note ? `<p class="mt-2 text-xs text-zinc-500">${inlineHtml(item.note)}</p>` : ''}
              </div>`
              )
              .join('')}
          </div>`
      } else if (comparison.length) {
        compareBody = `
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-zinc-200 text-zinc-500">
                  <th class="py-2 pr-4">Kenmerk</th>
                  <th class="py-2 pr-4">Traditioneel</th>
                  <th class="py-2 pr-4">Flexbox</th>
                </tr>
              </thead>
              <tbody class="text-zinc-700">
                ${comparison
                  .map(
                    (row, i, arr) => `
                <tr class="${i < arr.length - 1 ? 'border-b border-zinc-100' : ''}">
                  <td class="py-2 pr-4 font-medium">${esc(row.feature || row.title || '')}</td>
                  <td class="py-2 pr-4">${esc(row.old || row.before || '')}</td>
                  <td class="py-2 pr-4">${esc(row.new || row.after || '')}</td>
                </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
      }

      return `
        <section class="card">
          <h2 class="text-lg font-medium text-zinc-900">${esc(section.title)}</h2>
          ${intro ? `<p class="mt-3 text-zinc-600">${inlineHtml(intro)}</p>` : ''}
          ${compareBody}
          ${
            section.table
              ? `
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-zinc-200 text-zinc-500">
                  ${section.table.headers.map((h) => `<th class="py-2 pr-4">${esc(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="text-zinc-700">
                ${section.table.rows
                  .map(
                    (row, i, arr) => `
                <tr class="${i < arr.length - 1 ? 'border-b border-zinc-100' : ''}">
                  ${row.map((cell) => `<td class="py-2 pr-4">${esc(cell)}</td>`).join('')}
                </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
              : ''
          }
        </section>`
    }

    case 'definitions': {
      const items = section.items || []
      const listItems = section.listItems || []

      if (items.length) {
        return `
        <section class="card">
          <h2 class="text-lg font-medium text-zinc-900">${esc(section.title)}</h2>
          <dl class="mt-4 space-y-5">
            ${items
              .map(
                (item, i, arr) => `
              <div class="${i < arr.length - 1 ? 'border-b border-zinc-100 pb-4' : ''}">
                <dt class="font-mono text-sm text-zinc-900">${esc(item.term)}</dt>
                <dd class="mt-1 text-zinc-600">${inlineHtml(item.text)}</dd>
                ${item.note ? `<dd class="mt-2 text-sm text-zinc-500">${inlineHtml(item.note)}</dd>` : ''}
              </div>`
              )
              .join('')}
          </dl>
        </section>`
      }

      return `
        <section class="card">
          <h2 class="text-lg font-medium text-zinc-900">${esc(section.title)}</h2>
          <ul class="mt-4 list-inside list-disc space-y-3 text-zinc-600">
            ${listItems.map((item) => `<li>${inlineHtml(item)}</li>`).join('')}
          </ul>
        </section>`
    }

    case 'ascii':
      return `
        <section class="card">
          <h2 class="text-lg font-medium text-zinc-900">${esc(section.title)}</h2>
          ${section.ascii ? `<pre class="code-block mt-4 text-zinc-300"><code>${esc(section.ascii)}</code></pre>` : ''}
          ${section.code ? `<pre class="code-block mt-4"><code>${esc(section.code)}</code></pre>` : ''}
          ${section.note ? `<p class="mt-3 text-zinc-600 text-sm">${inlineHtml(section.note)}</p>` : ''}
        </section>`

    case 'cta':
      return `
        <div class="flex flex-wrap gap-3">
          ${(section.links || [])
            .map((l) => `<a href="${sitePath(l.href)}" class="${l.primary ? 'btn-primary' : 'btn-secondary'}">${esc(l.label)}</a>`)
            .join('')}
        </div>`

    default:
      return ''
  }
}

export async function initTheory(week) {
  const container = document.querySelector(`[data-theory][data-week="${week}"]`)
  if (!container) return

  let data
  try {
    data = await import(`../data/theory-week${week}.json`).then((m) => m.default)
  } catch {
    container.innerHTML = `
      <p class="text-red-600">Theorie voor week ${week} niet gevonden.</p>
      <p class="mt-2 text-sm text-zinc-500">Run <code class="font-mono">npm run generate-content</code> om content te genereren.</p>
    `
    return
  }

  if (!data?.sections?.length) {
    container.innerHTML = `
      <p class="text-amber-700">Theorie voor week ${week} is nog leeg.</p>
      <p class="mt-2 text-sm text-zinc-500">Run <code class="font-mono">npm run generate-content</code> om content te genereren.</p>
    `
    return
  }

  const accent = BORDER_COLORS[data.accent] || BORDER_COLORS.indigo
  const sectionsHtml = data.sections
    .map((s) => {
      try {
        return renderSection(s, accent)
      } catch (err) {
        console.warn('Theorie-sectie overgeslagen:', s?.type, err)
        return ''
      }
    })
    .join('\n')

  container.innerHTML = `
    <span class="week-label">Week ${data.week}</span>
    <h1 class="text-3xl font-semibold tracking-tight text-zinc-900">${esc(data.title)}</h1>
    <p class="mt-2 text-lg text-zinc-600">Leerdoel: ${inlineHtml(data.goal)}</p>
    <div class="mt-8 space-y-6">
      ${sectionsHtml}
    </div>
  `
}
