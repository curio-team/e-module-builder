import { describe, it, expect } from 'vitest'
import {
  splitCodeBlanks,
  normalizeAnswer,
  validateFillBlank,
  assertBlankCount,
} from '../src/js/components/fill-blank/engine.js'

describe('fill-blank engine', () => {
  const code = `.pagina {\n  display: ___;\n  ___: 16px;\n}`
  const blanks = [
    { answer: 'grid', options: ['flex', 'grid'] },
    { answer: 'gap', options: ['gap', 'margin'] },
  ]

  it('splits code on ___ placeholders', () => {
    const { parts, blankCount } = splitCodeBlanks(code)
    expect(blankCount).toBe(2)
    expect(parts).toHaveLength(3)
    expect(parts[0]).toContain('display: ')
  })

  it('assertBlankCount throws on mismatch', () => {
    expect(() => assertBlankCount(code, [{ answer: 'grid' }])).toThrow(/2 ___ placeholders, maar 1 blanks/)
    expect(() => assertBlankCount(code, blanks)).not.toThrow()
  })

  it('normalizeAnswer trims and lowercases', () => {
    expect(normalizeAnswer('  GRID ')).toBe('grid')
  })

  it('validateFillBlank checks all blanks', () => {
    const { allCorrect } = validateFillBlank(blanks, ['grid', 'gap'])
    expect(allCorrect).toBe(true)
  })

  it('validateFillBlank reports incorrect answers', () => {
    const { allCorrect, results } = validateFillBlank(blanks, ['flex', 'gap'])
    expect(allCorrect).toBe(false)
    expect(results[0].correct).toBe(false)
    expect(results[1].correct).toBe(true)
  })
})
