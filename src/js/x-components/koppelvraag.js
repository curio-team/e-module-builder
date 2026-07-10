import { shuffleArray, renderFeedback, validateKoppelvraag, celebrateSuccess, setComponentResult } from './shared.js'

function findRightButton(el, rightValue) {
  return [...el.querySelectorAll('.x-koppelvraag-item[data-side="right"]')].find(
    (btn) => btn.dataset.right === rightValue
  )
}

function redrawConnectorLines(el, matches) {
  const board = el.querySelector('.x-koppelvraag-board')
  const svg = el.querySelector('.x-koppelvraag-lines')
  if (!board || !svg) return

  const boardRect = board.getBoundingClientRect()
  const w = Math.max(boardRect.width, 1)
  const h = Math.max(boardRect.height, 1)

  svg.setAttribute('width', String(w))
  svg.setAttribute('height', String(h))
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.replaceChildren()

  const stacked = w < 640

  matches.forEach((rightVal, leftIdx) => {
    if (rightVal == null) return

    const leftBtn = el.querySelector(`.x-koppelvraag-item[data-side="left"][data-index="${leftIdx}"]`)
    const rightBtn = findRightButton(el, rightVal)
    if (!leftBtn || !rightBtn) return

    const leftRect = leftBtn.getBoundingClientRect()
    const rightRect = rightBtn.getBoundingClientRect()

    let x1, y1, x2, y2
    if (stacked) {
      x1 = leftRect.left + leftRect.width / 2 - boardRect.left
      y1 = leftRect.bottom - boardRect.top
      x2 = rightRect.left + rightRect.width / 2 - boardRect.left
      y2 = rightRect.top - boardRect.top
    } else {
      x1 = leftRect.right - boardRect.left
      y1 = leftRect.top + leftRect.height / 2 - boardRect.top
      x2 = rightRect.left - boardRect.left
      y2 = rightRect.top + rightRect.height / 2 - boardRect.top
    }

    const state = leftBtn.dataset.state || 'pending'
    const stroke = state === 'correct' ? '#22c55e' : state === 'incorrect' ? '#f43f5e' : '#64748b'

    const midX = (x1 + x2) / 2
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute(
      'd',
      stacked
        ? `M ${x1} ${y1} C ${x1} ${midX}, ${x2} ${midX}, ${x2} ${y2}`
        : `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
    )
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', stroke)
    path.setAttribute('stroke-width', '2.5')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('opacity', '0.85')
    svg.appendChild(path)

    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      dot.setAttribute('cx', String(x))
      dot.setAttribute('cy', String(y))
      dot.setAttribute('r', '4')
      dot.setAttribute('fill', stroke)
      svg.appendChild(dot)
    }
  })
}

function applyMatches(el, matches) {
  el.querySelectorAll('.x-koppelvraag-item').forEach((item) => {
    item.removeAttribute('data-matched')
    item.removeAttribute('data-selected')
  })

  matches.forEach((rightVal, leftIdx) => {
    if (rightVal == null) return
    const leftBtn = el.querySelector(`.x-koppelvraag-item[data-side="left"][data-index="${leftIdx}"]`)
    const rightBtn = findRightButton(el, rightVal)
    if (leftBtn) leftBtn.dataset.matched = rightVal
    if (rightBtn) rightBtn.dataset.matched = 'true'
  })

  redrawConnectorLines(el, matches)
}

export function initKoppelvraag(el, config) {
  const pairs = config.pairs ?? []
  const rightItems = config.shuffle !== false ? shuffleArray(pairs.map((p) => p.right)) : pairs.map((p) => p.right)

  el.innerHTML = `
    ${config.prompt ? `<p class="x-koppelvraag-prompt mb-4 text-sm text-ink/80">${config.prompt}</p>` : ''}
    <div class="x-koppelvraag-board">
      <svg class="x-koppelvraag-lines" aria-hidden="true"></svg>
      <div class="x-koppelvraag-grid">
        <div class="x-koppelvraag-column" data-column="left">
          ${pairs
            .map(
              (pair, i) => `
            <button type="button" class="x-koppelvraag-item" data-index="${i}" data-side="left">${pair.left}</button>
          `
            )
            .join('')}
        </div>
        <div class="x-koppelvraag-column" data-column="right">
          ${rightItems
            .map(
              (right) => `
            <button type="button" class="x-koppelvraag-item" data-right="${right}" data-side="right">${right}</button>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
    <p class="x-koppelvraag-hint mt-3 text-xs text-muted">Klik links, dan rechts om te koppelen.</p>
    <button type="button" class="x-koppelvraag-check btn-primary mt-4">Controleer</button>
    <div data-feedback></div>
  `

  const matches = new Array(pairs.length).fill(null)
  let selectedLeft = null
  const feedbackEl = el.querySelector('[data-feedback]')
  const board = el.querySelector('.x-koppelvraag-board')

  const resizeObserver = new ResizeObserver(() => redrawConnectorLines(el, matches))
  if (board) resizeObserver.observe(board)

  el.querySelectorAll('.x-koppelvraag-item[data-side="left"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      el.querySelectorAll('.x-koppelvraag-item[data-side="left"]').forEach((b) => b.removeAttribute('data-selected'))
      selectedLeft = parseInt(btn.dataset.index, 10)
      btn.dataset.selected = 'true'
    })
  })

  el.querySelectorAll('.x-koppelvraag-item[data-side="right"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (selectedLeft === null) return

      const right = btn.dataset.right

      matches.forEach((val, idx) => {
        if (idx !== selectedLeft && val === right) matches[idx] = null
      })

      matches[selectedLeft] = right
      selectedLeft = null

      applyMatches(el, matches)

      const matched = matches.filter((m) => m !== null).length
      if (matched < pairs.length) {
        feedbackEl.innerHTML = renderFeedback(true, `${matched} van ${pairs.length} gekoppeld. Klik op Controleer als je klaar bent.`, {
          variant: 'info',
          title: 'Bezig',
        })
      } else {
        feedbackEl.innerHTML = renderFeedback(true, 'Alles gekoppeld! Klik op Controleer om te controleren.', {
          variant: 'info',
          title: 'Klaar om te controleren',
        })
      }
    })
  })

  el.querySelector('.x-koppelvraag-check').addEventListener('click', () => {
    if (matches.some((m) => m === null)) {
      setComponentResult(el, 'error')
      feedbackEl.innerHTML = renderFeedback(false, 'Koppel eerst alle items links en rechts.')
      return
    }

    const { allCorrect, results } = validateKoppelvraag(pairs, matches)

    el.querySelectorAll('.x-koppelvraag-item').forEach((item) => item.removeAttribute('data-state'))

    results.forEach((r) => {
      const leftBtn = el.querySelector(`.x-koppelvraag-item[data-side="left"][data-index="${r.index}"]`)
      if (leftBtn) leftBtn.dataset.state = r.correct ? 'correct' : 'incorrect'

      const matchedRight = matches[r.index]
      el.querySelectorAll('.x-koppelvraag-item[data-side="right"]').forEach((rightBtn) => {
        if (rightBtn.dataset.right === matchedRight) {
          rightBtn.dataset.state = r.correct ? 'correct' : 'incorrect'
        }
      })
    })

    redrawConnectorLines(el, matches)

    if (allCorrect) {
      feedbackEl.innerHTML = renderFeedback(true, 'Alles goed gekoppeld!')
      celebrateSuccess(el)
      el.querySelector('.x-koppelvraag-check').disabled = true
      return
    }

    setComponentResult(el, 'error')
    feedbackEl.innerHTML = renderFeedback(false, 'Niet alles klopt. De rode lijnen zijn fout — probeer opnieuw.')

    matches.fill(null)
    el.querySelectorAll('.x-koppelvraag-item').forEach((item) => {
      item.removeAttribute('data-matched')
      item.removeAttribute('data-state')
      item.removeAttribute('data-selected')
    })
    selectedLeft = null
    redrawConnectorLines(el, matches)
  })
}
