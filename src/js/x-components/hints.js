import { mountStepReveal, hashSteps } from '../components/step-reveal/index.js'

export { mountStepReveal } from '../components/step-reveal/index.js'

/**
 * Cascading hints: each hint needs a press-and-hold to reveal, and stays locked
 * until the previous one is revealed. Revealed hints persist across reloads.
 */
export function initHints(el, config) {
  const steps = (config.hints ?? []).map((hint) =>
    typeof hint === 'string'
      ? { title: null, body: hint }
      : { title: hint.title ?? null, body: hint.body ?? '' }
  )

  mountStepReveal(el, {
    steps,
    gated: true,
    cascade: true,
    holdMs: 1500,
    noun: 'hint',
    introHtml: typeof config.intro === 'string' ? config.intro : null,
    storageKey: `hints:${hashSteps(steps)}`,
  })
}
