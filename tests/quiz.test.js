// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const celebrateSuccess = vi.fn()

vi.mock('../src/js/nav.js', () => ({
  getManifest: () => ({
    curriculum: [
      {
        dirName: 'week1',
        pages: [
          { key: 'theorie', href: '/pages/week1-theorie.html', label: 'Theorie' },
          { key: 'oefeningen', href: '/pages/week1-oefeningen.html', label: 'Oefeningen' },
        ],
      },
    ],
  }),
}))

vi.mock('../src/js/x-components/celebrations/index.js', () => ({
  celebrateSuccess: (...args) => celebrateSuccess(...args),
}))

const { initQuiz } = await import('../src/js/quiz.js')

const quizData = {
  title: 'Test Quiz',
  passScore: 60,
  questions: [
    { id: 'q1', question: 'Vraag 1?', options: ['A', 'B', 'C'], correct: 1, explanation: 'Uitleg 1' },
    { id: 'q2', question: 'Vraag 2?', options: ['X', 'Y'], correct: 0, explanation: 'Uitleg 2' },
  ],
}

const quizData3 = {
  title: 'Test Quiz 3',
  passScore: 60,
  questions: [
    { id: 'a1', question: 'Vraag 1?', options: ['A', 'B'], correct: 0, explanation: 'u1' },
    { id: 'a2', question: 'Vraag 2?', options: ['A', 'B'], correct: 0, explanation: 'u2' },
    { id: 'a3', question: 'Vraag 3?', options: ['A', 'B'], correct: 0, explanation: 'u3' },
  ],
}

function pick(id, optionIndex) {
  document.querySelector(`input[name="${id}"][value="${optionIndex}"]`).checked = true
}

function submit() {
  document.querySelector('[data-quiz-form]').dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('quiz results', () => {
  beforeEach(() => {
    localStorage.clear()
    celebrateSuccess.mockClear()
    document.body.innerHTML = '<div data-quiz></div>'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('all correct → passes, summary all green, celebration fires', async () => {
    vi.useFakeTimers()
    initQuiz(quizData, { section: 'week1' })
    pick('q1', 1)
    pick('q2', 0)
    submit()

    const card = document.querySelector('[data-quiz-result]')
    expect(card.querySelector('h2').textContent).toContain('Gefeliciteerd')
    expect(card.querySelectorAll('.quiz-summary-row[data-correct="true"]')).toHaveLength(2)
    expect(card.querySelector('.x-feedback--info')).toBeNull()

    vi.runAllTimers()
    expect(celebrateSuccess).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('passing but not perfect → "Geslaagd", no celebration', () => {
    vi.useFakeTimers()
    initQuiz(quizData3, { section: 'week1' })
    pick('a1', 0)
    pick('a2', 0)
    pick('a3', 1)
    submit()

    const card = document.querySelector('[data-quiz-result]')
    expect(card.querySelector('h2').textContent.trim()).toBe('Geslaagd')
    expect(card.querySelector('.x-feedback--info')).toBeNull()

    vi.runAllTimers()
    expect(celebrateSuccess).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('some wrong → fails, summary shows given + correct answer, CTA links present', () => {
    initQuiz(quizData, { section: 'week1' })
    pick('q1', 0)
    pick('q2', 0)
    submit()

    const card = document.querySelector('[data-quiz-result]')
    expect(card.textContent).toContain('Nog niet geslaagd')
    expect(card.textContent).toContain('Jouw antwoord: A')
    expect(card.textContent).toContain('Juist antwoord: B')

    const cta = card.querySelector('.x-feedback--info')
    expect(cta).not.toBeNull()
    const hrefs = [...cta.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs.some((h) => h.includes('week1-theorie.html'))).toBe(true)
    expect(hrefs.some((h) => h.includes('week1-oefeningen.html'))).toBe(true)

    expect(celebrateSuccess).not.toHaveBeenCalled()

    // wrong option flagged on the form
    expect(document.querySelector('[data-question="q1"] [data-option="0"]').dataset.state).toBe('incorrect')
    expect(document.querySelector('[data-question="q1"] [data-option="1"]').dataset.state).toBe('correct')
  })

  it('from storage → rebuilds full summary without celebrating', () => {
    initQuiz(quizData, { section: 'week1' })
    pick('q1', 1)
    pick('q2', 0)
    submit()
    celebrateSuccess.mockClear()

    document.body.innerHTML = '<div data-quiz></div>'
    initQuiz(quizData, { section: 'week1' })

    const card = document.querySelector('[data-quiz-result]')
    expect(card.textContent).toContain('Eerder resultaat')
    expect(card.querySelectorAll('.quiz-summary-row')).toHaveLength(2)
    expect(celebrateSuccess).not.toHaveBeenCalled()
  })

  it('no section → fail CTA renders without links', () => {
    initQuiz(quizData)
    pick('q1', 0)
    pick('q2', 1)
    submit()

    const cta = document.querySelector('.x-feedback--info')
    expect(cta).not.toBeNull()
    expect(cta.querySelectorAll('a')).toHaveLength(0)
  })
})
