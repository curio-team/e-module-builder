import { getItem, setItem } from '../../storage.js'
import { clampRevealed, nextRevealedCount, stepState } from './engine.js'

let uidCounter = 0

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

const HOLD_KEYS = new Set([' ', 'Spacebar', 'Enter'])

/**
 * Mount a sequence of revealable panels into any container.
 *
 * @param {HTMLElement} container
 * @param {object}   opts
 * @param {{title?: string|null, body: string}[]} opts.steps  HTML strings (already sanitised)
 * @param {boolean}  [opts.gated=true]     require a press-and-hold to reveal each step
 * @param {boolean}  [opts.cascade=true]   lock step N+1 until step N is revealed
 * @param {number}   [opts.holdMs=1500]    hold duration before a step reveals
 * @param {boolean}  [opts.numbered=true]  prefix headings with "<Noun> N"
 * @param {string}   [opts.noun='hint']    word used in headings and gate labels
 * @param {string|null} [opts.storageKey]  localStorage key (via src/js/storage.js) for revealed count
 * @param {string|null} [opts.introHtml]   optional intro paragraph HTML
 * @returns {{ destroy(): void }}
 */
export function mountStepReveal(container, {
  steps = [],
  gated = true,
  cascade = true,
  holdMs = 1500,
  numbered = true,
  noun = 'hint',
  storageKey = null,
  introHtml = null,
} = {}) {
  const uid = `step-reveal-${(uidCounter++).toString(36)}`
  const total = steps.length
  const reduced = prefersReducedMotion()

  let revealedCount = storageKey ? clampRevealed(getItem(storageKey, 0), total) : 0

  let holdIndex = -1
  let holdStart = 0
  let holdRaf = 0
  let holdTimer = 0
  let holdCompleted = false

  container.innerHTML = `
    <div class="step-reveal" data-gated="${gated ? 'true' : 'false'}">
      ${introHtml ? `<p class="step-reveal__intro">${introHtml}</p>` : ''}
      <ol class="step-reveal__list"></ol>
    </div>`
  const listEl = container.querySelector('.step-reveal__list')

  function heading(step, i) {
    const label = numbered ? `${capitalize(noun)} ${i + 1}` : ''
    if (step.title && label) return `${label} — ${step.title}`
    return step.title || label || `${capitalize(noun)} ${i + 1}`
  }

  function renderGate(i, state, bodyId) {
    if (state === 'revealed') return ''
    if (state === 'locked') {
      return `<p class="step-reveal__locked">Onthul eerst ${noun} ${i}</p>`
    }
    if (gated) {
      return `
        <button type="button" class="step-reveal__hold" aria-controls="${bodyId}" aria-expanded="false">
          <span class="step-reveal__progress" aria-hidden="true"></span>
          <span class="step-reveal__hold-label">Houd ingedrukt om ${noun} ${i + 1} te tonen</span>
        </button>`
    }
    return `<button type="button" class="step-reveal__toggle" aria-controls="${bodyId}" aria-expanded="false">Toon ${noun} ${i + 1}</button>`
  }

  function renderItem(step, i) {
    const state = stepState(i, revealedCount, { cascade })
    const headingId = `${uid}-h-${i}`
    const bodyId = `${uid}-b-${i}`
    return `
      <li class="step-reveal__item" data-state="${state}" data-index="${i}" style="--step-reveal-progress:0%">
        <h4 class="step-reveal__heading" id="${headingId}">${heading(step, i)}</h4>
        <div class="step-reveal__gate">${renderGate(i, state, bodyId)}</div>
        <div class="step-reveal__body" id="${bodyId}" role="region" aria-labelledby="${headingId}" tabindex="-1"${state === 'revealed' ? '' : ' hidden'}>${step.body}</div>
      </li>`
  }

  function render() {
    listEl.innerHTML = steps.map(renderItem).join('')
  }

  function persist() {
    if (!storageKey) return
    try { setItem(storageKey, revealedCount) } catch { /* storage unavailable */ }
  }

  function reveal(index, { focus = false } = {}) {
    const updated = nextRevealedCount(revealedCount, index)
    if (updated === revealedCount) return
    revealedCount = updated
    persist()
    render()
    if (focus) {
      listEl.querySelector(`.step-reveal__item[data-index="${index}"] .step-reveal__body`)?.focus()
    }
  }

  function itemAt(index) {
    return listEl.querySelector(`.step-reveal__item[data-index="${index}"]`)
  }

  function setProgress(index, ratio) {
    itemAt(index)?.style.setProperty('--step-reveal-progress', `${Math.round(ratio * 100)}%`)
  }

  function paint() {
    if (holdIndex < 0) return
    const ratio = Math.min(1, (now() - holdStart) / holdMs)
    setProgress(holdIndex, ratio)
    if (ratio < 1 && typeof requestAnimationFrame === 'function') {
      holdRaf = requestAnimationFrame(paint)
    }
  }

  function endHold() {
    if (holdRaf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(holdRaf)
    if (holdTimer) clearTimeout(holdTimer)
    holdRaf = 0
    holdTimer = 0
    if (holdIndex >= 0) {
      itemAt(holdIndex)?.querySelector('.step-reveal__hold')?.removeAttribute('data-holding')
      if (!holdCompleted) setProgress(holdIndex, 0)
    }
    holdIndex = -1
  }

  function startHold(index) {
    if (holdIndex === index) return
    endHold()
    holdIndex = index
    holdStart = now()
    holdCompleted = false
    itemAt(index)?.querySelector('.step-reveal__hold')?.setAttribute('data-holding', 'true')
    holdTimer = setTimeout(() => {
      holdCompleted = true
      const target = holdIndex
      endHold()
      reveal(target, { focus: true })
    }, holdMs)
    if (!reduced && typeof requestAnimationFrame === 'function') {
      holdRaf = requestAnimationFrame(paint)
    }
  }

  // ── delegated events ──────────────────────────────────────────────────────
  function holdButtonFrom(target) {
    const btn = target?.closest?.('.step-reveal__hold')
    return btn && listEl.contains(btn) ? btn : null
  }

  function onPointerDown(e) {
    const btn = holdButtonFrom(e.target)
    if (!btn) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    try { btn.setPointerCapture?.(e.pointerId) } catch { /* not capturable */ }
    startHold(Number(btn.closest('.step-reveal__item').dataset.index))
  }

  function onPointerUp() {
    if (!holdCompleted) endHold()
  }

  function onKeyDown(e) {
    const btn = holdButtonFrom(e.target)
    if (!btn || !HOLD_KEYS.has(e.key)) return
    e.preventDefault()
    if (e.repeat) return
    startHold(Number(btn.closest('.step-reveal__item').dataset.index))
  }

  function onKeyUp(e) {
    if (!HOLD_KEYS.has(e.key)) return
    if (!holdCompleted) endHold()
  }

  function onClick(e) {
    const btn = e.target?.closest?.('.step-reveal__toggle')
    if (!btn || !listEl.contains(btn)) return
    reveal(Number(btn.closest('.step-reveal__item').dataset.index), { focus: true })
  }

  function onFocusOut() {
    if (holdIndex >= 0 && !holdCompleted) endHold()
  }

  render()

  container.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  container.addEventListener('keydown', onKeyDown)
  container.addEventListener('keyup', onKeyUp)
  container.addEventListener('click', onClick)
  container.addEventListener('focusout', onFocusOut)

  return {
    destroy() {
      endHold()
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      container.removeEventListener('keydown', onKeyDown)
      container.removeEventListener('keyup', onKeyUp)
      container.removeEventListener('click', onClick)
      container.removeEventListener('focusout', onFocusOut)
      container.innerHTML = ''
    },
  }
}
