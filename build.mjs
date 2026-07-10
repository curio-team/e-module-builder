import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from '@11ty/gray-matter'
import { Marked } from 'marked'
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import YAML from 'yaml'
import { INTERACTIVE_TAGS, getComponentMeta } from './src/js/x-components/registry.js'
import { renderComponentLabel } from './src/js/x-components/shared.js'
import { extractKeywordsFromMarkdown, mergeKeywordLists } from './src/js/components/word-search/keywords.js'

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

const SECTION_RE = /^([a-zA-Z]+)(\d+)$/

function sectionLabel(prefix, num) {
  return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)} ${num}`
}

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

function collectSectionMarkdown(dir) {
  const chunks = []
  for (const name of ['theory.md', 'quiz.md', 'assignment.md']) {
    const filePath = path.join(dir, name)
    if (fs.existsSync(filePath)) chunks.push(fs.readFileSync(filePath, 'utf8'))
  }
  const exDir = path.join(dir, 'exercises')
  if (fs.existsSync(exDir)) {
    for (const file of fs.readdirSync(exDir)) {
      if (file.endsWith('.md')) chunks.push(fs.readFileSync(path.join(exDir, file), 'utf8'))
    }
  }
  return chunks.join('\n')
}

const woordzoekerData = { weeks: {}, module: [] }
const INTERACTIVE_TAG_SET = INTERACTIVE_TAGS

function escapeHtmlAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function prepareInteractiveConfig(tag, body) {
  const config = YAML.parse(body.trim()) ?? {}

  if (typeof config.question === 'string') {
    config.question = marked.parseInline(config.question)
  }
  if (typeof config.prompt === 'string') {
    config.prompt = marked.parseInline(config.prompt)
  }

  return config
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
      if (INTERACTIVE_TAG_SET.has(token.tag)) {
        const meta = getComponentMeta(token.tag)
        const config = prepareInteractiveConfig(token.tag, token.html)
        const attrs = token.attrs ? `${token.attrs} ` : ''
        return `<${token.tag} ${attrs}data-component="${meta.slug}" data-config="${escapeHtmlAttr(JSON.stringify(config))}">${renderComponentLabel(meta.label)}<div data-component-body></div></${token.tag}>\n`
      }

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
  .filter(d => SECTION_RE.test(d) && fs.statSync(path.join(CONTENT, d)).isDirectory())
  .sort((a, b) => parseInt(a.match(SECTION_RE)[2]) - parseInt(b.match(SECTION_RE)[2]))

const weekCount = mod.weeks > 0 ? mod.weeks : weekDirs.length
const activeWeeks = weekDirs.slice(0, weekCount)

// ─── 3. process each week ────────────────────────────────────────────────────

const weeksData = []

for (const weekDir of activeWeeks) {
  const [, sectionPrefix, sectionNumStr] = weekDir.match(SECTION_RE)
  const weekNum = parseInt(sectionNumStr)
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

  // quiz.md → src/data/meetmoment-quiz-weekN.json (optional)
  const quizPath = path.join(dir, 'quiz.md')
  const hasQuiz = fs.existsSync(quizPath)
  if (hasQuiz) {
    const quizMd = readMd(quizPath)
    const quizOut = {
      title: quizMd.data.title,
      passScore: quizMd.data.passScore ?? 70,
      questions: quizMd.data.questions ?? [],
    }
    writeJson(SRC_DATA, `meetmoment-quiz-week${weekNum}.json`, quizOut)
  }

  // exercises/ subfolder → src/data/exercises/weekN.json
  const exDir = path.join(dir, 'exercises')
  const metaMd = readMd(path.join(exDir, '_meta.md'))
  const exerciseFiles = fs.readdirSync(exDir)
    .filter(f => f.endsWith('.md') && f !== '_meta.md')
    .sort((a, b) => parseInt(a) - parseInt(b))
  const exercises = exerciseFiles.map(f => {
    const { data: ex, content } = readMd(path.join(exDir, f))
    if (!ex.type || ex.type === 'text') {
      const src = content?.trim() ? content : (ex.description ?? '')
      ex.descriptionHtml = rewriteAssetPaths(marked.parse(src), `week${weekNum}/exercises`)
    }
    ex.descriptionInlineHtml = marked.parseInline(ex.description ?? '')
    if (ex.type === 'external') {
      if (ex.task) ex.taskHtml = marked.parseInline(ex.task)
      if (ex.hint) ex.hintHtml = marked.parse(ex.hint)
      if (ex.solution) ex.solutionHtml = marked.parse(ex.solution)
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
    ...(hwMd.data.linked_theory ? { linked_theory: hwMd.data.linked_theory } : {}),
  }
  writeJson(SRC_DATA, `inleveropdracht-week${weekNum}.json`, hwOut)

  woordzoekerData.weeks[weekDir] = extractKeywordsFromMarkdown(collectSectionMarkdown(dir))

  weeksData.push({
    week: weekNum,
    dirName: weekDir,
    prefix: sectionPrefix,
    hasQuiz,
    title: theoryMd.data.title,
    summary: marked.parseInline(theoryMd.data.summary ?? ''),
    goal: theoryMd.data.goal,
    leeruitkomsten: theoryMd.data.leeruitkomsten ?? [],
    color: theoryMd.data.accent,
    pages: [
      { key: 'theorie', href: `/pages/${weekDir}-theorie.html`, label: 'Theorie' },
      { key: 'oefeningen', href: `/pages/${weekDir}-oefeningen.html`, label: 'Oefeningen' },
      ...(hasQuiz ? [{ key: 'meetmoment', href: `/pages/${weekDir}-meetmoment.html`, label: 'Meetmoment' }] : []),
      { key: 'oefening', href: `/pages/${weekDir}-oefening.html`, label: 'Oefening' },
      { key: 'inleveropdracht', href: `/pages/${weekDir}-inleveropdracht.html`, label: 'Inleveropdracht' },
    ],
  })
}

// ─── 3b. discover & process extra (theory-only) folders ─────────────────────

const IGNORED_DIRS = new Set(['assessments'])

const extraSectionsData = []
for (const d of fs.readdirSync(CONTENT)) {
  if (SECTION_RE.test(d)) continue
  if (IGNORED_DIRS.has(d)) continue
  const dir = path.join(CONTENT, d)
  if (!fs.statSync(dir).isDirectory()) continue
  const theoryPath = path.join(dir, 'theory.md')
  if (!fs.existsSync(theoryPath)) continue

  const theoryMd = readMd(theoryPath)
  const sortKey = theoryMd.data.sort ?? 999

  const theoryOut = {
    title: theoryMd.data.title,
    goal: theoryMd.data.goal,
    accent: theoryMd.data.accent,
    html: rewriteAssetPaths(marked.parse(theoryMd.content ?? ''), d),
  }
  writeJson(SRC_DATA, `theory-${d}.json`, theoryOut)

  // exercises/ subfolder → src/data/exercises/{dirName}.json (optional)
  let hasExercises = false
  const exDir = path.join(dir, 'exercises')
  if (fs.existsSync(exDir) && fs.existsSync(path.join(exDir, '_meta.md'))) {
    hasExercises = true
    const metaMd = readMd(path.join(exDir, '_meta.md'))
    const exerciseFiles = fs.readdirSync(exDir)
      .filter(f => f.endsWith('.md') && f !== '_meta.md')
      .sort((a, b) => parseInt(a) - parseInt(b))
    const exercises = exerciseFiles.map(f => {
      const { data: ex, content } = readMd(path.join(exDir, f))
      if (!ex.type || ex.type === 'text') {
        const src = content?.trim() ? content : (ex.description ?? '')
        ex.descriptionHtml = rewriteAssetPaths(marked.parse(src), `${d}/exercises`)
      }
      ex.descriptionInlineHtml = marked.parseInline(ex.description ?? '')
      if (ex.type === 'external') {
        if (ex.task) ex.taskHtml = marked.parseInline(ex.task)
        if (ex.hint) ex.hintHtml = marked.parse(ex.hint)
        if (ex.solution) ex.solutionHtml = marked.parse(ex.solution)
      }
      return ex
    })
    const exOut = {
      title: metaMd.data.title,
      color: metaMd.data.color,
      ...(metaMd.data.mode ? { mode: metaMd.data.mode } : {}),
      exercises,
    }
    writeJson(path.join(SRC_DATA, 'exercises'), `${d}.json`, exOut)
  }

  // quiz.md → src/data/meetmoment-quiz-{dirName}.json (optional)
  const quizPath = path.join(dir, 'quiz.md')
  const hasQuiz = fs.existsSync(quizPath)
  if (hasQuiz) {
    const quizMd = readMd(quizPath)
    writeJson(SRC_DATA, `meetmoment-quiz-${d}.json`, {
      title: quizMd.data.title,
      passScore: quizMd.data.passScore ?? 70,
      questions: quizMd.data.questions ?? [],
    })
  }

  // assignment.md → src/data/inleveropdracht-{dirName}.json (optional)
  const assignmentPath = path.join(dir, 'assignment.md')
  const hasAssignment = fs.existsSync(assignmentPath)
  if (hasAssignment) {
    const hwMd = readMd(assignmentPath)
    writeJson(SRC_DATA, `inleveropdracht-${d}.json`, {
      title: hwMd.data.title,
      subtitle: hwMd.data.subtitle ?? '',
      html: rewriteAssetPaths(marked.parse(hwMd.content ?? ''), d),
      deliverables: hwMd.data.deliverables ?? [],
      criteria: hwMd.data.criteria ?? [],
      maxPoints: hwMd.data.maxPoints ?? 0,
      tips: hwMd.data.tips ?? [],
      ...(hwMd.data.linked_theory ? { linked_theory: hwMd.data.linked_theory } : {}),
    })
  }

  extraSectionsData.push({
    dirName: d,
    sortKey,
    title: theoryMd.data.title,
    summary: marked.parseInline(theoryMd.data.summary ?? ''),
    leeruitkomsten: theoryMd.data.leeruitkomsten ?? [],
    color: theoryMd.data.accent,
    hasExercises,
    hasQuiz,
    hasAssignment,
    isExtra: true,
  })

  woordzoekerData.weeks[d] = extractKeywordsFromMarkdown(collectSectionMarkdown(dir))
}

// ─── 4. assessment data (parsed early so navLabel is available for manifest) ───────

const ASSESSMENTS_DIR = path.join(CONTENT, 'assessments')

function buildAssessmentData(filePath, fallbackTitle, fallbackNavLabel, fallbackDescription) {
  if (fs.existsSync(filePath)) {
    const md = readMd(filePath)
    return {
      title: md.data.title ?? fallbackTitle,
      navLabel: md.data.navLabel ?? fallbackNavLabel,
      description: marked.parseInline(md.data.description ?? fallbackDescription),
      passScore: md.data.passScore ?? 70,
      questions: md.data.questions ?? [],
    }
  }
  return { title: fallbackTitle, navLabel: fallbackNavLabel, description: marked.parseInline(fallbackDescription), passScore: 70, questions: [] }
}

function buildPracticalAssessmentData(filePath, fallbackTitle, fallbackNavLabel) {
  if (fs.existsSync(filePath)) {
    const md = readMd(filePath)
    return {
      title: md.data.title ?? fallbackTitle,
      navLabel: md.data.navLabel ?? fallbackNavLabel,
      description: marked.parseInline(md.data.description ?? ''),
      html: rewriteAssetPaths(marked.parse(md.content ?? ''), 'assessments'),
    }
  }
  return { title: fallbackTitle, navLabel: fallbackNavLabel, description: '', html: '' }
}

const theoryAssessmentData = buildAssessmentData(
  path.join(ASSESSMENTS_DIR, 'theory-assessment.md'),
  `Meetmoment theorie — ${mod.name}`,
  'Meetmoment Theorie',
  'Meerkeuzevragen over de module. Minimaal 70% om te slagen.'
)
const practicalAssessmentData = buildPracticalAssessmentData(
  path.join(ASSESSMENTS_DIR, 'practical-assessment.md'),
  `Meetmoment praktijk — ${mod.name}`,
  'Meetmoment Praktijk'
)

// ─── 5. manifest.json ────────────────────────────────────────────────────────

const hasTheoryAssessment = fs.existsSync(path.join(ASSESSMENTS_DIR, 'theory-assessment.md'))
const hasPracticalAssessment = fs.existsSync(path.join(ASSESSMENTS_DIR, 'practical-assessment.md'))

const allNavSections = [
  ...weeksData.map(wk => ({ ...wk, sortKey: wk.week })),
  ...extraSectionsData,
].sort((a, b) => a.sortKey - b.sortKey)

const manifest = {
  module: {
    name: mod.name,
    subtitle: mod.subtitle ?? 'E-module',
    youtube: mod.youtube ?? null,
    youtubeTitle: mod.youtubeTitle ?? null,
    weeks: weekCount,
    language: mod.language ?? 'nl',
    description: marked.parseInline(mod.description ?? ''),
    logoAlt: mod.logoAlt ?? mod.name,
    exerciseMode: mod.exerciseMode ?? 'external',
  },
  weeks: weeksData,
  nav: {
    home: { href: '/index.html', label: 'Home' },
    weeks: allNavSections.map(sec => ({
      label: sec.isExtra
        ? sec.dirName.charAt(0).toUpperCase() + sec.dirName.slice(1)
        : sectionLabel(sec.prefix, sec.week),
      title: sec.title,
      children: sec.isExtra
        ? [
          { href: `/pages/${sec.dirName}-theorie.html`, label: 'Theorie' },
          ...(sec.hasExercises ? [{ href: `/pages/${sec.dirName}-oefeningen.html`, label: 'Oefeningen' }] : []),
          ...(sec.hasQuiz ? [{ href: `/pages/${sec.dirName}-meetmoment.html`, label: 'Quiz' }] : []),
          ...(sec.hasAssignment ? [{ href: `/pages/${sec.dirName}-inleveropdracht.html`, label: 'Inleveropdracht' }] : []),
        ]
        : [
          { href: `/pages/${sec.dirName}-theorie.html`, label: 'Theorie' },
          { href: `/pages/${sec.dirName}-oefeningen.html`, label: 'Oefeningen' },
          ...(sec.hasQuiz ? [{ href: `/pages/${sec.dirName}-meetmoment.html`, label: 'Quiz' }] : []),
          { href: `/pages/${sec.dirName}-inleveropdracht.html`, label: 'Inleveropdracht' },
        ],
    })),
    assessmentSection: {
      label: mod.assessmentSectionLabel ?? 'Afronding',
      children: [
        { href: '/pages/checklist.html', label: 'Checklist' },
        ...(hasTheoryAssessment ? [{ href: '/pages/meetmoment-theorie.html', label: theoryAssessmentData.navLabel }] : []),
        ...(hasPracticalAssessment ? [{ href: '/pages/meetmoment-praktijk.html', label: practicalAssessmentData.navLabel }] : []),
      ],
    },
  },
  pages: {
    static: [
      'index.html',
      'pages/checklist.html',
      ...(hasTheoryAssessment ? ['pages/meetmoment-theorie.html'] : []),
      ...(hasPracticalAssessment ? ['pages/meetmoment-praktijk.html'] : []),
    ],
    week: weeksData.flatMap(wk => [
      `pages/${wk.dirName}-theorie.html`,
      `pages/${wk.dirName}-oefeningen.html`,
      ...(wk.hasQuiz ? [`pages/${wk.dirName}-meetmoment.html`] : []),
      `pages/${wk.dirName}-oefening.html`,
      `pages/${wk.dirName}-inleveropdracht.html`,
    ]),
    extra: extraSectionsData.flatMap(s => [
      `pages/${s.dirName}-theorie.html`,
      ...(s.hasExercises ? [`pages/${s.dirName}-oefeningen.html`, `pages/${s.dirName}-oefening.html`] : []),
      ...(s.hasQuiz ? [`pages/${s.dirName}-meetmoment.html`] : []),
      ...(s.hasAssignment ? [`pages/${s.dirName}-inleveropdracht.html`] : []),
    ]),
  },
  content: {
    status: 'generated',
    aiInstructions: mod.aiInstructions ?? '',
  },
}

writeJson(SRC_DATA, 'manifest.json', manifest)

// ─── 5. checklist.json ───────────────────────────────────────────────────────

const checklistGroups = [
  ...weeksData.map(wk => ({
    id: wk.dirName,
    title: `${sectionLabel(wk.prefix, wk.week)} — ${wk.title}`,
    color: wk.color,
    items: (wk.leeruitkomsten ?? []).map((text, i) => ({
      id: `${wk.dirName}-item-${i}`,
      text,
      textHtml: marked.parseInline(text),
    })),
  })),
  ...extraSectionsData.map(sec => ({
    id: sec.dirName,
    title: sec.title,
    color: sec.color,
    items: (sec.leeruitkomsten ?? []).map((text, i) => ({
      id: `${sec.dirName}-item-${i}`,
      text,
      textHtml: marked.parseInline(text),
    })),
  })),
]

if (mod.algemeen?.length) {
  checklistGroups.push({
    id: 'algemeen',
    title: 'Algemeen',
    color: 'slate',
    items: mod.algemeen.map((text, i) => ({ id: `algemeen-item-${i}`, text, textHtml: marked.parseInline(text) })),
  })
}

writeJson(SRC_DATA, 'checklist.json', { groups: checklistGroups })

woordzoekerData.module = mergeKeywordLists(
  Object.values(woordzoekerData.weeks).flat(),
  extractKeywordsFromMarkdown((mod.algemeen ?? []).join('\n')),
  mod.woordzoeker ?? []
)

writeJson(SRC_DATA, 'woordzoeker.json', woordzoekerData)

// ─── 5b. write assessment data JSON files ──────────────────────────────────────────

writeJson(SRC_DATA, 'meetmoment-theorie.json', theoryAssessmentData)
writeJson(SRC_DATA, 'meetmoment-praktijk.json', practicalAssessmentData)

// ─── 6. generate per-week page stubs ─────────────────────────────────────────

const PAGE_TYPES = [
  {
    tplFile: 'theorie.html',
    suffix: 'theorie',
    pageTitle: wk => `Theorie ${sectionLabel(wk.prefix, wk.week)} — ${wk.title}`,
  },
  {
    tplFile: 'meetmoment.html',
    suffix: 'meetmoment',
    pageTitle: wk => `Meetmoment ${sectionLabel(wk.prefix, wk.week)} — ${wk.title}`,
  },
  {
    tplFile: 'oefeningen.html',
    suffix: 'oefeningen',
    pageTitle: wk => `Oefeningen ${sectionLabel(wk.prefix, wk.week)} — ${wk.title}`,
  },
  {
    tplFile: 'oefening.html',
    suffix: 'oefening',
    pageTitle: wk => `Oefening — ${sectionLabel(wk.prefix, wk.week)}`,
  },
  {
    tplFile: 'inleveropdracht.html',
    suffix: 'inleveropdracht',
    pageTitle: wk => `Inleveropdracht ${sectionLabel(wk.prefix, wk.week)} — ${wk.title}`,
  },
]

fs.mkdirSync(PAGES, { recursive: true })

for (const { tplFile, suffix, pageTitle } of PAGE_TYPES) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, tplFile), 'utf8')
  for (const wk of weeksData) {
    if (suffix === 'meetmoment' && !wk.hasQuiz) continue
    const out = applyTemplate(tpl, {
      dirName: wk.dirName,
      sectionLabel: sectionLabel(wk.prefix, wk.week),
      sectionDataKey: `week${wk.week}`,
      sectionHeaderLabel: `Week ${String(wk.week).padStart(2, '0')}`,
      hasMeetmoment: wk.hasQuiz ? 'true' : '',
      week: String(wk.week),
      weekPadded: String(wk.week).padStart(2, '0'),
      weekTitle: wk.title,
      pageTitle: pageTitle(wk),
    })
    fs.writeFileSync(path.join(PAGES, `${wk.dirName}-${suffix}.html`), out)
  }
}

// generate pages for extra sections
const theorieTplStr = fs.readFileSync(path.join(TEMPLATES, 'theorie.html'), 'utf8')
const oefenTplStr = fs.readFileSync(path.join(TEMPLATES, 'oefeningen.html'), 'utf8')
const oefeningTplStr = fs.readFileSync(path.join(TEMPLATES, 'oefening.html'), 'utf8')
const meetmomentTplStr = fs.readFileSync(path.join(TEMPLATES, 'meetmoment.html'), 'utf8')
const inleverTplStr = fs.readFileSync(path.join(TEMPLATES, 'inleveropdracht.html'), 'utf8')
for (const sec of extraSectionsData) {
  const label = sec.dirName.charAt(0).toUpperCase() + sec.dirName.slice(1)
  fs.writeFileSync(path.join(PAGES, `${sec.dirName}-theorie.html`), applyTemplate(theorieTplStr, {
    dirName: sec.dirName,
    sectionLabel: label,
    pageTitle: `${label} — ${sec.title}`,
  }))
  if (sec.hasExercises) {
    fs.writeFileSync(path.join(PAGES, `${sec.dirName}-oefeningen.html`), applyTemplate(oefenTplStr, {
      dirName: sec.dirName,
      sectionLabel: label,
      hasMeetmoment: sec.hasQuiz ? 'true' : '',
      week: sec.dirName,
      weekTitle: sec.title,
      pageTitle: `Oefeningen ${label} — ${sec.title}`,
    }))
    fs.writeFileSync(path.join(PAGES, `${sec.dirName}-oefening.html`), applyTemplate(oefeningTplStr, {
      dirName: sec.dirName,
      sectionLabel: label,
      week: sec.dirName,
      pageTitle: `Oefening — ${label}`,
    }))
  }
  if (sec.hasQuiz) {
    fs.writeFileSync(path.join(PAGES, `${sec.dirName}-meetmoment.html`), applyTemplate(meetmomentTplStr, {
      dirName: sec.dirName,
      sectionLabel: label,
      sectionDataKey: sec.dirName,
      sectionHeaderLabel: label,
      weekTitle: sec.title,
      pageTitle: `Quiz ${label} — ${sec.title}`,
    }))
  }
  if (sec.hasAssignment) {
    fs.writeFileSync(path.join(PAGES, `${sec.dirName}-inleveropdracht.html`), applyTemplate(inleverTplStr, {
      dirName: sec.dirName,
      sectionLabel: label,
      sectionDataKey: sec.dirName,
      sectionHeaderLabel: label,
      pageTitle: `Inleveropdracht ${label} — ${sec.title}`,
    }))
  }
}

// ─── 7. copy static pages (checklist, assessments) with title substitution ─────────

const STATIC_PAGES = [
  { src: 'checklist.html', pageTitle: `Checklist — ${mod.name}` },
  ...(hasTheoryAssessment ? [{
    src: 'meetmoment-theorie.html',
    pageTitle: `${theoryAssessmentData.navLabel} — ${mod.name}`,
    assessmentTitle: theoryAssessmentData.navLabel,
    assessmentDescription: theoryAssessmentData.description,
  }] : []),
  ...(hasPracticalAssessment ? [{
    src: 'meetmoment-praktijk.html',
    pageTitle: `${practicalAssessmentData.navLabel} — ${mod.name}`,
    assessmentTitle: practicalAssessmentData.navLabel,
    assessmentDescription: practicalAssessmentData.description,
  }] : []),
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

console.log(`Build complete: ${weekCount} weeks + ${extraSectionsData.length} extra section(s) → src/data/ and pages/`)
