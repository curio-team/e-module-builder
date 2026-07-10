export {
  generateWordSearch,
  normalizeWordList,
  cellsKey,
  cellsAlongForward,
  matchSelection,
} from './engine.js'

export { extractKeywordsFromMarkdown, mergeKeywordLists } from './keywords.js'

export { mountWordSearch } from './ui.js'

export async function loadWordSearchKeywords(scope = 'module') {
  const data = await import('../../../data/woordzoeker.json').then((m) => m.default)
  return scope !== 'module' ? data.weeks?.[scope] ?? data.module : data.module
}
