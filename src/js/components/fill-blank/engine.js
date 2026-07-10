const BLANK_TOKEN = '___'

export function splitCodeBlanks(code) {
  const parts = String(code ?? '').split(BLANK_TOKEN)
  const blankCount = Math.max(0, parts.length - 1)
  return { parts, blankCount }
}

export function normalizeAnswer(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function validateFillBlank(blanks, values) {
  const results = (blanks ?? []).map((blank, index) => {
    const expected = normalizeAnswer(blank.answer)
    const given = normalizeAnswer(values[index])
    const correct = expected === given
    return { index, correct, expected: blank.answer, given: values[index] ?? '' }
  })
  const allCorrect = results.length > 0 && results.every((r) => r.correct)
  return { allCorrect, results }
}

export function assertBlankCount(code, blanks) {
  const { blankCount } = splitCodeBlanks(code)
  const configCount = blanks?.length ?? 0
  if (blankCount !== configCount) {
    throw new Error(`Invuloefening: ${blankCount} ___ placeholders, maar ${configCount} blanks in config`)
  }
}
