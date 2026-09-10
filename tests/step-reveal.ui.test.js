// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountStepReveal } from '../src/js/components/step-reveal/ui.js'

const STEPS = [
  { title: 'Eerst', body: '<p>hint een</p>' },
  { title: 'Dan', body: '<p>hint twee</p>' },
  { title: 'Ten slotte', body: '<p>hint drie</p>' },
]

let container

function mount(opts = {}) {
  return mountStepReveal(container, { steps: STEPS, holdMs: 50, ...opts })
}

function state(index) {
  return container.querySelector(`.step-reveal__item[data-index="${index}"]`).dataset.state
}

function holdKey(index) {
  const btn = container.querySelector(`.step-reveal__item[data-index="${index}"] .step-reveal__hold`)
  btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))
  vi.advanceTimersByTime(60)
  btn.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('mountStepReveal', () => {
  it('cascade: first step ready, the rest locked', () => {
    mount()
    expect(state(0)).toBe('ready')
    expect(state(1)).toBe('locked')
    expect(state(2)).toBe('locked')
    expect(container.querySelector('.step-reveal__item[data-index="1"] .step-reveal__hold')).toBeNull()
  })

  it('a completed hold reveals the step and unlocks the next one', () => {
    mount()
    holdKey(0)
    expect(state(0)).toBe('revealed')
    expect(container.querySelector('.step-reveal__item[data-index="0"] .step-reveal__body').hidden).toBe(false)
    expect(state(1)).toBe('ready')
    expect(state(2)).toBe('locked')
  })

  it('a hold released early does not reveal', () => {
    mount()
    const btn = container.querySelector('.step-reveal__item[data-index="0"] .step-reveal__hold')
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))
    vi.advanceTimersByTime(20)
    btn.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
    vi.advanceTimersByTime(60)
    expect(state(0)).toBe('ready')
  })

  it('persists the revealed count and restores it on remount', () => {
    const first = mount({ storageKey: 'hints:test' })
    holdKey(0)
    holdKey(1)
    first.destroy()

    mount({ storageKey: 'hints:test' })
    expect(state(0)).toBe('revealed')
    expect(state(1)).toBe('revealed')
    expect(state(2)).toBe('ready')
  })

  it('non-gated + no cascade renders plain toggles that reveal on click', () => {
    mount({ gated: false, cascade: false, numbered: false })
    expect(state(0)).toBe('ready')
    expect(state(2)).toBe('ready')
    const toggle = container.querySelector('.step-reveal__item[data-index="2"] .step-reveal__toggle')
    expect(toggle).not.toBeNull()
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(state(2)).toBe('revealed')
  })

  it('destroy() detaches listeners and clears the container', () => {
    const handle = mount()
    handle.destroy()
    expect(container.innerHTML).toBe('')
    // dispatching after destroy must not throw
    window.dispatchEvent(new Event('pointerup'))
  })
})
