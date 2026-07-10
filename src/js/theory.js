import { initProseContent } from './x-components/index.js'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function initTheory(sectionId) {
  const container = document.querySelector(`[data-theory][data-week="${sectionId}"]`)
  if (!container) return

  let data
  try {
    data = await import(`../data/theory-${sectionId}.json`).then((m) => m.default)
  } catch {
    container.innerHTML = `
      <p class="text-red-600">Theorie voor ${sectionId} niet gevonden.</p>
    `
    return
  }

  if (!data?.html) {
    container.innerHTML = `
      <p class="text-amber-700">Theorie voor ${sectionId} is nog leeg.</p>
    `
    return
  }

  container.innerHTML = `
    ${data.week != null ? `<span class="week-label">Week ${data.week}</span>` : ''}
    <h1 class="text-3xl font-semibold tracking-tight text-ink">${esc(data.title)}</h1>
    <p class="mt-2 text-lg text-muted">Leerdoel: ${data.goal}</p>
    <div class="prose-theory mt-8">
      ${data.html}
    </div>
  `
  const prose = container.querySelector('.prose-theory')
  initProseContent(prose)
}
