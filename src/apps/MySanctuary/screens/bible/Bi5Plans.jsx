import { useState } from 'react'
import { todayISO, calcStreak } from '../../tokens.js'

export function Bi5Plans({ bible, setBible }) {
  const [showPicker, setShowPicker] = useState(false)

  const enCours  = bible.plans.filter(p => (p.statut ?? 'cours') === 'cours')
  const enAttente = bible.plans.filter(p => p.statut === 'attente')
  const termines  = bible.plans.filter(p => p.statut === 'termine')

  function addPlan(bookId) {
    const book = bible.books.find(b => b.id === bookId)
    if (!book) return
    setBible(prev => ({
      ...prev,
      plans: [...prev.plans, {
        id: Date.now().toString(),
        livreId: bookId,
        statut: 'attente',
        jourActuel: 1,
        total: book.totalChapitres,
        type: 'fixe'
      }]
    }))
    setShowPicker(false)
  }

  function commencer(planId) {
    setBible(prev => ({
      ...prev,
      plans: prev.plans.map(p =>
        p.id === planId ? { ...p, statut: 'cours', jourActuel: 1 } : p
      )
    }))
  }

  function marquerChapitreL(planId) {
    const today = todayISO()
    setBible(prev => {
      const plan = prev.plans.find(p => p.id === planId)
      if (!plan) return prev
      const nextJour = plan.jourActuel + 1
      const estTermine = nextJour > plan.total
      const newStreak = prev.lastReadDate === today
        ? prev.streak
        : calcStreak(prev.lastReadDate, prev.streak)
      const updatedBooks = prev.books.map(b =>
        b.id === plan.livreId && !b.chapitresLus.includes(plan.jourActuel)
          ? { ...b, chapitresLus: [...b.chapitresLus, plan.jourActuel] }
          : b
      )
      const updatedPlans = prev.plans.map(p =>
        p.id === planId
          ? { ...p, jourActuel: Math.min(nextJour, p.total + 1), statut: estTermine ? 'termine' : p.statut }
          : p
      )
      return { ...prev, books: updatedBooks, plans: updatedPlans, streak: newStreak, lastReadDate: today }
    })
  }

  function retirerPlan(planId) {
    setBible(prev => ({ ...prev, plans: prev.plans.filter(p => p.id !== planId) }))
  }

  const alreadyInPlans = new Set(bible.plans.map(p => p.livreId))
  const availableBooks = bible.books.filter(b => !alreadyInPlans.has(b.id))

  return (
    <>
      <button className="btn-outline-dashed" onClick={() => setShowPicker(true)}>
        + AJOUTER UN LIVRE À LIRE
      </button>

      {/* EN COURS */}
      {enCours.length > 0 && (
        <>
          <div className="kicker">EN COURS</div>
          {enCours.map(plan => {
            const book = bible.books.find(b => b.id === plan.livreId)
            const pct = Math.min(Math.round(((plan.jourActuel - 1) / plan.total) * 100), 100)
            return (
              <div key={plan.id} className="card card--gold">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 20, fontWeight: 400, color: '#f0ece0' }}>
                      {book?.nom}
                    </div>
                    <div style={{ fontSize: 13, color: '#a0a0b8', marginTop: 2 }}>
                      Chapitre {plan.jourActuel} / {plan.total}
                    </div>
                  </div>
                  <button onClick={() => retirerPlan(plan.id)}
                    style={{ color: '#6a6a82', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
                </div>
                <div className="progress-bar-track" style={{ marginBottom: 14 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <button className="btn-gold" onClick={() => marquerChapitreL(plan.id)}>
                  ✓ CHAPITRE {plan.jourActuel} LU
                </button>
              </div>
            )
          })}
        </>
      )}

      {/* FILE D'ATTENTE */}
      {enAttente.length > 0 && (
        <>
          <div className="kicker">FILE D'ATTENTE</div>
          <div className="card">
            {enAttente.map((plan, idx) => {
              const book = bible.books.find(b => b.id === plan.livreId)
              return (
                <div key={plan.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0',
                  borderBottom: idx < enAttente.length - 1 ? '1px solid #2a2a3f' : 'none'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 17, fontWeight: 400, color: '#f0ece0' }}>
                      {book?.nom}
                    </div>
                    <div style={{ fontSize: 12, color: '#6a6a82', marginTop: 2 }}>
                      {book?.totalChapitres} chapitres
                    </div>
                  </div>
                  <button className="btn-sm" onClick={() => commencer(plan.id)}
                    style={{ color: '#e8c46a', borderColor: '#e8c46a' }}>
                    ▶ Commencer
                  </button>
                  <button onClick={() => retirerPlan(plan.id)}
                    style={{ color: '#6a6a82', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* TERMINÉS */}
      {termines.length > 0 && (
        <>
          <div className="kicker">TERMINÉS</div>
          <div className="card">
            {termines.map((plan, idx) => {
              const book = bible.books.find(b => b.id === plan.livreId)
              return (
                <div key={plan.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: idx < termines.length - 1 ? '1px solid #2a2a3f' : 'none'
                }}>
                  <span style={{ color: '#4caf82', fontSize: 16 }}>✓</span>
                  <span style={{ flex: 1, fontFamily: 'Cormorant Garamond', fontSize: 17,
                    fontWeight: 400, color: '#a0a0b8' }}>{book?.nom}</span>
                  <button onClick={() => retirerPlan(plan.id)}
                    style={{ color: '#6a6a82', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {bible.plans.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: 32 }}>
          Aucun livre dans ta liste.<br />Ajoute-en un ci-dessus.
        </div>
      )}

      {/* Book picker overlay */}
      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setShowPicker(false)}>
          <div style={{ background: '#151520', borderRadius: '20px 20px 0 0',
            maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #3a3a55',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span className="kicker">CHOISIR UN LIVRE</span>
              <button style={{ color: '#a0a0b8', fontSize: 22, lineHeight: 1 }}
                onClick={() => setShowPicker(false)}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {availableBooks.map(b => (
                <div key={b.id} onClick={() => addPlan(b.id)}
                  style={{ padding: '14px 20px', borderBottom: '1px solid #1e1e2e',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer' }}>
                  <span style={{ color: '#f0ece0', fontSize: 16, fontFamily: 'Cormorant Garamond', fontWeight: 400 }}>
                    {b.nom}
                  </span>
                  <span style={{ color: '#6a6a82', fontSize: 12 }}>{b.totalChapitres} ch.</span>
                </div>
              ))}
              {availableBooks.length === 0 && (
                <div style={{ color: '#6a6a82', fontSize: 13, padding: 24, textAlign: 'center' }}>
                  Tous les livres sont déjà dans ta liste.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
