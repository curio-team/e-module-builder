import { mountFillBlank } from '../components/fill-blank/index.js'
import { celebrateSuccess, setComponentResult, renderFeedback } from './shared.js'

export { mountFillBlank, validateFillBlank } from '../components/fill-blank/index.js'

export function initInvul(el, config) {
  mountFillBlank(el, {
    code: config.code,
    blanks: config.blanks ?? [],
    prompt: config.prompt,
    onCheck: ({ allCorrect, incomplete }) => {
      const feedbackEl = el.querySelector('[data-feedback]')

      if (incomplete) {
        setComponentResult(el, 'error')
        feedbackEl.innerHTML = renderFeedback(false, 'Vul alle gaten in voordat je controleert.')
        return
      }

      const message = allCorrect
        ? (config.explanation || 'Alles goed ingevuld!')
        : (config.explanation || 'Niet alles klopt. Bekijk de gemarkeerde velden.')

      feedbackEl.innerHTML = renderFeedback(allCorrect, message)

      if (allCorrect) {
        celebrateSuccess(el)
      } else {
        setComponentResult(el, 'error')
      }
    },
  })
}
