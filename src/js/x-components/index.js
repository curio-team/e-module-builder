import { COMPONENTS } from './registry.js'
import { renderComponentLabel } from './shared.js'
import { initHeadings } from '../headings.js'
import { initKeuzevraag } from './keuzevraag.js'
import { initKoppelvraag } from './koppelvraag.js'
import { initVindDeFout } from './vind-de-fout.js'
import { initWoordzoeker } from './woordzoeker.js'
import { initInvul } from './invul.js'

const INIT_BY_TAG = {
  'x-keuzevraag': initKeuzevraag,
  'x-koppelvraag': initKoppelvraag,
  'x-vind-de-fout': initVindDeFout,
  'x-woordzoeker': initWoordzoeker,
  'x-invul': initInvul,
}

function ensureComponentShell(el, label) {
  if (!el.querySelector('.x-component-label')) {
    el.insertAdjacentHTML('afterbegin', renderComponentLabel(label))
  }
  if (!el.querySelector('[data-component-body]')) {
    el.insertAdjacentHTML('beforeend', '<div data-component-body></div>')
  }
}

export function hydrateXComponents(root = document) {
  for (const { tag, label } of COMPONENTS) {
    const init = INIT_BY_TAG[tag]
    if (!init) continue

    root.querySelectorAll(`${tag}[data-config]:not([data-hydrated])`).forEach((el) => {
      try {
        const config = JSON.parse(el.dataset.config)
        ensureComponentShell(el, label)
        const body = el.querySelector('[data-component-body]')
        const result = init(body, config)
        if (result?.catch) {
          result.catch((err) => console.error(`Failed to hydrate <${tag}>:`, err))
        }
        el.dataset.hydrated = 'true'
      } catch (err) {
        console.error(`Failed to hydrate <${tag}>:`, err)
      }
    })
  }
}

/** Initialise prose HTML: heading anchors + interactive x-components. */
export function initProseContent(container) {
  if (!container) return
  initHeadings(container)
  hydrateXComponents(container)
}

export { COMPONENTS, INTERACTIVE_TAGS, getComponentMeta } from './registry.js'
export { initKeuzevraag, initKoppelvraag, initVindDeFout, initWoordzoeker, initInvul }
export { validateKoppelvraag, validateVindDeFout, shuffleArray } from './shared.js'
