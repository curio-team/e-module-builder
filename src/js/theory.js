function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
    `
    return
  }

  if (!data?.html) {
    container.innerHTML = `
      <p class="text-amber-700">Theorie voor week ${week} is nog leeg.</p>
    `
    return
  }

  container.innerHTML = `
    <span class="week-label">Week ${data.week}</span>
    <h1 class="text-3xl font-semibold tracking-tight text-zinc-900">${esc(data.title)}</h1>
    <p class="mt-2 text-lg text-zinc-600">Leerdoel: ${data.goal}</p>
    <div class="prose-theory mt-8">
      ${data.html}
    </div>
  `
}
