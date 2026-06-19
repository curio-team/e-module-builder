import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { Marked } from 'marked'
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';

const PKG_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = process.env.E_MODULE_PROJECT_DIR ?? process.cwd()
const CONTENT = path.join(PROJECT_DIR, 'content')
const SRC_DATA = path.join(PROJECT_DIR, 'src/data')
const PAGES = path.join(PROJECT_DIR, 'pages')
const TEMPLATES = path.join(PKG_DIR, 'templates/pages')

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
)

// ─── helpers ────────────────────────────────────────────────────────────────

function rewriteAssetPaths(html, basePath) {
  if (!basePath || !html) return html
  const prefix = `../${basePath}/`
  html = html.replace(
    /(<img\s[^>]*\bsrc=")(?!https?:\/\/|\/|data:|\.\.)([^"]+)(")/g,
    `$1${prefix}$2$3`
  )
  html = html.replace(
    /(<a\s[^>]*\bhref=")(?!https?:\/\/|\/|#|mailto:|\.\.)([^"]+)(")/g,
    `$1${prefix}$2$3`
  )
  return html
}

function copyStaticAssets() {
  const PUBLIC_DIR = path.join(PROJECT_DIR, 'public')

  const pkgPublic = path.join(PKG_DIR, 'public')
  if (fs.existsSync(pkgPublic)) {
    fs.cpSync(pkgPublic, PUBLIC_DIR, { recursive: true })
  }

  function walkAndCopy(srcDir, relPath) {
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const srcPath = path.join(srcDir, entry.name)
      const destRel = relPath ? `${relPath}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walkAndCopy(srcPath, destRel)
      } else if (!entry.name.endsWith('.md') && !entry.name.endsWith('.html')) {
        const destPath = path.join(PUBLIC_DIR, destRel)
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
  walkAndCopy(CONTENT, '')
}

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
    html: rewriteAssetPaths(marked.parse(theoryMd.content ?? ''), `week${weekNum}`),
  }
  writeJson(SRC_DATA, `theory-week${weekNum}.json`, theoryOut)

  // quiz.md → src/data/meetmoment-quiz-weekN.json
  const quizMd = readMd(path.join(dir, 'quiz.md'))
  const quizOut = {
    title: quizMd.data.title,
    passScore: quizMd.data.passScore ?? 70,
    questions: quizMd.data.questions ?? [],
  }
  writeJson(SRC_DATA, `meetmoment-quiz-week${weekNum}.json`, quizOut)

  // exercises/ subfolder → src/data/exercises/weekN.json
  const exDir = path.join(dir, 'exercises')
  const metaMd = readMd(path.join(exDir, '_meta.md'))
  const exerciseFiles = fs.readdirSync(exDir)
    .filter(f => f.endsWith('.md') && f !== '_meta.md')
    .sort((a, b) => parseInt(a) - parseInt(b))
  const exercises = exerciseFiles.map(f => {
    const ex = readMd(path.join(exDir, f)).data
    if (!ex.type || ex.type === 'text') {
      ex.descriptionHtml = rewriteAssetPaths(marked.parse(ex.description ?? ''), `week${weekNum}/exercises`)
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
  const hwOut = {
    week: hwMd.data.week ?? weekNum,
    title: hwMd.data.title,
    subtitle: hwMd.data.subtitle ?? '',
    html: rewriteAssetPaths(marked.parse(hwMd.content ?? ''), `week${weekNum}`),
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
      { key: 'meetmoment', href: `/pages/week${weekNum}-meetmoment.html`, label: 'Meetmoment' },
      { key: 'oefening', href: `/pages/week${weekNum}-oefening.html`, label: 'Oefening' },
      { key: 'inleveropdracht', href: `/pages/week${weekNum}-inleveropdracht.html`, label: 'Inleveropdracht' },
    ],
  })
}

// ─── 4. assessment data (parsed early so navLabel is available for manifest) ───────

const ASSESSMENTS_DIR = path.join(CONTENT, 'assessments')

function buildAssessmentData(filePath, fallbackTitle, fallbackNavLabel, fallbackDescription) {
  if (fs.existsSync(filePath)) {
    const md = readMd(filePath)
    return {
      title: md.data.title ?? fallbackTitle,
      navLabel: md.data.navLabel ?? fallbackNavLabel,
      description: md.data.description ?? fallbackDescription,
      passScore: md.data.passScore ?? 70,
      questions: md.data.questions ?? [],
    }
  }
  return { title: fallbackTitle, navLabel: fallbackNavLabel, description: fallbackDescription, passScore: 70, questions: [] }
}

const theoryAssessmentData = buildAssessmentData(
  path.join(ASSESSMENTS_DIR, 'theory-assessment.md'),
  `Meetmoment theorie — ${mod.name}`,
  'Meetmoment Theorie',
  'Meerkeuzevragen over de module. Minimaal 70% om te slagen.'
)
const practicalAssessmentData = buildAssessmentData(
  path.join(ASSESSMENTS_DIR, 'practical-assessment.md'),
  `Meetmoment praktijk — ${mod.name}`,
  'Meetmoment Praktijk',
  'Praktijkvragen over de module. Minimaal 70% om te slagen.'
)

// ─── 5. manifest.json ────────────────────────────────────────────────────────

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
        { href: `/pages/week${wk.week}-meetmoment.html`, label: 'Quiz' },
        { href: `/pages/week${wk.week}-inleveropdracht.html`, label: 'Inleveropdracht' },
      ],
    })),
    assessmentSection: {
      label: mod.assessmentSectionLabel ?? 'Afronding',
      children: [
        { href: '/pages/checklist.html', label: 'Checklist' },
        { href: '/pages/meetmoment-theorie.html', label: theoryAssessmentData.navLabel },
        { href: '/pages/meetmoment-praktijk.html', label: practicalAssessmentData.navLabel },
      ],
    },
  },
  pages: {
    static: [
      'index.html',
      'pages/checklist.html',
      'pages/meetmoment-theorie.html',
      'pages/meetmoment-praktijk.html',
    ],
    week: weeksData.flatMap(wk => [
      `pages/week${wk.week}-theorie.html`,
      `pages/week${wk.week}-oefeningen.html`,
      `pages/week${wk.week}-meetmoment.html`,
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

// ─── 5b. write assessment data JSON files ──────────────────────────────────────────

writeJson(SRC_DATA, 'meetmoment-theorie.json', theoryAssessmentData)
writeJson(SRC_DATA, 'meetmoment-praktijk.json', practicalAssessmentData)

// ─── 6. generate per-week page stubs ─────────────────────────────────────────

const PAGE_TYPES = [
  {
    tplFile: 'theorie.html',
    suffix: 'theorie',
    pageTitle: wk => `Theorie Week ${wk.week} — ${wk.title}`,
  },
  {
    tplFile: 'meetmoment.html',
    suffix: 'meetmoment',
    pageTitle: wk => `Meetmoment Week ${wk.week} — ${wk.title}`,
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

// ─── 7. copy static pages (checklist, assessments) with title substitution ─────────

const STATIC_PAGES = [
  { src: 'checklist.html', pageTitle: `Checklist — ${mod.name}` },
  {
    src: 'meetmoment-theorie.html',
    pageTitle: `${theoryAssessmentData.navLabel} — ${mod.name}`,
    assessmentTitle: theoryAssessmentData.navLabel,
    assessmentDescription: theoryAssessmentData.description,
  },
  {
    src: 'meetmoment-praktijk.html',
    pageTitle: `${practicalAssessmentData.navLabel} — ${mod.name}`,
    assessmentTitle: practicalAssessmentData.navLabel,
    assessmentDescription: practicalAssessmentData.description,
  },
]

for (const { src, pageTitle, assessmentTitle, assessmentDescription } of STATIC_PAGES) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, src), 'utf8')
  const out = applyTemplate(tpl, { pageTitle, assessmentTitle, assessmentDescription })
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

copyStaticAssets()

console.log(`Build complete: ${weekCount} weeks → src/data/ and pages/`)
