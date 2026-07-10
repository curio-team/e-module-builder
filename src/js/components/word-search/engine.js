const DIRECTIONS = [
  [0, 1], // horizontal, left → right
  [1, 0], // vertical, top → bottom
]

function randomLetter() {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26))
}

export function normalizeWordList(words, { maxWords = 6, maxLength = 8, minLength = 3 } = {}) {
  return [...new Set(words.map((w) => String(w).toUpperCase().replace(/[^A-Z0-9]/g, '')))]
    .filter((w) => w.length >= minLength && w.length <= maxLength)
    .sort((a, b) => a.length - b.length)
    .slice(0, maxWords)
}

export function generateWordSearch(words) {
  const list = normalizeWordList(words, { maxWords: 8, maxLength: 10, minLength: 3 })

  if (!list.length) return null

  const size = Math.min(11, Math.max(7, Math.ceil(Math.sqrt(list.reduce((sum, w) => sum + w.length, 0) * 2))))
  const grid = Array.from({ length: size }, () => Array(size).fill(''))
  const placements = []

  for (const word of [...list].sort((a, b) => b.length - a.length)) {
    let placed = false
  directionLoop:
    for (let attempt = 0; attempt < 150 && !placed; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
      const r0 = Math.floor(Math.random() * size)
      const c0 = Math.floor(Math.random() * size)

      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i
        const c = c0 + dc * i
        if (r >= size || c >= size) continue directionLoop
        if (grid[r][c] && grid[r][c] !== word[i]) continue directionLoop
      }

      for (let i = 0; i < word.length; i++) {
        grid[r0 + dr * i][c0 + dc * i] = word[i]
      }

      placements.push({
        word,
        direction: dr === 0 ? 'horizontal' : 'vertical',
        cells: Array.from({ length: word.length }, (_, i) => [r0 + dr * i, c0 + dc * i]),
      })
      placed = true
    }
  }

  if (!placements.length) return null

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = randomLetter()
    }
  }

  return { grid, placements, words: placements.map((p) => p.word) }
}

export function cellsKey(cells) {
  return cells.map(([r, c]) => `${r},${c}`).join('|')
}

export function cellsAlongForward(start, end) {
  const [sr, sc] = start
  const [r, c] = end
  const dr = r - sr
  const dc = c - sc

  if (dr < 0 || dc < 0) return null
  if (dr !== 0 && dc !== 0) return null

  const steps = Math.max(dr, dc)
  return Array.from({ length: steps + 1 }, (_, i) => [sr + (dr === 0 ? 0 : i), sc + (dc === 0 ? 0 : i)])
}

export function matchSelection(placements, cells) {
  const key = cellsKey(cells)
  return placements.find((p) => cellsKey(p.cells) === key) ?? null
}
