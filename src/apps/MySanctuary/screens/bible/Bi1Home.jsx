import { useState, useRef } from 'react'
import { ProgressRing } from '../../components/ProgressRing.jsx'
import { heatColor, todayISO, calcStreak } from '../../tokens.js'
import { useTapHold } from '../../hooks/useTapHold.js'

export function Bi1Home({ bible, setBible, navigate }) {
  const [panel, setPanel] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const touchData = useRef({ startY: 0, startTime: 0 })

  const totalChapitres = 1189
  const chapitresLus = bible.books.reduce((s, b) => s + b.chapitresLus.length, 0)
  const percent = Math.round((chapitresLus / totalChapitres) * 100)

  const enCours = bible.plans.filter(p => p.statut === 'cours')
  const enAttente = bible.plans.filter(p => p.statut === 'attente')
  const termines = bible.plans.filter(p => p.statut === 'termine')

  function addPlan(bookId) {
    const book = bible.books.find(b => b.id === bookId)
    if (!book) return
    setBible(prev => ({
      ...prev,
      plans: [...prev.plans, { id: Date.now().toString(), livreId: bookId, statut: 'attente' }]
    }))
    setShowPicker(false)
  }

  function commencer(planId) {
    setBible(prev => ({
      ...prev,
      plans: prev.plans.map(p => p.id === planId ? { ...p, statut: 'cours' } : p)
    }))
  }

  function marquerChapitre(planId) {
    const today = todayISO()
    setBible(prev => {
      const plan = prev.plans.find(p => p.id === planId)
      const book = prev.books.find(b => b.id === plan?.livreId)
      if (!plan || !book) return prev
      const nextCh = book.chapitresLus.length + 1
      if (nextCh > book.totalChapitres) return prev
      const estTermine = nextCh === book.totalChapitres
      const newStreak = prev.lastReadDate === today
        ? prev.streak
        : calcStreak(prev.lastReadDate, prev.streak)
      const updatedBooks = prev.books.map(b =>
        b.id === plan.livreId ? { ...b, chapitresLus: [...b.chapitresLus, nextCh] } : b
      )
      const updatedPlans = prev.plans.map(p =>
        p.id === planId ? { ...p, statut: estTermine ? 'termine' : p.statut } : p
      )
      return { ...prev, books: updatedBooks, plans: updatedPlans, streak: newStreak, lastReadDate: today }
    })
  }

  function retirerPlan(planId) {
    setBible(prev => ({ ...prev, plans: prev.plans.filter(p => p.id !== planId) }))
  }

  const alreadyInPlans = new Set(bible.plans.map(p => p.livreId))
  const availableBooks = bible.books.filter(b => !alreadyInPlans.has(b.id))
  const at = bible.books.filter(b => b.testament === 'AT')
  const nt = bible.books.filter(b => b.testament === 'NT')

  function onTouchStart(e) {
    touchData.current = { startY: e.touches[0].clientY, startTime: Date.now() }
  }
  function onTouchEnd(e) {
    const dy = touchData.current.startY - e.changedTouches[0].clientY
    const dt = Date.now() - touchData.current.startTime
    const vel = Math.abs(dy) / Math.max(dt, 1)
    if (panel === 0 && dy > 70 && vel > 0.15) setPanel(1)
    if (panel === 1 && dy < -70 && vel > 0.15) setPanel(0)
  }

  return (
    <div className="bi-home" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── Panel 0 : Mes lectures ── */}
      <div className={`bi-panel ${panel === 0 ? 'bi-panel--visible' : 'bi-panel--above'}`}>
        <div className="bi-panel-scroll">

          {/* Stats + bouton ajouter */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ProgressRing percent={percent} size={52} stroke={4} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 20, fontWeight: 300, color: '#f0ece0' }}>
                  {chapitresLus} <span style={{ color: '#6a6a82', fontSize: 13 }}>/ {totalChapitres}</span>
                </div>
                <div style={{ fontSize: 12, color: '#a0a0b8' }}>chapitres lus</div>
              </div>
              <button className="btn-sm" style={{ color: '#e8c46a', borderColor: '#e8c46a', flexShrink: 0 }}
                onClick={() => setShowPicker(true)}>+ Ajouter</button>
            </div>
            {bible.streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6,
                marginTop: 12, paddingTop: 12, borderTop: '1px solid #2a2a3f' }}>
                <span style={{ fontFamily: 'Cormorant Garamond', fontSize: 17, color: '#e8c46a' }}>{bible.streak}</span>
                <span className="kicker" style={{ color: '#6a6a82' }}>
                  {bible.streak > 1 ? 'JOURS DE LECTURE CONTINUE' : 'JOUR DE LECTURE CONTINUE'}
                </span>
              </div>
            )}
          </div>

          {enCours.length === 0 && enAttente.length === 0 && termines.length === 0 && (
            <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: '24px 0' }}>
              Aucune lecture en cours.
              <div style={{ marginTop: 10 }}>
                <button style={{ color: '#e8c46a', fontSize: 13 }} onClick={() => setShowPicker(true)}>
                  + Ajouter un livre →
                </button>
              </div>
            </div>
          )}

          {/* En cours */}
          {enCours.map(plan => {
            const book = bible.books.find(b => b.id === plan.livreId)
            if (!book) return null
            const lu = book.chapitresLus.length
            const total = book.totalChapitres
            const pct = Math.min(Math.round((lu / total) * 100), 100)
            return (
              <div key={plan.id} className="card card--gold">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 19, color: '#f0ece0' }}>{book.nom}</div>
                    <div style={{ fontSize: 12, color: '#a0a0b8', marginTop: 2 }}>
                      {lu} / {total} chapitres lus
                    </div>
                  </div>
                  <button onClick={() => retirerPlan(plan.id)}
                    style={{ color: '#6a6a82', fontSize: 20, lineHeight: 1 }}>×</button>
                </div>
                <div className="progress-bar-track" style={{ marginBottom: 12 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <button className="btn-gold" onClick={() => marquerChapitre(plan.id)}>
                  ✓ CHAPITRE {lu + 1} LU
                </button>
              </div>
            )
          })}

          {/* En attente */}
          {enAttente.length > 0 && (
            <div className="card">
              <div className="kicker" style={{ marginBottom: 10 }}>À VENIR</div>
              {enAttente.map((plan, idx) => {
                const book = bible.books.find(b => b.id === plan.livreId)
                if (!book) return null
                return (
                  <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: idx < enAttente.length - 1 ? '1px solid #2a2a3f' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 17, color: '#f0ece0' }}>{book.nom}</div>
                      <div style={{ fontSize: 12, color: '#6a6a82', marginTop: 2 }}>{book.totalChapitres} chapitres</div>
                    </div>
                    <button className="btn-sm" style={{ color: '#e8c46a', borderColor: '#e8c46a' }}
                      onClick={() => commencer(plan.id)}>▶ Commencer</button>
                    <button onClick={() => retirerPlan(plan.id)}
                      style={{ color: '#6a6a82', fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Terminés */}
          {termines.length > 0 && (
            <div className="card">
              <div className="kicker" style={{ marginBottom: 10 }}>TERMINÉS</div>
              {termines.map(plan => {
                const book = bible.books.find(b => b.id === plan.livreId)
                return (
                  <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                    borderBottom: '1px solid #2a2a3f' }}>
                    <span style={{ color: '#4caf82' }}>✓</span>
                    <span style={{ flex: 1, fontFamily: 'Cormorant Garamond', fontSize: 16, color: '#a0a0b8' }}>
                      {book?.nom}
                    </span>
                    <button onClick={() => retirerPlan(plan.id)} style={{ color: '#6a6a82', fontSize: 18 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Indicateur swipe */}
          <button className="bi-panel-indicator" onClick={() => setPanel(1)}>
            ▾ CARTE DE LECTURE
          </button>
        </div>
      </div>

      {/* ── Panel 1 : Carte de lecture ── */}
      <div className={`bi-panel ${panel === 1 ? 'bi-panel--visible' : 'bi-panel--below'}`}>
        <div className="bi-panel-scroll">

          <button className="bi-panel-indicator bi-panel-indicator--top" onClick={() => setPanel(0)}>
            ▴ MES LECTURES
          </button>

          <div style={{ fontSize: 13, color: '#a0a0b8', textAlign: 'center' }}>
            {chapitresLus} <span style={{ color: '#6a6a82' }}>/ 1189 chapitres lus</span>
          </div>

          <div className="card">
            <div className="kicker" style={{ marginBottom: 10 }}>ANCIEN TESTAMENT · 39 LIVRES</div>
            <div className="book-grid">
              {at.map(book => (
                <BookSquare key={book.id} book={book}
                  inPlan={alreadyInPlans.has(book.id)}
                  onShort={() => navigate('Bi3Book', { bookId: book.id, bookName: book.nom })}
                  onLong={() => { if (!alreadyInPlans.has(book.id)) addPlan(book.id) }} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="kicker" style={{ marginBottom: 10 }}>NOUVEAU TESTAMENT · 27 LIVRES</div>
            <div className="book-grid">
              {nt.map(book => (
                <BookSquare key={book.id} book={book}
                  inPlan={alreadyInPlans.has(book.id)}
                  onShort={() => navigate('Bi3Book', { bookId: book.id, bookName: book.nom })}
                  onLong={() => { if (!alreadyInPlans.has(book.id)) addPlan(book.id) }} />
              ))}
            </div>
          </div>

          {/* Légende */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#6a6a82' }}>0%</span>
            <div style={{ flex: 1, height: 6, borderRadius: 3,
              background: 'linear-gradient(to right, #1e1e2e, #4a3a1e, #8a6a2e, #c9a84c, #e8c46a)' }} />
            <span style={{ fontSize: 11, color: '#6a6a82' }}>100%</span>
          </div>
          <div style={{ fontSize: 11, color: '#6a6a82', textAlign: 'center' }}>
            Appui court → chapitres · Appui long → ajouter à ma liste
          </div>
        </div>
      </div>

      {/* ── Picker livre ── */}
      {showPicker && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setShowPicker(false)}>
          <div style={{ background: '#151520', borderRadius: '20px 20px 0 0',
            maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #3a3a55',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span className="kicker">AJOUTER UN LIVRE</span>
              <button style={{ color: '#a0a0b8', fontSize: 22, lineHeight: 1 }}
                onClick={() => setShowPicker(false)}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {availableBooks.map(b => (
                <div key={b.id} onClick={() => addPlan(b.id)}
                  style={{ padding: '14px 20px', borderBottom: '1px solid #1e1e2e',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ color: '#f0ece0', fontSize: 16, fontFamily: 'Cormorant Garamond' }}>{b.nom}</span>
                  <span style={{ color: '#6a6a82', fontSize: 12 }}>{b.totalChapitres} ch.</span>
                </div>
              ))}
              {availableBooks.length === 0 && (
                <div style={{ color: '#6a6a82', fontSize: 13, padding: 24, textAlign: 'center' }}>
                  Tous les livres sont dans ta liste.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookSquare({ book, inPlan, onShort, onLong }) {
  const pct = Math.round((book.chapitresLus.length / book.totalChapitres) * 100)
  const textColor = pct >= 60 ? '#2a1800' : '#d8d4c8'
  const handlers = useTapHold(onShort, onLong)

  return (
    <div
      className={`book-square${inPlan ? ' current' : ''}`}
      style={{ background: heatColor(pct), display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      {...handlers}
    >
      <span style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 700,
        lineHeight: 1, color: textColor, userSelect: 'none', WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none', pointerEvents: 'none' }}>
        {book.abr}
      </span>
    </div>
  )
}
