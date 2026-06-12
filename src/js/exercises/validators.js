export function normalizeCss(css) {
  return css.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * @param {string} css
 * @param {Array<{type: string, value?: string, values?: string[], pattern?: string, msg: string}>} checks
 */
export function runChecks(css, checks) {
  const n = normalizeCss(css)
  return checks.map((check) => {
    let ok = false
    switch (check.type) {
      case 'includes':
        ok = n.includes(check.value.toLowerCase())
        break
      case 'includesAll':
        ok = check.values.every((v) => n.includes(v.toLowerCase()))
        break
      case 'includesAny':
        ok = check.values.some((v) => n.includes(v.toLowerCase()))
        break
      case 'regex':
        ok = new RegExp(check.pattern, 'i').test(css)
        break
      case 'mediaQuery':
        ok = n.includes('@media') && check.values.every((v) => n.includes(v.toLowerCase()))
        break
      default:
        ok = false
    }
    return { ok, msg: check.msg }
  })
}

export function validateAreas(containerValue, selects, expected) {
  const errors = []
  const normalized = containerValue.replace(/\s+/g, ' ').trim().toLowerCase()
  const expectedNorm = expected.container.replace(/\s+/g, ' ').trim().toLowerCase()

  if (normalized !== expectedNorm) {
    errors.push('grid-template-areas op de container klopt niet')
  }

  selects.forEach((select) => {
    const id = select.dataset.areaItem
    if (select.value !== expected.items[id]) {
      errors.push(`Item "${id.toUpperCase()}" heeft verkeerde grid-area`)
    }
  })

  return errors
}
