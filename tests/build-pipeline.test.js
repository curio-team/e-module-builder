import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'child_process'
import { cpSync, existsSync, mkdtempSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const PKG_DIR = join(fileURLToPath(import.meta.url), '..', '..')
const TESTBED_CONTENT = join(PKG_DIR, 'testbed', 'content')

let tmpDir

beforeAll(() => {
  tmpDir = mkdtempSync(join(os.tmpdir(), 'e-module-build-test-'))
  cpSync(TESTBED_CONTENT, join(tmpDir, 'content'), { recursive: true })
  try {
    execFileSync(process.execPath, [join(PKG_DIR, 'build.mjs')], {
      env: { ...process.env, E_MODULE_PROJECT_DIR: tmpDir },
      stdio: 'pipe',
    })
  } catch (err) {
    console.error('Build pipeline failed:\n', err.stderr?.toString() ?? err.message)
    throw err
  }
})

afterAll(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true })
})

function readJson(rel) {
  return JSON.parse(readFileSync(join(tmpDir, rel), 'utf8'))
}

describe('build pipeline — manifest', () => {
  it('generates manifest.json with correct module name and week count', () => {
    const manifest = readJson('src/data/manifest.json')
    expect(manifest.module.name).toBe('CSS Grid Basis')
    expect(manifest.weeks).toHaveLength(2)
    expect(manifest.nav).toBeDefined()
  })
})

describe('build pipeline — theory', () => {
  it('generates theory-week1.json with required fields', () => {
    const theory = readJson('src/data/theory-week1.json')
    expect(theory).toMatchObject({
      week: 1,
      title: expect.any(String),
      goal: expect.any(String),
      html: expect.any(String),
    })
  })

  it('theory HTML contains rendered markdown', () => {
    const theory = readJson('src/data/theory-week1.json')
    expect(theory.html).toContain('<h2>')
  })
})

describe('build pipeline — quiz', () => {
  it('generates meetmoment-quiz-week1.json with questions and passScore', () => {
    const quiz = readJson('src/data/meetmoment-quiz-week1.json')
    expect(quiz.questions).toHaveLength(4)
    expect(quiz.passScore).toBe(70)
  })
})

describe('build pipeline — exercises', () => {
  it('generates exercises/week1.json with all three exercise types', () => {
    const ex = readJson('src/data/exercises/week1.json')
    const types = ex.exercises.map(e => e.type)
    expect(types).toContain('css-playground')
    expect(types).toContain('areas')
    expect(types).toContain('responsive')
  })

  it('generates exercises/week2.json with external and text types', () => {
    const ex = readJson('src/data/exercises/week2.json')
    const types = ex.exercises.map(e => e.type)
    expect(types).toContain('external')
    expect(types).toContain('text')
  })

  it('adds descriptionHtml only to text-type exercises', () => {
    const ex = readJson('src/data/exercises/week2.json')
    const textEx = ex.exercises.find(e => e.type === 'text')
    const extEx = ex.exercises.find(e => e.type === 'external')
    expect(textEx.descriptionHtml).toBeDefined()
    expect(extEx.descriptionHtml).toBeUndefined()
  })
})

describe('build pipeline — assignment', () => {
  it('generates inleveropdracht-week1.json with required fields', () => {
    const hw = readJson('src/data/inleveropdracht-week1.json')
    expect(hw).toMatchObject({
      week: 1,
      title: expect.any(String),
      html: expect.any(String),
    })
    expect(hw.criteria.length).toBeGreaterThan(0)
    expect(hw.maxPoints).toBeGreaterThan(0)
  })

  it('assignment HTML contains rendered markdown', () => {
    const hw = readJson('src/data/inleveropdracht-week1.json')
    expect(hw.html).toContain('<h2>')
    expect(hw.html).toContain('<strong>')
  })

  it('does not contain legacy case or assignment fields', () => {
    const hw = readJson('src/data/inleveropdracht-week1.json')
    expect(hw.case).toBeUndefined()
    expect(hw.assignment).toBeUndefined()
  })

  it('generates inleveropdracht-week2.json with html field', () => {
    const hw = readJson('src/data/inleveropdracht-week2.json')
    expect(hw.html).toContain('<h2>')
    expect(hw.html).toContain('<code>')
  })
})

describe('build pipeline — checklist', () => {
  it('generates checklist.json with groups from leeruitkomsten', () => {
    const checklist = readJson('src/data/checklist.json')
    expect(checklist.groups.length).toBeGreaterThanOrEqual(2)
    expect(checklist.groups[0].items.length).toBeGreaterThan(0)
  })

  it('includes the algemeen group from module.md', () => {
    const checklist = readJson('src/data/checklist.json')
    const algemeen = checklist.groups.find(g => g.id === 'algemeen')
    expect(algemeen).toBeDefined()
    expect(algemeen.items.length).toBeGreaterThan(0)
  })
})

describe('build pipeline — assessments', () => {
  it('generates meetmoment-theorie.json with questions', () => {
    const assessment = readJson('src/data/meetmoment-theorie.json')
    expect(assessment.questions.length).toBeGreaterThan(0)
  })

  it('generates meetmoment-praktijk.json with html content', () => {
    const assessment = readJson('src/data/meetmoment-praktijk.json')
    expect(typeof assessment.html).toBe('string')
    expect(assessment.html.length).toBeGreaterThan(0)
  })
})

describe('build pipeline — static assets', () => {
  it('copies non-markdown files from content/weekN/ to public/weekN/', () => {
    expect(existsSync(join(tmpDir, 'public/week1/grid-diagram.svg'))).toBe(true)
    expect(existsSync(join(tmpDir, 'public/week1/wireframe.svg'))).toBe(true)
  })

  it('copies exercise assets preserving subfolder structure', () => {
    expect(existsSync(join(tmpDir, 'public/week2/exercises/ex-image.svg'))).toBe(true)
  })

  it('copies package public files (logo, favicon) to public/', () => {
    expect(existsSync(join(tmpDir, 'public/logo.svg'))).toBe(true)
    expect(existsSync(join(tmpDir, 'public/favicon.svg'))).toBe(true)
  })

  it('rewrites relative image src in theory HTML to ../weekN/ prefix', () => {
    const theory = readJson('src/data/theory-week1.json')
    expect(theory.html).toContain('<img src="../week1/grid-diagram.svg"')
  })

  it('does not rewrite external image URLs in theory HTML', () => {
    const theory = readJson('src/data/theory-week1.json')
    expect(theory.html).toContain('src="https://placehold.co/600x400"')
  })

  it('rewrites relative image src in assignment HTML to ../weekN/ prefix', () => {
    const hw = readJson('src/data/inleveropdracht-week1.json')
    expect(hw.html).toContain('<img src="../week1/wireframe.svg"')
  })

  it('rewrites relative image src in exercise descriptionHtml to ../weekN/exercises/ prefix', () => {
    const ex = readJson('src/data/exercises/week2.json')
    const textEx = ex.exercises.find(e => e.type === 'text')
    expect(textEx.descriptionHtml).toContain('<img src="../week2/exercises/ex-image.svg"')
  })
})

describe('build pipeline — HTML pages', () => {
  it('generates per-week page stubs for both weeks', () => {
    expect(existsSync(join(tmpDir, 'pages/week1-theorie.html'))).toBe(true)
    expect(existsSync(join(tmpDir, 'pages/week1-oefeningen.html'))).toBe(true)
    expect(existsSync(join(tmpDir, 'pages/week1-meetmoment.html'))).toBe(true)
    expect(existsSync(join(tmpDir, 'pages/week1-inleveropdracht.html'))).toBe(true)
    expect(existsSync(join(tmpDir, 'pages/week2-theorie.html'))).toBe(true)
  })

  it('generates static pages (checklist, assessment pages)', () => {
    expect(existsSync(join(tmpDir, 'pages/checklist.html'))).toBe(true)
    expect(existsSync(join(tmpDir, 'pages/meetmoment-theorie.html'))).toBe(true)
    expect(existsSync(join(tmpDir, 'pages/meetmoment-praktijk.html'))).toBe(true)
  })

  it('generates index.html in the project root', () => {
    expect(existsSync(join(tmpDir, 'index.html'))).toBe(true)
  })
})
