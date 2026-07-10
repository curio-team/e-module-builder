// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CELEBRATIONS,
  pickCelebration,
  celebrateSuccess,
  getComponentRoot,
  setComponentResult,
} from '../src/js/x-components/celebrations/index.js'

describe('celebrations', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <x-keuzevraag id="component">
        <div data-component-body><button>Check</button></div>
      </x-keuzevraag>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('registry contains exactly 5 celebrations', () => {
    expect(CELEBRATIONS).toHaveLength(5)
    expect(CELEBRATIONS.map((c) => c.id)).toEqual([
      'confetti',
      'thumbsUp',
      'starBurst',
      'checkPop',
      'goedBanner',
    ])
  })

  it('pickCelebration returns a registered celebration', () => {
    const picked = pickCelebration()
    expect(CELEBRATIONS).toContain(picked)
    expect(typeof picked.run).toBe('function')
  })

  it('getComponentRoot finds the x-component wrapper', () => {
    const btn = document.querySelector('button')
    expect(getComponentRoot(btn)?.id).toBe('component')
  })

  it('setComponentResult sets data-result on root', () => {
    const btn = document.querySelector('button')
    setComponentResult(btn, 'success')
    expect(document.querySelector('x-keuzevraag').dataset.result).toBe('success')
  })

  it('celebrateSuccess sets data-result and runs a celebration', () => {
    const runSpy = vi.fn()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const originalRun = CELEBRATIONS[0].run
    CELEBRATIONS[0].run = runSpy

    try {
      const btn = document.querySelector('button')
      celebrateSuccess(btn)

      expect(document.querySelector('x-keuzevraag').dataset.result).toBe('success')
      expect(runSpy).toHaveBeenCalledOnce()
    } finally {
      CELEBRATIONS[0].run = originalRun
    }
  })

  it('celebrateSuccess uses reduced motion fallback when preferred', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })

    const btn = document.querySelector('button')
    celebrateSuccess(btn)

    expect(document.querySelector('.x-celebrate-reduced')).not.toBeNull()
    expect(document.querySelector('.x-confetti-canvas')).toBeNull()
  })
})
