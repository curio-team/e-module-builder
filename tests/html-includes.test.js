import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { htmlIncludes } from '../vite-plugin-html-includes.js'
import fs from 'fs'
import os from 'os'
import path from 'path'

let tmpDir

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-includes-test-'))
  fs.writeFileSync(path.join(tmpDir, 'head.html'), '<meta charset="UTF-8">')
  fs.writeFileSync(path.join(tmpDir, 'nav.html'), '<nav>Menu</nav>')
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function getHandler() {
  return htmlIncludes({ partialsDir: tmpDir }).transformIndexHtml.handler
}

describe('htmlIncludes handler', () => {
  it('replaces a known include comment with the partial content', () => {
    const result = getHandler()('<!DOCTYPE html><!-- include:head --><body></body>')
    expect(result).toContain('<meta charset="UTF-8">')
    expect(result).not.toContain('<!-- include:head -->')
  })

  it('leaves HTML without include comments intact', () => {
    const html = '<html><!-- some other comment --><body></body></html>'
    expect(getHandler()(html)).toBe(html)
  })

  it('throws with a descriptive error for a missing partial', () => {
    expect(() => getHandler()('<!-- include:missing -->')).toThrow('HTML partial ontbreekt')
  })

  it('replaces multiple includes in a single file', () => {
    const result = getHandler()('<!-- include:head --><!-- include:nav -->')
    expect(result).toContain('<meta charset="UTF-8">')
    expect(result).toContain('<nav>Menu</nav>')
  })
})
