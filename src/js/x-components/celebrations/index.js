import { confetti } from './confetti.js'
import { thumbsUp } from './thumbs-up.js'
import { starBurst } from './star-burst.js'
import { checkPop } from './check-pop.js'
import { goedBanner } from './banner.js'
import { reducedMotionCelebration } from './reduced.js'
import { prefersReducedMotion } from './utils.js'

export const CELEBRATIONS = [
  { id: 'confetti', run: confetti },
  { id: 'thumbsUp', run: thumbsUp },
  { id: 'starBurst', run: starBurst },
  { id: 'checkPop', run: checkPop },
  { id: 'goedBanner', run: goedBanner },
]

export function pickCelebration() {
  return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]
}

export function getComponentRoot(el) {
  return el.closest('x-keuzevraag, x-koppelvraag, x-vind-de-fout, x-woordzoeker, x-invul')
}

export function setComponentResult(el, result) {
  const root = getComponentRoot(el)
  if (root) root.dataset.result = result
}

export function celebrateSuccess(el) {
  const root = getComponentRoot(el)
  const anchor = root ?? el
  if (root) root.dataset.result = 'success'

  if (prefersReducedMotion()) {
    reducedMotionCelebration()
    return
  }

  pickCelebration().run(anchor)
}

export { confetti as fireConfetti }
