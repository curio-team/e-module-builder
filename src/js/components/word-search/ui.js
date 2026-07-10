import { generateWordSearch, cellsAlongForward, matchSelection } from './engine.js'

/**
 * Mount an interactive word search into any container.
 * Reusable outside x-woordzoeker (templates, custom pages, etc.).
 */
export function mountWordSearch(container, {
  words,
  instruction = 'Vind alle woorden in het raster. Sleep van links naar rechts of van boven naar beneden.',
  onWordFound,
  onComplete,
  onMiss,
} = {}) {
  const puzzle = generateWordSearch(words)

  if (!puzzle) {
    container.innerHTML = `<p class="word-search-empty text-sm text-muted">Niet genoeg woorden voor een woordzoeker.</p>`
    return null
  }

  const found = new Set()
  let selecting = false
  let selection = []

  container.innerHTML = `
    <p class="word-search-instructie mb-3 text-sm text-muted">${instruction}</p>
    <div class="word-search-board" data-board>
      <div class="word-search-grid" role="grid" aria-label="Woordzoeker" style="--ws-cols: ${puzzle.grid[0].length}">
        ${puzzle.grid
          .map(
            (row, r) => `
          <div class="word-search-row" role="row">
            ${row
              .map(
                (letter, c) => `
              <button type="button" class="word-search-cell" data-r="${r}" data-c="${c}" role="gridcell" aria-label="${letter}">${letter}</button>
            `
              )
              .join('')}
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    <ul class="word-search-words mt-3 flex flex-wrap gap-1.5" data-word-list>
      ${puzzle.words
        .map(
          (word) => `
        <li class="word-search-word" data-word="${word}">${word}</li>
      `
        )
        .join('')}
    </ul>
  `

  const board = container.querySelector('[data-board]')

  function clearSelection() {
    selection = []
    container.querySelectorAll('.word-search-cell').forEach((cell) => cell.removeAttribute('data-active'))
  }

  function setActiveCells(cells) {
    clearSelection()
    selection = cells
    for (const [r, c] of cells) {
      container.querySelector(`.word-search-cell[data-r="${r}"][data-c="${c}"]`)?.setAttribute('data-active', 'true')
    }
  }

  function markFound(word) {
    if (found.has(word)) return
    found.add(word)

    const placement = puzzle.placements.find((p) => p.word === word)
    if (placement) {
      for (const [r, c] of placement.cells) {
        container.querySelector(`.word-search-cell[data-r="${r}"][data-c="${c}"]`)?.setAttribute('data-found', 'true')
      }
    }

    container.querySelector(`.word-search-word[data-word="${word}"]`)?.setAttribute('data-found', 'true')
    onWordFound?.(word, { found: found.size, total: puzzle.words.length })

    if (found.size === puzzle.words.length) {
      onComplete?.({ words: puzzle.words })
    }
  }

  function tryMatch(cells) {
    const match = matchSelection(puzzle.placements, cells)
    if (match) {
      markFound(match.word)
    } else if (cells.length > 2) {
      onMiss?.(cells)
    }
    clearSelection()
  }

  container.querySelectorAll('.word-search-cell').forEach((cell) => {
    cell.addEventListener('mousedown', (e) => {
      e.preventDefault()
      selecting = true
      setActiveCells([[parseInt(cell.dataset.r, 10), parseInt(cell.dataset.c, 10)]])
    })

    cell.addEventListener('mouseenter', () => {
      if (!selecting || !selection.length) return
      const start = selection[0]
      const end = [parseInt(cell.dataset.r, 10), parseInt(cell.dataset.c, 10)]
      const cells = cellsAlongForward(start, end)
      if (cells) setActiveCells(cells)
    })

    cell.addEventListener('mouseup', () => {
      if (!selecting) return
      selecting = false
      tryMatch(selection)
    })
  })

  const onWindowMouseUp = () => {
    if (selecting) {
      selecting = false
      tryMatch(selection)
    }
  }
  window.addEventListener('mouseup', onWindowMouseUp)

  const resizeObserver = new ResizeObserver(() => {
    /* grid uses CSS grid — no line redraw needed */
  })
  if (board) resizeObserver.observe(board)

  return {
    puzzle,
    destroy() {
      window.removeEventListener('mouseup', onWindowMouseUp)
      resizeObserver.disconnect()
    },
  }
}
