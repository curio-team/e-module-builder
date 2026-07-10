import { describe, it, expect } from 'vitest'
import { extractKeywordsFromMarkdown, mergeKeywordLists } from '../src/js/components/word-search/keywords.js'
import {
  generateWordSearch,
  cellsAlongForward,
  matchSelection,
} from '../src/js/components/word-search/engine.js'

describe('word-search keywords', () => {
  it('extracts CSS terms from markdown', () => {
    const words = extractKeywordsFromMarkdown(`
      Gebruik \`display: grid\` en \`grid-template-columns\`.
      **grid container** en **grid items**.
    `)
    expect(words).toContain('DISPLAYGRID')
    expect(words).toContain('COLUMNS')
    expect(words).toContain('CONTAINER')
  })

  it('merges keyword lists uniquely', () => {
    expect(mergeKeywordLists(['GRID', 'GAP'], ['GAP', 'FLEX'])).toEqual(['FLEX', 'GAP', 'GRID'])
  })
})

describe('word-search engine', () => {
  it('generates a compact grid with placed words', () => {
    const puzzle = generateWordSearch(['GRID', 'GAP', 'FLEX', 'LAYOUT'])
    expect(puzzle).not.toBeNull()
    expect(puzzle.words.length).toBeGreaterThan(0)
    expect(puzzle.grid.length).toBeGreaterThanOrEqual(7)
    expect(puzzle.grid.length).toBeLessThanOrEqual(11)
  })

  it('only places words horizontally or vertically forward', () => {
    const puzzle = generateWordSearch(['GRID', 'GAP', 'FLEX', 'ROWS', 'COLS'])
    for (const placement of puzzle.placements) {
      expect(['horizontal', 'vertical']).toContain(placement.direction)
      const [[r0, c0], [r1, c1]] = [placement.cells[0], placement.cells.at(-1)]
      expect(r1).toBeGreaterThanOrEqual(r0)
      expect(c1).toBeGreaterThanOrEqual(c0)
    }
  })

  it('cellsAlongForward rejects backward and diagonal selection', () => {
    expect(cellsAlongForward([2, 2], [2, 5])).toHaveLength(4)
    expect(cellsAlongForward([2, 2], [5, 2])).toHaveLength(4)
    expect(cellsAlongForward([2, 5], [2, 2])).toBeNull()
    expect(cellsAlongForward([2, 2], [5, 5])).toBeNull()
  })

  it('matchSelection only accepts exact forward matches', () => {
    const puzzle = generateWordSearch(['GRID', 'GAP'])
    const placement = puzzle.placements[0]
    expect(matchSelection(puzzle.placements, placement.cells)).not.toBeNull()
    expect(matchSelection(puzzle.placements, [...placement.cells].reverse())).toBeNull()
  })
})
