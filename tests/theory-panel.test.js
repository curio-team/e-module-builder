import { describe, it, expect } from 'vitest'
import { parseLinkedTheory } from '../src/js/exercises/theory-panel.js'

describe('parseLinkedTheory', () => {
  it('returns empty array for undefined', () => {
    expect(parseLinkedTheory(undefined)).toEqual([])
  })

  it('returns empty array for null', () => {
    expect(parseLinkedTheory(null)).toEqual([])
  })

  it('returns empty array for empty array', () => {
    expect(parseLinkedTheory([])).toEqual([])
  })

  it('parses week1 correctly', () => {
    const result = parseLinkedTheory(['week1'])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ key: 'week1', label: 'Week 1', num: 1, dirName: 'week1' })
  })

  it('parses multiple weeks in order', () => {
    const result = parseLinkedTheory(['week1', 'week2'])
    expect(result).toHaveLength(2)
    expect(result[0].num).toBe(1)
    expect(result[1].num).toBe(2)
    expect(result[1].label).toBe('Week 2')
  })

  it('capitalises the prefix', () => {
    const result = parseLinkedTheory(['week3'])
    expect(result[0].label).toBe('Week 3')
  })

  it('ignores non-string entries', () => {
    expect(parseLinkedTheory([42, null, 'week1'])).toHaveLength(1)
  })

  it('ignores entries that do not match the weekN pattern', () => {
    expect(parseLinkedTheory(['invalid', 'week', '1week', 'week1'])).toHaveLength(1)
    expect(parseLinkedTheory(['invalid', 'week', '1week', 'week1'])[0].key).toBe('week1')
  })

  it('trims whitespace from entries', () => {
    const result = parseLinkedTheory(['  week2  '])
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('week2')
  })
})
