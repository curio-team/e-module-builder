import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'child_process'
import { cpSync, existsSync, mkdtempSync, rmSync, readFileSync, unlinkSync } from 'fs'
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
    expect(manifest.weeks).toHaveLength(3)
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

  it('theory HTML contains interactive x-components with data-config', () => {
    const theory = readJson('src/data/theory-week1.json')
    expect(theory.html).toContain('<x-keuzevraag')
    expect(theory.html).toContain('data-config=')
    expect(theory.html).toContain('<x-koppelvraag')
    expect(theory.html).toContain('<x-vind-de-fout')
    expect(theory.html).toContain('<x-invul')
    expect(theory.html).toContain('class="x-component-label">Meerkeuzevraag')
    expect(theory.html).toContain('class="x-component-label">Invuloefening')
    expect(theory.html).toContain('data-component-body')
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

  it('round-trips starterJs and checks for js-playground exercises untouched', () => {
    const ex = readJson('src/data/exercises/week2.json')
    const jsEx = ex.exercises.find(e => e.type === 'js-playground')
    expect(jsEx.starterJs).toContain('fetch')
    expect(jsEx.checks).toEqual([
      {
        type: 'sourceIncludesAll',
        values: ['fetch', 'jsonplaceholder.typicode.com'],
        msg: 'gebruikt fetch() om de JSONPlaceholder API aan te roepen',
      },
      {
        type: 'consoleIncludes',
        value: 'delectus aut autem',
        msg: 'logt de titel van het to-do item naar de console',
      },
    ])
    expect(jsEx.descriptionHtml).toBeUndefined()
  })

  it('adds descriptionHtml only to text-type exercises', () => {
    const ex = readJson('src/data/exercises/week2.json')
    const textEx = ex.exercises.find(e => e.type === 'text')
    const extEx = ex.exercises.find(e => e.type === 'external')
    expect(textEx.descriptionHtml).toBeDefined()
    expect(extEx.descriptionHtml).toBeUndefined()
  })

  it('parses markdown body content into descriptionHtml for text exercises', () => {
    const ex = readJson('src/data/exercises/week2.json')
    const bodyEx = ex.exercises.find(e => e.id === 3)
    expect(bodyEx.descriptionHtml).toContain('<strong>')
    expect(bodyEx.descriptionHtml).toContain('<h2>')
  })

  it('parses interactive x-components in text exercise bodies', () => {
    const ex = readJson('src/data/exercises/week2.json')
    const textEx = ex.exercises.find(e => e.id === 2)
    expect(textEx.descriptionHtml).toContain('<x-keuzevraag')
    expect(textEx.descriptionHtml).toContain('data-config=')
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

describe('build pipeline — woordzoeker', () => {
  it('generates woordzoeker.json with module and week keywords', () => {
    const data = readJson('src/data/woordzoeker.json')
    expect(data.module.length).toBeGreaterThan(0)
    expect(data.weeks.week1.length).toBeGreaterThan(0)
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

  it('parses interactive x-components in practical assessment HTML', () => {
    const assessment = readJson('src/data/meetmoment-praktijk.json')
    expect(assessment.html).toContain('<x-keuzevraag')
    expect(assessment.html).toContain('data-config=')
    expect(assessment.html).toContain('class="x-component-label">Meerkeuzevraag')
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
    expect(existsSync(join(tmpDir, 'public/logo.png'))).toBe(true)
    expect(existsSync(join(tmpDir, 'public/favicon.png'))).toBe(true)
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

  it('meetmoment-praktijk page hydrates interactive x-components', () => {
    const html = readFileSync(join(tmpDir, 'pages/meetmoment-praktijk.html'), 'utf8')
    expect(html).toContain('initProseContent')
  })

  it('generates index.html in the project root', () => {
    expect(existsSync(join(tmpDir, 'index.html'))).toBe(true)
  })
})

describe('build pipeline — optional quiz.md', () => {
  let noQuizDir

  beforeAll(() => {
    noQuizDir = mkdtempSync(join(os.tmpdir(), 'e-module-build-no-quiz-test-'))
    cpSync(TESTBED_CONTENT, join(noQuizDir, 'content'), { recursive: true })
    // Remove quiz.md for week2 to simulate a week without a quiz
    unlinkSync(join(noQuizDir, 'content', 'week2', 'quiz.md'))
    try {
      execFileSync(process.execPath, [join(PKG_DIR, 'build.mjs')], {
        env: { ...process.env, E_MODULE_PROJECT_DIR: noQuizDir },
        stdio: 'pipe',
      })
    } catch (err) {
      console.error('Build pipeline failed:\n', err.stderr?.toString() ?? err.message)
      throw err
    }
  })

  afterAll(() => {
    if (noQuizDir) rmSync(noQuizDir, { recursive: true, force: true })
  })

  function readNoQuizJson(rel) {
    return JSON.parse(readFileSync(join(noQuizDir, rel), 'utf8'))
  }

  it('does not generate meetmoment-quiz-week2.json when quiz.md is absent', () => {
    expect(existsSync(join(noQuizDir, 'src/data/meetmoment-quiz-week2.json'))).toBe(false)
  })

  it('still generates meetmoment-quiz-week1.json when quiz.md exists', () => {
    expect(existsSync(join(noQuizDir, 'src/data/meetmoment-quiz-week1.json'))).toBe(true)
  })

  it('does not generate week2-meetmoment.html when quiz.md is absent', () => {
    expect(existsSync(join(noQuizDir, 'pages/week2-meetmoment.html'))).toBe(false)
  })

  it('still generates week1-meetmoment.html when quiz.md exists', () => {
    expect(existsSync(join(noQuizDir, 'pages/week1-meetmoment.html'))).toBe(true)
  })

  it('excludes Quiz link from week2 nav when quiz.md is absent', () => {
    const manifest = readNoQuizJson('src/data/manifest.json')
    const week2Nav = manifest.nav.weeks.find(w => w.children.some(c => c.href.includes('week2')))
    expect(week2Nav.children.some(c => c.label === 'Quiz')).toBe(false)
  })

  it('includes Quiz link in week1 nav when quiz.md exists', () => {
    const manifest = readNoQuizJson('src/data/manifest.json')
    const week1Nav = manifest.nav.weeks.find(w => w.children.some(c => c.href.includes('week1')))
    expect(week1Nav.children.some(c => c.label === 'Quiz')).toBe(true)
  })

  it('excludes meetmoment page from manifest pages.week for week2', () => {
    const manifest = readNoQuizJson('src/data/manifest.json')
    expect(manifest.pages.week).not.toContain('pages/week2-meetmoment.html')
  })

  it('includes meetmoment page in manifest pages.week for week1', () => {
    const manifest = readNoQuizJson('src/data/manifest.json')
    expect(manifest.pages.week).toContain('pages/week1-meetmoment.html')
  })
})

describe('build pipeline — week3 (no quiz.md)', () => {
  it('generates theory-week3.json with required fields', () => {
    const theory = readJson('src/data/theory-week3.json')
    expect(theory).toMatchObject({
      week: 3,
      title: expect.any(String),
      goal: expect.any(String),
      html: expect.any(String),
    })
  })

  it('generates inleveropdracht-week3.json with required fields', () => {
    const hw = readJson('src/data/inleveropdracht-week3.json')
    expect(hw).toMatchObject({
      week: 3,
      title: expect.any(String),
      html: expect.any(String),
    })
    expect(hw.criteria.length).toBeGreaterThan(0)
  })

  it('does not generate meetmoment-quiz-week3.json because quiz.md is absent', () => {
    expect(existsSync(join(tmpDir, 'src/data/meetmoment-quiz-week3.json'))).toBe(false)
  })

  it('does not generate week3-meetmoment.html because quiz.md is absent', () => {
    expect(existsSync(join(tmpDir, 'pages/week3-meetmoment.html'))).toBe(false)
  })

  it('excludes Quiz link from week3 nav in the manifest', () => {
    const manifest = readJson('src/data/manifest.json')
    const week3Nav = manifest.nav.weeks.find(w => w.children.some(c => c.href.includes('week3')))
    expect(week3Nav).toBeDefined()
    expect(week3Nav.children.some(c => c.label === 'Quiz')).toBe(false)
  })
})
