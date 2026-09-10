/**
 * Pure logic for a sequence of revealable panels (step-reveal).
 *
 * A step-reveal tracks a single integer `revealedCount` — how many steps (from the
 * top) have been revealed. With `cascade` on, step N stays locked until step N-1 is
 * revealed, so `revealedCount` fully describes the state.
 */

/** Stable short hash of the step contents — used as a localStorage key suffix. */
export function hashSteps(steps) {
  const source = JSON.stringify(steps ?? [])
  let hash = 0x811c9dc5
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

export function clampRevealed(count, total) {
  const n = Number.isFinite(count) ? Math.floor(count) : 0
  return Math.max(0, Math.min(n, total))
}

/** Can this step be interacted with (revealed) right now? */
export function isStepReady(index, revealedCount, { cascade = true } = {}) {
  if (!cascade) return true
  return index <= revealedCount
}

/** Has this step already been revealed? */
export function isStepRevealed(index, revealedCount) {
  return index < revealedCount
}

/** New revealedCount after revealing the step at `index`. Never goes backwards. */
export function nextRevealedCount(current, index) {
  return Math.max(current ?? 0, index + 1)
}

/** Resolve the visual state for a step. */
export function stepState(index, revealedCount, options) {
  if (isStepRevealed(index, revealedCount)) return 'revealed'
  if (isStepReady(index, revealedCount, options)) return 'ready'
  return 'locked'
}
