import { mountWordSearch, loadWordSearchKeywords, normalizeWordList } from '../components/word-search/index.js'
import { celebrateSuccess, renderFeedback } from './shared.js'
import { getComponentRoot } from './confetti.js'

export { generateWordSearch, normalizeWordList, mountWordSearch } from '../components/word-search/index.js'

export async function initWoordzoeker(el, config) {
  let words = config.words

  if (!words?.length) {
    try {
      words = await loadWordSearchKeywords(config.scope || 'module')
    } catch {
      words = []
    }
  }

  const feedbackEl = document.createElement('div')
  feedbackEl.dataset.feedback = ''
  feedbackEl.className = 'mt-3'

  const instance = mountWordSearch(el, {
    words: normalizeWordList(words, { maxWords: 6, maxLength: 8 }),
    instruction: 'Vind alle woorden. Sleep alleen van links naar rechts of van boven naar beneden.',
    onWordFound: (word) => {
      feedbackEl.innerHTML = renderFeedback(true, `"${word}" gevonden!`, { variant: 'info', title: 'Goed' })
    },
    onMiss: () => {
      feedbackEl.innerHTML = renderFeedback(false, 'Dit woord klopt niet. Probeer opnieuw.', {
        variant: 'info',
        title: 'Hmm',
      })
    },
    onComplete: () => {
      feedbackEl.innerHTML = renderFeedback(true, 'Alle trefwoorden gevonden!')
      celebrateSuccess(getComponentRoot(el) ?? el)
    },
  })

  if (!instance) return

  el.appendChild(feedbackEl)
}
