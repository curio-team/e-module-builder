import { describe, it, expect } from 'vitest'
import { normalizeCss, runChecks, validateAreas } from '../src/js/exercises/validators.js'

describe('normalizeCss', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeCss('Display:  GRID  ')).toBe('display: grid')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeCss('  gap: 16px;  ')).toBe('gap: 16px;')
  })
})

describe('runChecks — includes', () => {
  const checks = [{ type: 'includes', value: 'display: grid', msg: 'must have grid' }]

  it('returns ok when value is present', () => {
    expect(runChecks('display: grid;', checks)).toEqual([{ ok: true, msg: 'must have grid' }])
  })

  it('returns not ok when value is absent', () => {
    expect(runChecks('display: flex;', checks)).toEqual([{ ok: false, msg: 'must have grid' }])
  })

  it('matches case-insensitively', () => {
    expect(runChecks('DISPLAY: GRID;', checks)[0].ok).toBe(true)
  })
})

describe('runChecks — includesAll', () => {
  const checks = [{ type: 'includesAll', values: ['display: grid', 'gap'], msg: 'needs both' }]

  it('returns ok when all values are present', () => {
    expect(runChecks('display: grid; gap: 16px;', checks)[0].ok).toBe(true)
  })

  it('returns not ok when one value is missing', () => {
    expect(runChecks('display: grid;', checks)[0].ok).toBe(false)
  })
})

describe('runChecks — includesAny', () => {
  const checks = [{ type: 'includesAny', values: ['gap', 'column-gap'], msg: 'needs gap or column-gap' }]

  it('returns ok when at least one value is present', () => {
    expect(runChecks('column-gap: 8px;', checks)[0].ok).toBe(true)
  })

  it('returns not ok when none of the values are present', () => {
    expect(runChecks('display: grid;', checks)[0].ok).toBe(false)
  })
})

describe('runChecks — regex', () => {
  const checks = [{ type: 'regex', pattern: 'repeat\\s*\\(', msg: 'needs repeat()' }]

  it('returns ok when pattern matches', () => {
    expect(runChecks('grid-template-columns: repeat(3, 1fr);', checks)[0].ok).toBe(true)
  })

  it('returns not ok when pattern does not match', () => {
    expect(runChecks('grid-template-columns: 1fr 1fr;', checks)[0].ok).toBe(false)
  })
})

describe('runChecks — mediaQuery', () => {
  const checks = [{ type: 'mediaQuery', values: ['600px', '1fr'], msg: 'needs responsive media query' }]

  it('returns ok when @media and all values are present', () => {
    const css = '@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }'
    expect(runChecks(css, checks)[0].ok).toBe(true)
  })

  it('returns not ok when @media is absent', () => {
    expect(runChecks('.grid { grid-template-columns: 1fr; }', checks)[0].ok).toBe(false)
  })

  it('returns not ok when @media present but required values missing', () => {
    expect(runChecks('@media (max-width: 600px) { }', checks)[0].ok).toBe(false)
  })
})

describe('runChecks — unknown type', () => {
  it('returns ok: false for an unrecognised check type', () => {
    const checks = [{ type: 'nonexistent', msg: 'unknown check' }]
    expect(runChecks('anything', checks)).toEqual([{ ok: false, msg: 'unknown check' }])
  })
})

describe('validateAreas', () => {
  const expected = {
    container: '"header header"\n"main sidebar"',
    items: { header: 'header', main: 'main', sidebar: 'sidebar' },
  }

  it('returns no errors when container and all items are correct', () => {
    const selects = [
      { dataset: { areaItem: 'header' }, value: 'header' },
      { dataset: { areaItem: 'main' }, value: 'main' },
      { dataset: { areaItem: 'sidebar' }, value: 'sidebar' },
    ]
    expect(validateAreas('"header header"\n"main sidebar"', selects, expected)).toEqual([])
  })

  it('returns a container error when grid-template-areas is wrong', () => {
    const selects = [
      { dataset: { areaItem: 'header' }, value: 'header' },
      { dataset: { areaItem: 'main' }, value: 'main' },
      { dataset: { areaItem: 'sidebar' }, value: 'sidebar' },
    ]
    const errors = validateAreas('"header"\n"main sidebar"', selects, expected)
    expect(errors).toContain('grid-template-areas op de container klopt niet')
  })

  it('returns an item error when a grid-area value is wrong', () => {
    const selects = [
      { dataset: { areaItem: 'header' }, value: 'main' },
      { dataset: { areaItem: 'main' }, value: 'main' },
      { dataset: { areaItem: 'sidebar' }, value: 'sidebar' },
    ]
    const errors = validateAreas('"header header"\n"main sidebar"', selects, expected)
    expect(errors).toContain('Item "HEADER" heeft verkeerde grid-area')
  })

  it('returns multiple errors when both container and items are wrong', () => {
    const selects = [
      { dataset: { areaItem: 'header' }, value: 'wrong' },
      { dataset: { areaItem: 'main' }, value: 'wrong' },
      { dataset: { areaItem: 'sidebar' }, value: 'sidebar' },
    ]
    const errors = validateAreas('"wrong"\n"wrong sidebar"', selects, expected)
    expect(errors.length).toBeGreaterThan(1)
  })
})
