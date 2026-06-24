import { describe, it, expect } from 'vitest'
import { BIBLE_BOOKS, calcStreak, heatColor, initBibleState } from './tokens.js'

describe('BIBLE_BOOKS', () => {
  it('contient 66 livres', () => {
    expect(BIBLE_BOOKS).toHaveLength(66)
  })
  it('totalise 1189 chapitres', () => {
    const total = BIBLE_BOOKS.reduce((s, b) => s + b.totalChapitres, 0)
    expect(total).toBe(1189)
  })
  it('contient 39 livres AT et 27 NT', () => {
    const at = BIBLE_BOOKS.filter(b => b.testament === 'AT')
    const nt = BIBLE_BOOKS.filter(b => b.testament === 'NT')
    expect(at).toHaveLength(39)
    expect(nt).toHaveLength(27)
  })
})

describe('calcStreak', () => {
  it('retourne 0 si pas de date', () => {
    expect(calcStreak(null, 5)).toBe(0)
  })
  it('garde le streak si lu aujourd\'hui', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(calcStreak(today, 5)).toBe(5)
  })
  it('incrémente si lu hier', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    expect(calcStreak(yesterday, 5)).toBe(6)
  })
  it('remet à 0 si plus ancien', () => {
    expect(calcStreak('2020-01-01', 5)).toBe(0)
  })
})

describe('heatColor', () => {
  it('retourne la couleur foncée à 0%', () => {
    expect(heatColor(0)).toBe('#1e1e2e')
  })
  it('retourne la couleur or à 100%', () => {
    expect(heatColor(100)).toBe('#e8c46a')
  })
})

describe('initBibleState', () => {
  it('crée un état avec 66 livres et chapitresLus vides', () => {
    const state = initBibleState()
    expect(state.books).toHaveLength(66)
    expect(state.books[0].chapitresLus).toEqual([])
    expect(state.streak).toBe(0)
  })
})
