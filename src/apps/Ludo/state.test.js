import { describe, it, expect } from 'vitest'
import {
  makePlayer, total, sortPlayers, rankOf, fmt, fmtLong,
  leadChanges, steadiest, bestRound, MAX_PLAYERS, AVATARS, COLORS,
} from './state.js'

function mk(name, scores) {
  return { id: name, name, av: '🦊', color: '#fff', scores, ms: 0 }
}

describe('total', () => {
  it('additionne les manches', () => expect(total(mk('a', [3, -1, 10]))).toBe(12))
  it('vaut 0 sans manche', () => expect(total(mk('a', []))).toBe(0))
})

describe('sortPlayers', () => {
  const ps = [mk('a', [5]), mk('b', [12]), mk('c', [12]), mk('d', [1])]
  it('classe du plus haut au plus bas', () => {
    expect(sortPlayers(ps, false).map(p => p.name)).toEqual(['b', 'c', 'a', 'd'])
  })
  it('inverse quand le plus bas gagne', () => {
    expect(sortPlayers(ps, true).map(p => p.name)).toEqual(['d', 'a', 'b', 'c'])
  })
  it('ne modifie pas le tableau source', () => {
    const copy = ps.slice()
    sortPlayers(ps, false)
    expect(ps).toEqual(copy)
  })
})

describe('rankOf', () => {
  const ps = [mk('a', [12]), mk('b', [12]), mk('c', [5])]
  it('donne le meme rang aux ex aequo', () => {
    expect(rankOf(ps, ps[0], false)).toBe(1)
    expect(rankOf(ps, ps[1], false)).toBe(1)
  })
  it('saute le rang apres une egalite', () => {
    expect(rankOf(ps, ps[2], false)).toBe(3)
  })
})

describe('fmt', () => {
  it('formate mm:ss', () => expect(fmt(65000)).toBe('1:05'))
  it('protege les negatifs', () => expect(fmt(-500)).toBe('0:00'))
  it('formate les heures', () => expect(fmtLong(3725000)).toBe('1h02min05'))
})

describe('leadChanges', () => {
  it('compte les renversements', () => {
    const ps = [mk('a', [10, 0]), mk('b', [0, 30])]
    expect(leadChanges(ps, 2, false)).toBe(1)
  })
  it('vaut 0 si le meneur ne bouge pas', () => {
    const ps = [mk('a', [10, 10]), mk('b', [0, 1])]
    expect(leadChanges(ps, 2, false)).toBe(0)
  })
})

describe('faits de partie', () => {
  it('trouve la plus grosse manche', () => {
    const ps = [mk('a', [4, 9]), mk('b', [7, 2])]
    expect(bestRound(ps)).toMatchObject({ value: 9, round: 2 })
  })
  it('trouve le plus regulier', () => {
    const ps = [mk('a', [5, 5]), mk('b', [0, 10])]
    expect(steadiest(ps).player.name).toBe('a')
  })
  it('ignore les joueurs a moins de 2 manches', () => {
    expect(steadiest([mk('a', [5])])).toBe(null)
  })
})

describe('makePlayer', () => {
  it('donne un avatar et une couleur distincts pour 10 joueurs', () => {
    const ps = Array.from({ length: MAX_PLAYERS }, (_, i) => makePlayer(i))
    expect(new Set(ps.map(p => p.av)).size).toBe(MAX_PLAYERS)
    expect(new Set(ps.map(p => p.color)).size).toBe(MAX_PLAYERS)
    expect(new Set(ps.map(p => p.id)).size).toBe(MAX_PLAYERS)
  })
  it('a assez d avatars et de couleurs en stock', () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(MAX_PLAYERS)
    expect(COLORS.length).toBeGreaterThanOrEqual(MAX_PLAYERS)
  })
})
