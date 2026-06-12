import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { marked } from 'marked'

const PKG_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = process.env.E_MODULE_PROJECT_DIR ?? process.cwd()
const CONTENT = path.join(PROJECT_DIR, 'content')
const SRC_DATA = path.join(PROJECT_DIR, 'src/data')
const PAGES = path.join(PROJECT_DIR, 'pages')
const TEMPLATES = path.join(PKG_DIR, 'templates/pages')

// ─── helpers ────────────────────────────────────────────────────────────────

function readMd(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return matter(raw)
}

function writeJson(dir, filename, data) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2))
}

function applyTemplate(tpl, vars) {
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), v),
    tpl
  )
}

// Recognize <x-*> tags as block-level elements so marked doesn't wrap them in <p>.
marked.use({
  extensions: [{
    name: 'customElement',
    level: 'block',
    start(src) { return src.indexOf('<x-') },
    tokenizer(src) {
      const match = /^<(x-[a-z-]+)([^>]*)>([\s\S]*?)<\/\1>/.exec(src)
      if (match) {
        return { type: 'customElement', raw: match[0], tag: match[1], attrs: match[2].trim(), html: match[3] }
      }
    },
    renderer(token) {
      return `<${token.tag}${token.attrs ? ' ' + token.attrs : ''}>${marked.parse(token.html)}</${token.tag}>\n`
    },
  }],
})

// ─── 1. parse module.md ─────────────────────────────────────────────────────

const moduleMd = readMd(path.join(CONTENT, 'module.md'))
const mod = moduleMd.data

// ─── 2. discover week directories ────────────────────────────────────────────

const weekDirs = fs
  .readdirSync(CONTENT)
  .filter(d => /^week\d+$/.test(d) && fs.statSync(path.join(CONTENT, d)).isDirectory())
  .sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)))

const weekCount = mod.weeks > 0 ? mod.weeks : weekDirs.length
const activeWeeks = weekDirs.slice(0, weekCount)

// ─── 3. process each week ────────────────────────────────────────────────────

const weeksData = []

for (const weekDir of activeWeeks) {
  const weekNum = parseInt(weekDir.slice(4))
  const dir = path.join(CONTENT, weekDir)

  // theory.md → src/data/theory-weekN.json
  const theoryMd = readMd(path.join(dir, 'theory.md'))
  const theoryOut = {
    week: theoryMd.data.week ?? weekNum,
    title: theoryMd.data.title,
    goal: theoryMd.data.goal,
    accent: theoryMd.data.accent,
    html: marked.parse(theoryMd.content ?? ''),
  }
  writeJson(SRC_DATA, `theory-week${weekNum}.json`, theoryOut)

  // quiz.md → src/data/tussentoets-weekN.json
  const quizMd = readMd(path.join(dir, 'quiz.md'))
  const quizOut = {
    title: quizMd.data.title,
    passScore: quizMd.data.passScore ?? 70,
    questions: quizMd.data.questions ?? [],
  }
  writeJson(SRC_DATA, `tussentoets-week${weekNum}.json`, quizOut)

  // exercises/ subfolder → src/data/exercises/weekN.json
  const exDir = path.join(dir, 'exercises')
  const metaMd = readMd(path.join(exDir, '_meta.md'))
  const exerciseFiles = fs.readdirSync(exDir)
    .filter(f => f.endsWith('.md') && f !== '_meta.md')
    .sort((a, b) => parseInt(a) - parseInt(b))
  const exercises = exerciseFiles.map(f => {
    const ex = readMd(path.join(exDir, f)).data
    if (!ex.type || ex.type === 'text') {
      ex.descriptionHtml = marked.parse(ex.description ?? '')
    }
    return ex
  })
  const exOut = {
    week: metaMd.data.week ?? weekNum,
    title: metaMd.data.title,
    color: metaMd.data.color,
    ...(metaMd.data.mode ? { mode: metaMd.data.mode } : {}),
    exercises,
  }
  writeJson(path.join(SRC_DATA, 'exercises'), `week${weekNum}.json`, exOut)

  // assignment.md → src/data/inleveropdracht-weekN.json
  const hwMd = readMd(path.join(dir, 'assignment.md'))
  const hwBody = hwMd.content.trim()
  const hwParas = hwBody.split(/\n\n+/)
  const hwOut = {
    week: hwMd.data.week ?? weekNum,
    title: hwMd.data.title,
    subtitle: hwMd.data.subtitle ?? '',
    client: hwMd.data.client ?? '',
    case: hwParas[0] ?? '',
    assignment: hwParas.slice(1).join('\n\n'),
    deliverables: hwMd.data.deliverables ?? [],
    criteria: hwMd.data.criteria ?? [],
    maxPoints: hwMd.data.maxPoints ?? 0,
    tips: hwMd.data.tips ?? [],
  }
  writeJson(SRC_DATA, `inleveropdracht-week${weekNum}.json`, hwOut)

  weeksData.push({
    week: weekNum,
    title: theoryMd.data.title,
    summary: theoryMd.data.summary ?? '',
    goal: theoryMd.data.goal,
    leeruitkomsten: theoryMd.data.leeruitkomsten ?? [],
    color: theoryMd.data.accent,
    pages: [
      { key: 'theorie', href: `/pages/week${weekNum}-theorie.html`, label: 'Theorie' },
      { key: 'oefeningen', href: `/pages/week${weekNum}-oefeningen.html`, label: 'Oefeningen' },
      { key: 'toets', href: `/pages/week${weekNum}-toets.html`, label: 'Tussentoets' },
      { key: 'oefening', href: `/pages/week${weekNum}-oefening.html`, label: 'Oefening' },
      { key: 'inleveropdracht', href: `/pages/week${weekNum}-inleveropdracht.html`, label: 'Inleveropdracht' },
    ],
  })
}

// ─── 4. manifest.json ────────────────────────────────────────────────────────

const manifest = {
  module: {
    name: mod.name,
    subtitle: mod.subtitle ?? 'E-module',
    youtube: mod.youtube ?? null,
    weeks: weekCount,
    language: mod.language ?? 'nl',
    description: mod.description ?? '',
    logoAlt: mod.logoAlt ?? mod.name,
    exerciseMode: mod.exerciseMode ?? 'external',
  },
  weeks: weeksData,
  nav: {
    home: { href: '/index.html', label: 'Home' },
    weeks: weeksData.map(wk => ({
      label: `Week ${wk.week}`,
      title: wk.title,
      children: [
        { href: `/pages/week${wk.week}-theorie.html`, label: 'Theorie' },
        { href: `/pages/week${wk.week}-oefeningen.html`, label: 'Oefeningen' },
        { href: `/pages/week${wk.week}-toets.html`, label: 'Tussentoets' },
        { href: `/pages/week${wk.week}-inleveropdracht.html`, label: 'Inleveropdracht' },
      ],
    })),
    examPages: [
      { href: '/pages/checklist.html', label: 'Checklist' },
      { href: '/pages/toets-theorie.html', label: 'Eindtoets theorie' },
      { href: '/pages/toets-praktijk.html', label: 'Eindtoets praktijk' },
    ],
  },
  pages: {
    static: [
      'index.html',
      'pages/checklist.html',
      'pages/toets-theorie.html',
      'pages/toets-praktijk.html',
    ],
    week: weeksData.flatMap(wk => [
      `pages/week${wk.week}-theorie.html`,
      `pages/week${wk.week}-oefeningen.html`,
      `pages/week${wk.week}-toets.html`,
      `pages/week${wk.week}-oefening.html`,
      `pages/week${wk.week}-inleveropdracht.html`,
    ]),
  },
  content: {
    status: 'generated',
    aiInstructions: mod.aiInstructions ?? '',
  },
}

writeJson(SRC_DATA, 'manifest.json', manifest)

// ─── 5. checklist.json ───────────────────────────────────────────────────────

const checklistGroups = weeksData.map(wk => ({
  id: `week${wk.week}`,
  title: `Week ${wk.week} — ${wk.title}`,
  color: wk.color,
  items: (wk.leeruitkomsten ?? []).map((text, i) => ({
    id: `week${wk.week}-item-${i}`,
    text,
  })),
}))

if (mod.algemeen?.length) {
  checklistGroups.push({
    id: 'algemeen',
    title: 'Algemeen',
    color: 'slate',
    items: mod.algemeen.map((text, i) => ({ id: `algemeen-item-${i}`, text })),
  })
}

writeJson(SRC_DATA, 'checklist.json', { groups: checklistGroups })

// ─── 5b. exam data files (optional content/exams/*.md, else empty placeholder) ─

function buildExamData(filePath, fallbackTitle) {
  if (fs.existsSync(filePath)) {
    const md = readMd(filePath)
    return {
      title: md.data.title ?? fallbackTitle,
      passScore: md.data.passScore ?? 70,
      questions: md.data.questions ?? [],
    }
  }
  return { title: fallbackTitle, passScore: 70, questions: [] }
}

const EXAMS_DIR = path.join(CONTENT, 'exams')
writeJson(
  SRC_DATA,
  'toets-theorie.json',
  buildExamData(path.join(EXAMS_DIR, 'theory-exam.md'), `Eindtoets theorie — ${mod.name}`)
)
writeJson(
  SRC_DATA,
  'toets-praktijk.json',
  buildExamData(path.join(EXAMS_DIR, 'practical-exam.md'), `Eindtoets praktijk — ${mod.name}`)
)

// ─── 6. generate per-week page stubs ─────────────────────────────────────────

const PAGE_TYPES = [
  {
    tplFile: 'theorie.html',
    suffix: 'theorie',
    pageTitle: wk => `Theorie Week ${wk.week} — ${wk.title}`,
  },
  {
    tplFile: 'toets.html',
    suffix: 'toets',
    pageTitle: wk => `Tussentoets Week ${wk.week} — ${wk.title}`,
  },
  {
    tplFile: 'oefeningen.html',
    suffix: 'oefeningen',
    pageTitle: wk => `Oefeningen Week ${wk.week} — ${wk.title}`,
  },
  {
    tplFile: 'oefening.html',
    suffix: 'oefening',
    pageTitle: wk => `Oefening — Week ${wk.week}`,
  },
  {
    tplFile: 'inleveropdracht.html',
    suffix: 'inleveropdracht',
    pageTitle: wk => `Inleveropdracht Week ${wk.week} — ${wk.title}`,
  },
]

fs.mkdirSync(PAGES, { recursive: true })

for (const { tplFile, suffix, pageTitle } of PAGE_TYPES) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, tplFile), 'utf8')
  for (const wk of weeksData) {
    const out = applyTemplate(tpl, {
      week: String(wk.week),
      weekPadded: String(wk.week).padStart(2, '0'),
      weekTitle: wk.title,
      pageTitle: pageTitle(wk),
    })
    fs.writeFileSync(path.join(PAGES, `week${wk.week}-${suffix}.html`), out)
  }
}

// ─── 7. copy static pages (checklist, exams) with title substitution ─────────

const STATIC_PAGES = [
  { src: 'checklist.html', pageTitle: `Checklist — ${mod.name}` },
  { src: 'toets-theorie.html', pageTitle: `Eindtoets theorie — ${mod.name}` },
  { src: 'toets-praktijk.html', pageTitle: `Eindtoets praktijk — ${mod.name}` },
]

for (const { src, pageTitle } of STATIC_PAGES) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, src), 'utf8')
  const out = applyTemplate(tpl, { pageTitle })
  fs.writeFileSync(path.join(PAGES, src), out)
}

// ─── 8. copy content/*.html files verbatim to pages/ ─────────────────────────

const htmlFiles = fs.readdirSync(CONTENT).filter(f => f.endsWith('.html'))
for (const f of htmlFiles) {
  fs.copyFileSync(path.join(CONTENT, f), path.join(PAGES, f))
}

// ─── 8b. generate index.html from template ───────────────────────────────────

const indexTpl = fs.readFileSync(path.join(PKG_DIR, 'templates/index.html'), 'utf8')
fs.writeFileSync(path.join(PROJECT_DIR, 'index.html'), applyTemplate(indexTpl, { pageTitle: mod.name }))

console.log(`Build complete: ${weekCount} weeks → src/data/ and pages/`)
