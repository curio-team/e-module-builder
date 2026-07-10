import { describe, it, expect } from 'vitest'
import { validateKoppelvraag, validateVindDeFout, shuffleArray } from '../src/js/x-components/shared.js'

describe('x-components shared', () => {
  it('validateKoppelvraag checks all matches', () => {
    const pairs = [
      { left: 'a', right: '1' },
      { left: 'b', right: '2' },
    ]
    const { allCorrect, results } = validateKoppelvraag(pairs, ['1', '2'])
    expect(allCorrect).toBe(true)
    expect(results).toHaveLength(2)
    expect(results.every((r) => r.correct)).toBe(true)
  })

  it('validateKoppelvraag reports incorrect matches', () => {
    const pairs = [{ left: 'a', right: '1' }]
    const { allCorrect } = validateKoppelvraag(pairs, ['2'])
    expect(allCorrect).toBe(false)
  })

  it('validateVindDeFout accepts configured line numbers', () => {
    expect(validateVindDeFout([2, 3], 2)).toBe(true)
    expect(validateVindDeFout(2, 2)).toBe(true)
    expect(validateVindDeFout([2], 3)).toBe(false)
  })

  it('shuffleArray preserves all items', () => {
    const input = [1, 2, 3, 4, 5]
    const shuffled = shuffleArray(input)
    expect(shuffled).toHaveLength(5)
    expect(shuffled.sort()).toEqual(input.sort())
  })
})
