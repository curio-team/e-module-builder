import fs from 'fs'
import path from 'path'
import matter from '@11ty/gray-matter'
import { Marked } from 'marked'
import PDFDocument from 'pdfkit'

const marked = new Marked()

const SECTION_RE = /^([a-zA-Z]+)(\d+)$/
const IGNORED_DIRS = new Set(['assessments'])
const CUSTOM_EL_RE = /^<(x-[a-z-]+|details)([^>]*)>([\s\S]*?)<\/\1>/i
const CUSTOM_OPEN_ONLY_RE = /^<(x-[a-z-]+|details)([^>]*)>$/i
const SUMMARY_RE = /<summary>([\s\S]*?)<\/summary>/i

// marked splits a custom block like <x-callout>\n\nfoo\n\n</x-callout> into separate
// open-tag / content / close-tag tokens (CommonMark HTML block rule 7 ends at the
// first blank line). Re-merge those into a single html token so CUSTOM_EL_RE can match.
function mergeSplitCustomElements(tokens) {
  const result = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const openMatch = token.type === 'html' ? CUSTOM_OPEN_ONLY_RE.exec(token.raw.trim()) : null
    if (openMatch) {
      const tagName = openMatch[1]
      const closeRe = new RegExp(`^<\\/${tagName}>$`, 'i')
      let j = i + 1
      let innerRaw = ''
      while (j < tokens.length && !(tokens[j].type === 'html' && closeRe.test(tokens[j].raw.trim()))) {
        innerRaw += tokens[j].raw
        j++
      }
      if (j < tokens.length) {
        const merged = token.raw + innerRaw + tokens[j].raw
        result.push({ type: 'html', block: true, raw: merged, text: merged })
        i = j
        continue
      }
    }
    result.push(token)
  }
  return result
}

// ─── Inline token → span list ─────────────────────────────────────────────────

function boldOf(font) {
  return font === 'Helvetica-Oblique' ? 'Helvetica-BoldOblique' : 'Helvetica-Bold'
}
function italicOf(font) {
  return font === 'Helvetica-Bold' ? 'Helvetica-BoldOblique' : 'Helvetica-Oblique'
}

function collectSpans(tokens, spans, ctx) {
  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        if (token.tokens?.length) collectSpans(token.tokens, spans, ctx)
        else if (token.text) spans.push({ ...ctx, text: token.text.replace(/\n/g, ' ') })
        break
      case 'strong':
        collectSpans(token.tokens ?? [], spans, { ...ctx, font: boldOf(ctx.font) })
        break
      case 'em':
        collectSpans(token.tokens ?? [], spans, { ...ctx, font: italicOf(ctx.font) })
        break
      case 'codespan':
        spans.push({ ...ctx, font: 'Courier', text: token.text })
        break
      case 'link':
        collectSpans(
          token.tokens ?? [{ type: 'text', text: token.text || token.href }],
          spans,
          { ...ctx, color: '#0057B8' }
        )
        break
      case 'image':
        if (token.text) spans.push({ ...ctx, text: `[${token.text}]` })
        break
      case 'html': {
        const stripped = token.text.replace(/<[^>]+>/g, '').trim()
        if (stripped) spans.push({ ...ctx, text: stripped })
        break
      }
      case 'br':
      case 'softbreak':
        spans.push({ ...ctx, text: '\n' })
        break
      default:
        if (token.text) spans.push({ ...ctx, text: token.text })
    }
  }
}

function flushSpans(doc, spans) {
  const items = spans.filter(s => s.text)
  if (!items.length) return
  for (let i = 0; i < items.length; i++) {
    const { text, font, fontSize, color } = items[i]
    doc.font(font).fontSize(fontSize).fillColor(color)
    doc.text(text, { continued: i < items.length - 1, lineGap: 2 })
  }
}

// Renders paragraph inline tokens; handles inline images by flushing pending spans first
function renderParagraphTokens(doc, tokens, contentDir, ctx) {
  let pending = []

  function flush() {
    flushSpans(doc, pending)
    pending = []
  }

  for (const token of tokens) {
    if (token.type === 'image') {
      flush()
      renderLocalImage(doc, token.href, contentDir)
    } else {
      collectSpans([token], pending, ctx)
    }
  }
  flush()
}

function renderLocalImage(doc, href, contentDir) {
  if (!href || /^https?:\/\/|^data:/.test(href)) return
  const imgPath = path.resolve(contentDir, href)
  if (!fs.existsSync(imgPath)) return
  const ext = path.extname(imgPath).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return  // pdfkit only supports jpg/png natively
  try {
    const maxW = doc.page.width - doc.page.margins.left - doc.page.margins.right
    doc.image(imgPath, { fit: [maxW, 280], align: 'left' })
    doc.moveDown(0.3)
  } catch {
    // unsupported or corrupt — skip silently
  }
}

// ─── Block token renderer ─────────────────────────────────────────────────────

function renderTokens(doc, tokens, contentDir, opts = {}) {
  tokens = mergeSplitCustomElements(tokens)
  tokens.forEach((token, i) => {
    const isLast = i === tokens.length - 1
    renderToken(doc, token, contentDir, { ...opts, skipTrailingGap: opts.tight && isLast })
  })
}

function renderToken(doc, token, contentDir, opts = {}) {
  const base = { font: 'Helvetica', fontSize: 11, ...opts }
  const ctx = { font: base.font, fontSize: base.fontSize, color: '#000' }

  switch (token.type) {
    case 'space':
      doc.moveDown(0.2)
      break

    case 'heading': {
      const sizes = [0, 18, 15, 13, 12, 11, 11]
      const sz = sizes[Math.min(token.depth, 6)] ?? 11
      doc.moveDown(0.6)
      const spans = []
      collectSpans(token.tokens ?? [], spans, { font: 'Helvetica-Bold', fontSize: sz, color: '#111' })
      flushSpans(doc, spans)
      doc.moveDown(0.2)
      doc.font(base.font).fontSize(base.fontSize).fillColor('#000')
      break
    }

    case 'paragraph': {
      doc.font(base.font).fontSize(base.fontSize).fillColor('#000')
      renderParagraphTokens(doc, token.tokens ?? [], contentDir, ctx)
      if (!opts.skipTrailingGap) doc.moveDown(0.5)
      break
    }

    case 'code': {
      doc.moveDown(0.3)
      const rw = doc.page.width - doc.page.margins.left - doc.page.margins.right
      doc.font('Courier').fontSize(9)
      const textH = doc.heightOfString(token.text, { width: rw - 16, lineGap: 2 })
      const boxH = textH + 18

      if (doc.y + boxH > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage()
      }

      const rx = doc.page.margins.left
      const ry = doc.y

      doc.save().rect(rx, ry, rw, boxH).fill('#F4F4F4').restore()
      doc.font('Courier').fontSize(9).fillColor('#333')
        .text(token.text, rx + 8, ry + 9, { width: rw - 16, lineGap: 2, paragraphGap: 0 })

      doc.y = ry + boxH
      doc.font(base.font).fontSize(base.fontSize).fillColor('#000')
      if (!opts.skipTrailingGap) doc.moveDown(0.5)
      break
    }

    case 'blockquote': {
      doc.moveDown(0.3)
      doc.font('Helvetica-Oblique').fontSize(base.fontSize).fillColor('#555')
      renderTokens(doc, token.tokens ?? [], contentDir, { ...base, font: 'Helvetica-Oblique' })
      doc.font(base.font).fontSize(base.fontSize).fillColor('#000')
      if (!opts.skipTrailingGap) doc.moveDown(0.3)
      break
    }

    case 'list': {
      const depth = opts.listDepth ?? 0
      const indent = depth * 16
      const baseX = doc.x
      if (depth === 0) doc.moveDown(0.2)
      token.items?.forEach((item, idx) => {
        const bullet = token.ordered ? `${idx + 1}.` : '•'
        const spans = []
        const nestedLists = []
        for (const t of (item.tokens ?? [])) {
          if (t.type === 'text' || t.type === 'paragraph') {
            collectSpans(t.tokens ?? [t], spans, ctx)
          } else if (t.type === 'list') {
            nestedLists.push(t)
          }
        }
        const allSpans = [{ ...ctx, color: '#444', text: `${bullet}  ` }, ...spans.filter(s => s.text)]
        if (allSpans.length) {
          doc.x = baseX + indent
          flushSpans(doc, allSpans)
          doc.x = baseX
        }
        doc.moveDown(0.15)
        for (const nested of nestedLists) {
          renderToken(doc, nested, contentDir, { ...opts, listDepth: depth + 1, skipTrailingGap: true })
        }
      })
      if (!opts.skipTrailingGap) doc.moveDown(0.3)
      break
    }

    case 'hr': {
      doc.moveDown(0.3)
      const hrX = doc.page.margins.left
      const hrW = doc.page.width - doc.page.margins.left - doc.page.margins.right
      doc.save().moveTo(hrX, doc.y).lineTo(hrX + hrW, doc.y)
        .strokeColor('#DDD').lineWidth(1).stroke().restore()
      if (!opts.skipTrailingGap) doc.moveDown(0.5)
      break
    }

    case 'html': {
      const raw = (token.raw ?? token.text ?? '').trim()
      const m = CUSTOM_EL_RE.exec(raw)
      if (m) renderCustomElement(doc, m[1].toLowerCase(), parseAttrs(m[2]), m[3], contentDir, base)
      break
    }

    default:
      if (token.text) {
        doc.font(base.font).fontSize(base.fontSize).fillColor('#888').text(token.text)
        doc.moveDown(0.2)
      }
  }
}

// ─── Custom elements ──────────────────────────────────────────────────────────

function parseAttrs(attrStr) {
  const attrs = {}
  const re = /([\w-]+)="([^"]*)"/g
  let m
  while ((m = re.exec(attrStr)) !== null) attrs[m[1]] = m[2]
  return attrs
}

function renderCustomElement(doc, tagName, attrs, inner, contentDir, base) {
  switch (tagName) {
    case 'x-callout': {
      const CALLOUT_STYLES = {
        tip: { accent: '#10B981', text: '#065F46' },
        warning: { accent: '#F59E0B', text: '#92400E' },
        danger: { accent: '#F43F5E', text: '#9F1239' },
        info: { accent: '#0EA5E9', text: '#075985' },
        note: { accent: '#A1A1AA', text: '#27272A' },
      }
      const style = CALLOUT_STYLES[attrs.type] ?? CALLOUT_STYLES.note

      doc.moveDown(0.3)
      const origLeft = doc.page.margins.left
      const startY = doc.y
      doc.y = startY + 5 // nudge down: glyph ink sits high in its line box, so top-align reads as too high
      doc.page.margins.left = origLeft + 14
      doc.x = origLeft + 14
      doc.font('Helvetica').fontSize(base.fontSize).fillColor(style.text)
      renderTokens(doc, marked.lexer(inner.trim()), contentDir, { ...base, font: 'Helvetica', tight: true })
      const endY = doc.y
      doc.page.margins.left = origLeft
      doc.x = origLeft
      doc.save().rect(origLeft, startY, 3, Math.max(endY - startY, 8)).fill(style.accent).restore()
      doc.font(base.font).fontSize(base.fontSize).fillColor('#000').moveDown(0.3)
      break
    }

    case 'x-compare': {
      doc.moveDown(0.3)
      const itemRe = /<x-compare-item\s+title="([^"]*)">([\s\S]*?)<\/x-compare-item>/gi
      let m
      while ((m = itemRe.exec(inner)) !== null) {
        doc.font('Helvetica-Bold').fontSize(base.fontSize - 0.5).fillColor('#555').text(m[1])
        doc.moveDown(0.2)
        doc.font(base.font).fontSize(base.fontSize).fillColor('#000')
        renderTokens(doc, marked.lexer(m[2].trim()), contentDir, base)
        doc.moveDown(0.3)
      }
      break
    }

    case 'x-card':
      doc.moveDown(0.2)
      renderTokens(doc, marked.lexer(inner.trim()), contentDir, base)
      doc.moveDown(0.2)
      break

    case 'x-nav':
      break  // Navigation links have no place in a PDF

    case 'x-browser': {
      doc.moveDown(0.4)
      const origLeft = doc.page.margins.left
      const origRight = doc.page.margins.right
      const rx = origLeft
      const rw = doc.page.width - origLeft - origRight
      const startY = doc.y
      const headerH = 22
      const pad = 10

      doc.save().roundedRect(rx, startY, rw, headerH, 6).clip()
        .rect(rx, startY, rw, headerH).fill('#ECECEF').restore()

      const dotY = startY + headerH / 2
      doc.save()
      doc.circle(rx + 16, dotY, 4).fill('#FF5F57')
      doc.circle(rx + 30, dotY, 4).fill('#FEBC2E')
      doc.circle(rx + 44, dotY, 4).fill('#28C840')
      doc.restore()

      const title = attrs.title || 'Browser'
      doc.font('Helvetica').fontSize(8).fillColor('#71717A')
        .text(title, rx, dotY - 4, { width: rw, align: 'center' })

      doc.page.margins.left = origLeft + pad
      doc.page.margins.right = origRight + pad
      doc.x = origLeft + pad
      doc.y = startY + headerH + pad
      doc.font(base.font).fontSize(base.fontSize).fillColor('#000')
      renderTokens(doc, marked.lexer(inner.trim()), contentDir, { ...base, tight: true })

      const endY = doc.y + pad
      doc.page.margins.left = origLeft
      doc.page.margins.right = origRight

      doc.save().roundedRect(rx, startY, rw, endY - startY, 6)
        .lineWidth(1.5).strokeColor('#D4D4D8').stroke().restore()

      doc.y = endY
      doc.moveDown(0.4)
      break
    }

    case 'details': {
      const summaryMatch = SUMMARY_RE.exec(inner)
      const summaryText = summaryMatch?.[1].trim()
      const body = inner.replace(SUMMARY_RE, '').trim()
      doc.moveDown(0.3)
      if (summaryText) {
        doc.font('Helvetica-Bold').fontSize(base.fontSize).fillColor('#444').text(summaryText)
        doc.moveDown(0.2)
      }
      if (body) {
        doc.font(base.font).fontSize(base.fontSize).fillColor('#000')
        renderTokens(doc, marked.lexer(body), contentDir, base)
      }
      doc.moveDown(0.3)
      break
    }

    default:
      renderTokens(doc, marked.lexer(inner.trim()), contentDir, base)
  }
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function renderCover(doc, mod) {
  doc.y = doc.page.height * 0.28

  doc.font('Helvetica').fontSize(10).fillColor('#999')
    .text((mod.subtitle ?? 'E-module').toUpperCase(), { characterSpacing: 1.5 })
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').fontSize(34).fillColor('#111').text(mod.name ?? 'E-module')

  if (mod.description) {
    doc.moveDown(1)
    doc.font('Helvetica').fontSize(12).fillColor('#555').text(mod.description, { lineGap: 4 })
  }
}

function renderExercises(doc, exercisesDir) {
  const INTERACTIVE = new Set(['css-playground', 'areas', 'responsive'])

  const files = fs.readdirSync(exercisesDir)
    .filter(f => /^\d+\.md$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b))

  for (const file of files) {
    const { data: fm, content: body } = matter(
      fs.readFileSync(path.join(exercisesDir, file), 'utf8')
    )
    if (fm.type === 'external') continue

    doc.moveDown(0.4)
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text(fm.title ?? file)
    doc.moveDown(0.2)

    const descMd = body.trim() || (fm.description ? String(fm.description) : '')
    if (descMd) {
      doc.font('Helvetica').fontSize(10).fillColor('#333')
      renderTokens(doc, marked.lexer(descMd), exercisesDir, { font: 'Helvetica', fontSize: 10 })
    } else if (INTERACTIVE.has(fm.type)) {
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#999')
        .text('(Interactieve oefening — zie de online module)')
    }
    doc.font('Helvetica').fontSize(11).fillColor('#000')
  }
}

function renderAssignment(doc, assignmentPath) {
  const { data: fm, content: body } = matter(fs.readFileSync(assignmentPath, 'utf8'))
  const contentDir = path.dirname(assignmentPath)

  doc.font('Helvetica-Bold').fontSize(15).fillColor('#111').text(fm.title ?? 'Inleveropdracht')
  if (fm.subtitle) {
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(10).fillColor('#666').text(fm.subtitle)
  }
  doc.moveDown(0.5).fillColor('#000')

  if (body.trim()) {
    renderTokens(doc, marked.lexer(body.trim()), contentDir)
  }

  if (fm.deliverables?.length) {
    doc.moveDown(0.4)
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text('In te leveren')
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(10).fillColor('#333')
    doc.list(fm.deliverables, { bulletRadius: 2, lineGap: 2 })
  }

  if (fm.criteria?.length) {
    doc.moveDown(0.4)
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text('Beoordelingscriteria')
    doc.moveDown(0.2)
    for (const c of fm.criteria) {
      const pts = c.points ? ` (${c.points} pt)` : ''
      doc.font('Helvetica').fontSize(10).fillColor('#333').text(`• ${c.text}${pts}`, { lineGap: 2 })
    }
  }

  if (fm.tips?.length) {
    doc.moveDown(0.4)
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text('Tips')
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(10).fillColor('#333')
    doc.list(fm.tips, { bulletRadius: 2, lineGap: 2 })
  }
}

function renderWeek(doc, weekDir, sectionLabel) {
  const theoryPath = path.join(weekDir, 'theory.md')
  if (!fs.existsSync(theoryPath)) return

  const { data: fm, content: theoryBody } = matter(fs.readFileSync(theoryPath, 'utf8'))

  doc.font('Helvetica-Bold').fontSize(22).fillColor('#111').text(sectionLabel)
  if (fm.title) {
    doc.moveDown(0.2)
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#333').text(fm.title)
  }
  if (fm.goal) {
    doc.moveDown(0.3)
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#666').text(`Leerdoel: ${fm.goal}`)
  }
  doc.fillColor('#000').moveDown(0.8)

  if (theoryBody.trim()) {
    renderTokens(doc, marked.lexer(theoryBody.trim()), weekDir)
  }

  const exercisesDir = path.join(weekDir, 'exercises')
  if (fs.existsSync(exercisesDir)) {
    doc.addPage()
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#111').text('Oefeningen')
    doc.moveDown(0.5).fillColor('#000')
    renderExercises(doc, exercisesDir)
  }

  const assignmentPath = path.join(weekDir, 'assignment.md')
  if (fs.existsSync(assignmentPath)) {
    doc.addPage()
    renderAssignment(doc, assignmentPath)
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function generatePdf({ projectDir }) {
  const CONTENT = path.join(projectDir, 'content')

  if (!fs.existsSync(path.join(CONTENT, 'module.md'))) {
    console.log('  PDF skipped: no content/module.md')
    return
  }

  const { data: mod } = matter(fs.readFileSync(path.join(CONTENT, 'module.md'), 'utf8'))

  const weekDirs = fs.readdirSync(CONTENT)
    .filter(d => SECTION_RE.test(d) && fs.statSync(path.join(CONTENT, d)).isDirectory())
    .sort((a, b) => Number(SECTION_RE.exec(a)[2]) - Number(SECTION_RE.exec(b)[2]))
    .slice(0, mod.weeks ?? 99)

  const extraDirs = fs.readdirSync(CONTENT)
    .filter(d => !SECTION_RE.test(d) && !IGNORED_DIRS.has(d) && fs.statSync(path.join(CONTENT, d)).isDirectory())
    .filter(d => fs.existsSync(path.join(CONTENT, d, 'theory.md')))

  const sections = [
    ...weekDirs.map(d => {
      const [, prefix, num] = SECTION_RE.exec(d)
      return {
        dirName: d,
        sortKey: Number(num),
        label: `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)} ${num}`,
      }
    }),
    ...extraDirs.map(d => {
      const { data: fm } = matter(fs.readFileSync(path.join(CONTENT, d, 'theory.md'), 'utf8'))
      return {
        dirName: d,
        sortKey: fm.sort ?? 999,
        label: d.charAt(0).toUpperCase() + d.slice(1),
      }
    }),
  ].sort((a, b) => a.sortKey - b.sortKey)

  const PUBLIC = path.join(projectDir, 'public')
  if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true })

  const doc = new PDFDocument({ margin: 72, size: 'A4', autoFirstPage: true })
  const outPath = path.join(PUBLIC, 'e-module.pdf')
  const writeStream = fs.createWriteStream(outPath)
  doc.pipe(writeStream)

  renderCover(doc, mod)

  for (const sec of sections) {
    doc.addPage()
    renderWeek(doc, path.join(CONTENT, sec.dirName), sec.label)
  }

  doc.end()
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve)
    writeStream.on('error', reject)
  })

  console.log('  PDF → public/e-module.pdf')
}
