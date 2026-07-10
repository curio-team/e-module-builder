const STOPWORDS = new Set([
  'aan', 'als', 'bij', 'dan', 'dat', 'de', 'den', 'der', 'des', 'dit', 'een', 'en', 'er',
  'het', 'hij', 'hoe', 'ik', 'in', 'is', 'je', 'kan', 'met', 'niet', 'of', 'om', 'ook',
  'op', 'te', 'tot', 'uit', 'van', 'veel', 'voor', 'waar', 'wel', 'zijn', 'the', 'and',
  'for', 'use', 'you', 'your', 'with', 'from', 'this', 'that', 'are', 'can', 'all',
])

const CSS_HINTS = /^(grid|flex|gap|area|template|column|row|track|item|container|layout|minmax|subgrid|display|margin|padding|border|auto|fit|fill|fr|rem|px|em|vh|vw)$/i

function normalizeWord(raw) {
  return String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function addWord(set, raw) {
  const word = normalizeWord(raw)
  if (word.length < 3 || word.length > 14) return
  if (STOPWORDS.has(word.toLowerCase())) return
  set.add(word)
}

function addFromCode(set, code) {
  const text = code.trim()
  if (!text) return

  const compact = normalizeWord(text)
  if (compact.length >= 3 && compact.length <= 14) {
    set.add(compact)
  }

  if (text.includes('-')) {
    for (const part of text.split('-')) {
      addWord(set, part)
    }
  }

  for (const part of text.split(/[\s:;,./]+/)) {
    if (/^[\w-]+$/.test(part) && (part.includes('-') || CSS_HINTS.test(part) || part.length >= 4)) {
      addWord(set, part)
    }
  }
}

export function extractKeywordsFromMarkdown(markdown) {
  const words = new Set()

  for (const match of markdown.matchAll(/`([^`]+)`/g)) {
    addFromCode(words, match[1])
  }

  for (const match of markdown.matchAll(/\*\*([^*]+)\*\*/g)) {
    for (const part of match[1].split(/\s+/)) {
      if (part.length >= 4) addWord(words, part)
    }
  }

  for (const match of markdown.matchAll(/\b(grid-[a-z-]+|auto-(?:fit|fill)|minmax|subgrid|flexbox|display)\b/gi)) {
    addFromCode(words, match[1])
  }

  return [...words].sort((a, b) => b.length - a.length)
}

export function mergeKeywordLists(...lists) {
  return [...new Set(lists.flat())].sort((a, b) => a.localeCompare(b, 'nl'))
}
