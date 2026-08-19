import { useState, useEffect, useRef, useCallback } from 'react'
import './Ludo.css'
import {
  AVATARS, PRESETS, MAX_PLAYERS, makePlayer, total, sortPlayers, rankOf,
  fmt, fmtLong, leadChanges, steadiest, bestRound,
} from './state.js'

const STORE = 'ludo:v1'

function initialState() {
  return {
    screen: 'setup',
    name: '',
    players: [makePlayer(0), makePlayer(1), makePlayer(2)],
    turns: true,
    clock: true,
    lowWins: false,
    round: 1,
    history: [],
    pending: {},
    active: 0,
    startedAt: 0,
    endedAt: 0,
    tick: 0,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s || !Array.isArray(s.players) || s.players.length < 2) return null
    return { ...initialState(), ...s }
  } catch {
    return null
  }
}

export default function Ludo({ onBack }) {
  const [s, setS] = useState(() => loadState() || initialState())
  const [toast, setToast] = useState(null)
  const [pad, setPad] = useState(null)
  const lastTick = useRef(Date.now())

  /* --- persistance locale (reprise de partie) --- */
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify(s)) } catch { /* quota */ }
    }, 400)
    return () => clearTimeout(t)
  }, [s])

  /* --- toast --- */
  const say = useCallback(msg => setToast({ id: Date.now(), msg }), [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1700)
    return () => clearTimeout(t)
  }, [toast])

  /* --- horloge --- */
  useEffect(() => {
    if (s.screen !== 'game') return
    lastTick.current = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      const dt = now - lastTick.current
      lastTick.current = now
      setS(prev => {
        if (prev.screen !== 'game') return prev
        if (!prev.clock || !prev.turns) return { ...prev, tick: now }
        const players = prev.players.map((p, i) => (i === prev.active ? { ...p, ms: p.ms + dt } : p))
        return { ...prev, players, tick: now }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [s.screen])

  const now = s.tick || Date.now()
  const elapsed = s.screen === 'recap'
    ? Math.max(0, (s.endedAt || now) - s.startedAt)
    : (s.startedAt ? now - s.startedAt : 0)

  const up = patch => setS(prev => ({ ...prev, ...patch }))

  /* ---------------- preparation ---------------- */
  const addPlayer = () => {
    if (s.players.length >= MAX_PLAYERS) return say(MAX_PLAYERS + ' joueurs maximum')
    up({ players: [...s.players, makePlayer(s.players.length)] })
  }
  const removePlayer = i => {
    if (s.players.length <= 2) return say('Il faut au moins 2 joueurs')
    up({ players: s.players.filter((_, k) => k !== i) })
  }
  const patchPlayer = (i, patch) =>
    up({ players: s.players.map((p, k) => (k === i ? { ...p, ...patch } : p)) })
  const cycleAvatar = i => {
    const p = s.players[i]
    const used = new Set(s.players.map(x => x.av))
    let k = (AVATARS.indexOf(p.av) + 1) % AVATARS.length
    for (let n = 0; n < AVATARS.length && used.has(AVATARS[k]); n++) k = (k + 1) % AVATARS.length
    patchPlayer(i, { av: AVATARS[k] })
  }
  const shuffle = () => {
    const arr = s.players.slice()
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t
    }
    up({ players: arr })
    say('Ordre tiré au sort')
  }
  const start = () => {
    const players = s.players.map((p, i) => ({
      ...p,
      name: p.name.trim() || 'Joueur ' + (i + 1),
      scores: [],
      ms: 0,
    }))
    const t = Date.now()
    up({
      screen: 'game', players, name: s.name.trim() || 'Soirée jeux',
      round: 1, history: [], pending: {}, active: 0, startedAt: t, endedAt: 0, tick: t,
    })
  }

  /* ---------------- partie ---------------- */
  const bump = (id, d) =>
    up({ pending: { ...s.pending, [id]: (s.pending[id] ?? 0) + d } })

  const validate = () => {
    if (!Object.keys(s.pending).length) return say('Saisis au moins un score')
    const players = s.players.map(p => ({ ...p, scores: [...p.scores, s.pending[p.id] ?? 0] }))
    up({
      players,
      history: [...s.history, s.pending],
      pending: {},
      round: s.round + 1,
      active: 0,
    })
    say('Manche ' + s.round + ' enregistrée')
  }
  const undo = () => {
    if (!s.history.length) return
    up({
      players: s.players.map(p => ({ ...p, scores: p.scores.slice(0, -1) })),
      history: s.history.slice(0, -1),
      round: Math.max(1, s.round - 1),
      pending: {},
    })
    say('Manche annulée')
  }
  const endGame = () => {
    if (!s.history.length) return say('Aucune manche jouée')
    up({ screen: 'recap', endedAt: Date.now() })
  }
  const nextTurn = () => up({ active: (s.active + 1) % s.players.length })

  /* ---------------- pave numerique ---------------- */
  const openPad = p => {
    const cur = s.pending[p.id] ?? 0
    setPad({ id: p.id, av: p.av, name: p.name, buf: cur ? String(Math.abs(cur)) : '', neg: cur < 0 })
  }
  const key = k => {
    setPad(prev => {
      if (!prev) return prev
      if (k === 'del') return { ...prev, buf: prev.buf.slice(0, -1) }
      if (k === 'neg') return { ...prev, neg: !prev.neg }
      if (prev.buf.length >= 5) return prev
      return { ...prev, buf: (prev.buf === '0' ? '' : prev.buf) + k }
    })
  }
  const padOk = () => {
    const n = parseInt(pad.buf || '0', 10) * (pad.neg ? -1 : 1)
    up({ pending: { ...s.pending, [pad.id]: n } })
    setPad(null)
  }

  /* ---------------- recap ---------------- */
  const ranking = sortPlayers(s.players, s.lowWins)
  const winner = ranking[0]

  const copyRecap = () => {
    const lines = [
      '🎲 ' + s.name + ' — ' + new Date(s.endedAt || Date.now()).toLocaleDateString('fr-FR'),
      s.players.length + ' joueurs · ' + s.history.length + ' manches · ' + fmtLong(elapsed),
      '',
      ...ranking.map((p, i) =>
        (['🥇', '🥈', '🥉'][i] || '  ') + ' ' + p.av + ' ' + p.name + ' — ' + total(p) + ' pts'),
      '',
      'via Ludo',
    ]
    const txt = lines.join('\n')
    const done = () => say('Récap copié')
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(done, fallback)
    else fallback()
    function fallback() {
      const ta = document.createElement('textarea')
      ta.value = txt
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); done() } catch { say('Copie impossible') }
      ta.remove()
    }
  }
  const playAgain = () => {
    const t = Date.now()
    up({
      screen: 'game',
      players: s.players.map(p => ({ ...p, scores: [], ms: 0 })),
      round: 1, history: [], pending: {}, active: 0, startedAt: t, endedAt: 0, tick: t,
    })
    say('Nouvelle partie !')
  }
  const newGame = () => {
    if (s.screen !== 'setup' && !window.confirm('Abandonner la partie en cours ?')) return
    setS({ ...initialState(), players: s.players.map((p, i) => ({ ...makePlayer(i), name: p.name })) })
  }

  /* ---------------- rendu ---------------- */
  return (
    <div className="ld">
      <header className="ld-header">
        <div className="ld-header-content">
          <div className="ld-kicker">{s.screen === 'setup' ? 'Soirée jeux' : 'Ludo'}</div>
          <div className="ld-title">{s.screen === 'setup' ? 'Ludo' : s.name}</div>
        </div>
        {s.screen !== 'setup' && (
          <button className="ld-header-back" onClick={newGame} title="Nouvelle partie">↺</button>
        )}
        <button className="ld-header-home" onClick={onBack} title="Retour">✕</button>
      </header>

      {s.screen === 'setup' && (
        <>
          <section className="ld-card">
            <div className="ld-h2">Quel jeu ?</div>
            <div className="ld-sub">2 à 10 joueurs. La partie se garde même si tu quittes l'app.</div>
            <input
              className="ld-input" type="text" value={s.name} maxLength={40}
              placeholder="Ex. Les Aventuriers du Rail"
              onChange={e => up({ name: e.target.value })}
            />
            <div className="ld-chips">
              {PRESETS.map(g => (
                <button
                  key={g}
                  className={'ld-chip' + (s.name === g ? ' ld-chip--on' : '')}
                  onClick={() => up({ name: g })}
                >{g}</button>
              ))}
            </div>
          </section>

          <section className="ld-card">
            <div className="ld-h2">Joueurs <span className="ld-count">{s.players.length} / {MAX_PLAYERS}</span></div>
            <div className="ld-sub">Touche un avatar pour le changer.</div>
            <div className="ld-plist">
              {s.players.map((p, i) => (
                <div className="ld-prow" key={p.id} style={{ borderLeftColor: p.color }}>
                  <button className="ld-av" onClick={() => cycleAvatar(i)}>{p.av}</button>
                  <input
                    type="text" value={p.name} maxLength={18} placeholder={'Joueur ' + (i + 1)}
                    onChange={e => patchPlayer(i, { name: e.target.value })}
                  />
                  <button className="ld-ico" onClick={() => removePlayer(i)} title="Retirer">✕</button>
                </div>
              ))}
            </div>
            <div className="ld-row">
              <button className="ld-btn" onClick={addPlayer} disabled={s.players.length >= MAX_PLAYERS}>
                ＋ Ajouter un joueur
              </button>
              <button className="ld-btn ld-btn--ghost" onClick={shuffle}>🎲 Ordre au hasard</button>
            </div>
          </section>

          <section className="ld-card">
            <div className="ld-h2">Options</div>
            <div className="ld-sub">Modifiables à tout moment.</div>
            <div className="ld-row" style={{ flexDirection: 'column' }}>
              <Toggle
                on={s.turns} onClick={() => up({ turns: !s.turns })}
                label="Gestion des tours" hint="Joueur actif mis en avant + bouton « J'ai fini »"
              />
              <Toggle
                on={s.clock} onClick={() => up({ clock: !s.clock })}
                label="Chronomètre par joueur" hint="Pendule d'échecs : on voit qui fait durer"
              />
              <Toggle
                on={s.lowWins} onClick={() => up({ lowWins: !s.lowWins })}
                label="Le score le plus bas gagne" hint="Uno, Skull King, belote…"
              />
            </div>
          </section>

          <div className="ld-dock"><div className="ld-dock-in">
            <button className="ld-btn ld-btn--primary" onClick={start}>Commencer la partie</button>
          </div></div>
        </>
      )}

      {s.screen === 'game' && (
        <>
          <div className="ld-gbar">
            <div className="ld-pill">Manche {s.round}</div>
            <div className="ld-spacer" />
            {s.clock && <div className="ld-pill ld-pill--live">{fmt(elapsed)}</div>}
          </div>

          {s.turns && (
            <div className="ld-turn">
              <div className="ld-av" style={{ borderColor: s.players[s.active].color }}>
                {s.players[s.active].av}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ld-turn-who">Au tour de</div>
                <div className="ld-turn-name">{s.players[s.active].name}</div>
              </div>
              {s.clock && <div className="ld-clock">{fmt(s.players[s.active].ms)}</div>}
              <button className="ld-btn ld-btn--primary" onClick={nextTurn}>J'ai fini ➜</button>
            </div>
          )}

          <div className="ld-grid">
            {s.players.map((p, i) => {
              const pend = s.pending[p.id]
              const r = rankOf(s.players, p, s.lowWins)
              return (
                <div
                  key={p.id}
                  className={'ld-pc' + (s.turns && i === s.active ? ' ld-pc--active' : '')}
                  style={{ borderLeftColor: p.color }}
                  onClick={e => { if (s.turns && !e.target.closest('.ld-step')) up({ active: i }) }}
                >
                  <div className="ld-pc-top">
                    <div className="ld-av" style={{ borderColor: p.color }}>{p.av}</div>
                    <div className="ld-pc-name">{p.name}</div>
                    <div className={'ld-rank' + (r === 1 ? ' ld-rank--1' : '')}>#{r}</div>
                  </div>
                  <div className="ld-total">{total(p)}</div>
                  <div className="ld-total-lab">points au total</div>
                  <div className="ld-step">
                    <button className="ld-sb" onClick={() => bump(p.id, -1)}>−</button>
                    <button
                      className={'ld-val' + (pend !== undefined ? ' ld-val--set' : '')}
                      onClick={() => openPad(p)}
                    >
                      {pend === undefined ? '—' : (pend > 0 ? '+' + pend : pend)}
                    </button>
                    <button className="ld-sb" onClick={() => bump(p.id, 1)}>+</button>
                  </div>
                  {s.clock && <div className="ld-ptime">⏱ {fmt(p.ms)}</div>}
                </div>
              )
            })}
          </div>

          <div className="ld-dock"><div className="ld-dock-in">
            <button className="ld-btn ld-btn--narrow" onClick={undo} disabled={!s.history.length}>↶</button>
            <button className="ld-btn ld-btn--primary" onClick={validate}>Valider la manche</button>
            <button className="ld-btn ld-btn--narrow" onClick={endGame}>🏁</button>
          </div></div>
        </>
      )}

      {s.screen === 'recap' && (
        <Recap
          s={s} elapsed={elapsed} ranking={ranking} winner={winner}
          onCopy={copyRecap} onResume={() => up({ screen: 'game', endedAt: 0 })} onAgain={playAgain}
        />
      )}

      {pad && (
        <div className="ld-modal" onClick={e => { if (e.target === e.currentTarget) setPad(null) }}>
          <div className="ld-pad">
            <div className="ld-pad-h">
              <div className="ld-av">{pad.av}</div>
              <div>
                <div className="ld-turn-who">Points de la manche</div>
                <div style={{ fontWeight: 600 }}>{pad.name}</div>
              </div>
            </div>
            <div className="ld-pad-val">{(pad.neg ? '-' : '') + (pad.buf === '' ? '0' : pad.buf)}</div>
            <div className="ld-keys">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'neg', '0', 'del'].map(k => (
                <button key={k} onClick={() => key(k)}>
                  {k === 'neg' ? '±' : k === 'del' ? '⌫' : k}
                </button>
              ))}
              <button className="ld-wide" onClick={padOk}>Valider</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ld-toast">{toast.msg}</div>}
    </div>
  )
}

function Toggle({ on, onClick, label, hint }) {
  return (
    <button className="ld-switch" onClick={onClick} style={{ width: '100%' }}>
      <span style={{ textAlign: 'left' }}>
        <span className="ld-switch-lab" style={{ display: 'block' }}>{label}</span>
        <span className="ld-switch-hint">{hint}</span>
      </span>
      <span className={'ld-tg' + (on ? ' ld-tg--on' : '')} />
    </button>
  )
}

function Recap({ s, elapsed, ranking, winner, onCopy, onResume, onAgain }) {
  const podium = [1, 0, 2]
  const heights = [64, 92, 48]
  const gap = ranking[1] ? Math.abs(total(winner) - total(ranking[1])) : 0
  const br = bestRound(s.players)
  const st = steadiest(s.players)
  const lc = leadChanges(s.players, s.history.length, s.lowWins)
  const slow = s.players.slice().sort((a, b) => b.ms - a.ms)[0]

  return (
    <>
      <section className="ld-card">
        <div className="ld-h2">Fin de partie</div>
        <div className="ld-title" style={{ fontSize: 26, marginBottom: 4 }}>
          🏆 {winner.name} l'emporte
        </div>
        <div className="ld-sub">
          {s.players.length} joueurs · {s.history.length} manche{s.history.length > 1 ? 's' : ''} · {fmtLong(elapsed)}
          {s.lowWins ? ' · score le plus bas' : ''}
        </div>

        <div className="ld-podium">
          {podium.map((idx, slot) => {
            const p = ranking[idx]
            if (!p) return null
            return (
              <div className="ld-pod" key={p.id}>
                <div className="ld-av" style={{ borderColor: p.color }}>{p.av}</div>
                <div className="ld-pod-nm">{p.name}</div>
                <div className="ld-pod-sc">{total(p)} pts</div>
                <div className="ld-pod-bar" style={{ background: p.color, height: heights[slot] }}>
                  {idx + 1}
                </div>
              </div>
            )
          })}
        </div>

        <div className="ld-scroller">
          <table className="ld-table">
            <thead>
              <tr>
                <th>#</th><th>Joueur</th><th className="ld-num">Total</th>
                <th className="ld-num">Moy.</th><th className="ld-num">Best</th>
                {s.clock && <th className="ld-num">Temps</th>}
              </tr>
            </thead>
            <tbody>
              {ranking.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td><span style={{ color: p.color }}>{p.av}</span> {p.name}</td>
                  <td className="ld-num"><b>{total(p)}</b></td>
                  <td className="ld-num">{p.scores.length ? (total(p) / p.scores.length).toFixed(1) : '0.0'}</td>
                  <td className="ld-num">{p.scores.length ? Math.max(...p.scores) : 0}</td>
                  {s.clock && <td className="ld-num">{fmt(p.ms)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ld-card">
        <div className="ld-h2">Faits de la partie</div>
        <div className="ld-sub">Ce que raconte la feuille de score.</div>
        <div className="ld-stats">
          <Stat k="Écart avec le 2ᵉ" v={gap + ' pts'} d={ranking[1] ? 'devant ' + ranking[1].name : ''} />
          {br && <Stat k="Plus grosse manche" v={br.player.name + ' · ' + br.value} d={'manche ' + br.round} />}
          {st && <Stat k="Le plus régulier" v={st.player.name} d={'écart-type ' + st.sd.toFixed(1)} />}
          <Stat k="Changements de leader" v={String(lc)} d={lc > 2 ? 'partie disputée' : 'leader installé tôt'} />
          {s.clock && slow && <Stat k="Le plus long à jouer" v={slow.name} d={fmt(slow.ms) + ' au total'} />}
          <Stat k="Durée" v={fmtLong(elapsed)} d={s.history.length + ' manches'} />
        </div>
      </section>

      <section className="ld-card">
        <div className="ld-h2">Manche par manche</div>
        <div className="ld-sub">Points marqués à chaque manche.</div>
        <div className="ld-scroller">
          <table className="ld-table">
            <thead>
              <tr>
                <th>Manche</th>
                {s.players.map(p => (
                  <th key={p.id} className="ld-num"><span style={{ color: p.color }}>{p.av}</span> {p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.history.map((_, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  {s.players.map(p => (
                    <td key={p.id} className="ld-num">{p.scores[i] > 0 ? '+' + p.scores[i] : p.scores[i]}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td><b>Total</b></td>
                {s.players.map(p => <td key={p.id} className="ld-num"><b>{total(p)}</b></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="ld-dock"><div className="ld-dock-in">
        <button className="ld-btn" onClick={onCopy}>📋 Copier</button>
        <button className="ld-btn" onClick={onResume}>↩ Reprendre</button>
        <button className="ld-btn ld-btn--primary" onClick={onAgain}>Rejouer</button>
      </div></div>
    </>
  )
}

function Stat({ k, v, d }) {
  return (
    <div className="ld-st">
      <div className="ld-st-k">{k}</div>
      <div className="ld-st-v">{v}</div>
      {d && <div className="ld-st-d">{d}</div>}
    </div>
  )
}
