export const COLORS = [
  '#e8c46a', '#4caf82', '#60b8ff', '#a89cf8', '#e05555',
  '#f08a3c', '#3ec9c9', '#d96fb0', '#9bc23c', '#8f9bb3',
]

export const AVATARS = [
  '🦊', '🐼', '🦉', '🐙', '🐝', '🦁', '🐸', '🦄', '🐺', '🐢',
  '🐨', '🦋', '🐳', '🦖', '🐰', '🦅', '🐧', '🦔', '🐯', '🦩',
]

export const PRESETS = [
  'Les Aventuriers du Rail', 'Catan', '7 Wonders', 'Skull King',
  'Uno', 'Yams', 'Wingspan', 'Dixit', 'Belote', 'Tarot', 'Scrabble', 'Azul',
]

export const MAX_PLAYERS = 10

export function makePlayer(i) {
  return {
    id: 'p' + i + '_' + Math.random().toString(36).slice(2, 8),
    name: '',
    av: AVATARS[i % AVATARS.length],
    color: COLORS[i % COLORS.length],
    scores: [],
    ms: 0,
  }
}

export function total(p) {
  return p.scores.reduce((a, b) => a + b, 0)
}

/** Classement : meilleur d'abord. Égalité départagée par l'ordre de saisie. */
export function sortPlayers(players, lowWins) {
  return players.slice().sort((a, b) => {
    const d = lowWins ? total(a) - total(b) : total(b) - total(a)
    if (d !== 0) return d
    return players.indexOf(a) - players.indexOf(b)
  })
}

/** Rang « sportif » : les ex aequo partagent le même rang. */
export function rankOf(players, p, lowWins) {
  const t = total(p)
  let ahead = 0
  for (const o of players) {
    if (o === p) continue
    if (lowWins ? total(o) < t : total(o) > t) ahead++
  }
  return ahead + 1
}

export function fmt(ms) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(t / 60)
  const s = t % 60
  return m + ':' + String(s).padStart(2, '0')
}

export function fmtLong(ms) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return (h ? h + 'h' + String(m).padStart(2, '0') : m) + 'min' + String(s).padStart(2, '0')
}

/** Nombre de fois où le meneur a changé au fil des manches. */
export function leadChanges(players, rounds, lowWins) {
  let changes = 0
  let prev = null
  for (let r = 0; r < rounds; r++) {
    let bestId = null
    let bestT = null
    for (const p of players) {
      let s = 0
      for (let i = 0; i <= r; i++) s += p.scores[i] || 0
      if (bestT === null || (lowWins ? s < bestT : s > bestT)) { bestT = s; bestId = p.id }
    }
    if (prev !== null && bestId !== prev) changes++
    prev = bestId
  }
  return changes
}

/** Écart-type des scores par manche — le plus faible = le plus régulier. */
export function steadiest(players) {
  let best = null
  let bestV = Infinity
  for (const p of players) {
    if (p.scores.length < 2) continue
    const m = total(p) / p.scores.length
    const v = Math.sqrt(p.scores.reduce((a, x) => a + (x - m) * (x - m), 0) / p.scores.length)
    if (v < bestV) { bestV = v; best = p }
  }
  return best ? { player: best, sd: bestV } : null
}

export function bestRound(players) {
  let best = null
  for (const p of players) {
    p.scores.forEach((v, i) => {
      if (!best || v > best.value) best = { player: p, value: v, round: i + 1 }
    })
  }
  return best
}
