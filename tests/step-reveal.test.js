import { describe, it, expect } from 'vitest'
import {
  hashSteps,
  clampRevealed,
  isStepReady,
  isStepRevealed,
  nextRevealedCount,
  stepState,
} from '../src/js/components/step-reveal/engine.js'

describe('step-reveal engine', () => {
  it('hashSteps is stable and order-sensitive', () => {
    const a = [{ title: 'x', body: '<p>1</p>' }, { title: null, body: '<p>2</p>' }]
    const b = [{ title: null, body: '<p>2</p>' }, { title: 'x', body: '<p>1</p>' }]
    expect(hashSteps(a)).toBe(hashSteps(a))
    expect(hashSteps(a)).not.toBe(hashSteps(b))
    expect(typeof hashSteps(a)).toBe('string')
  })

  it('clampRevealed keeps the count within [0, total]', () => {
    expect(clampRevealed(-3, 4)).toBe(0)
    expect(clampRevealed(2, 4)).toBe(2)
    expect(clampRevealed(9, 4)).toBe(4)
    expect(clampRevealed('nope', 4)).toBe(0)
  })

  it('isStepReady respects the cascade', () => {
    // revealedCount = 1 → step 0 revealed, step 1 is the next unlockable one
    expect(isStepReady(0, 1, { cascade: true })).toBe(true)
    expect(isStepReady(1, 1, { cascade: true })).toBe(true)
    expect(isStepReady(2, 1, { cascade: true })).toBe(false)
    // no cascade → everything is ready
    expect(isStepReady(5, 0, { cascade: false })).toBe(true)
  })

  it('isStepRevealed counts steps below revealedCount', () => {
    expect(isStepRevealed(0, 1)).toBe(true)
    expect(isStepRevealed(1, 1)).toBe(false)
  })

  it('nextRevealedCount only moves forward', () => {
    expect(nextRevealedCount(0, 0)).toBe(1)
    expect(nextRevealedCount(3, 1)).toBe(3)
    expect(nextRevealedCount(1, 2)).toBe(3)
  })

  it('stepState maps index + revealedCount to a visual state', () => {
    const opts = { cascade: true }
    expect(stepState(0, 1, opts)).toBe('revealed')
    expect(stepState(1, 1, opts)).toBe('ready')
    expect(stepState(2, 1, opts)).toBe('locked')
  })
})
