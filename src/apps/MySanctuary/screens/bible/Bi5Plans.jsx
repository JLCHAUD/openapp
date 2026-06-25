import { useState } from 'react'

const RYTHMES = [{ id: 1, label: '1 ch/j' }, { id: 3, label: '3 ch/j' }, { id: 0, label: 'Libre' }]

export function Bi5Plans({ bible, setBible }) {
  const [rythme, setRythme] = useState(1)
  const [showPicker, setShowPicker] = useState(false)

  const enCours = bible.plans.filter((_, i) => i < 2)
  const aVenir = bible.plans.slice(2)

  function addPlan(bookId) {
    const book = bible.books.find(b => b.id === bookId)
    if (!book) return
    setBible(prev => ({
      ...prev,
      plans: [...prev.plans, {
        id: Date.now().toString(),
        livreId: bookId,
        jourActuel: 1,
        total: book.totalChapitres,
        type: 'fixe'
      }]
    }))
    setShowPicker(false)
  }

  function moveUp(idx) {
    if (idx <= 2) return
    setBible(prev => {
      const plans = [...prev.plans]
      ;[plans[idx - 1], plans[idx]] = [plans[idx], plans[idx - 1]]
      return { ...prev, plans }
    })
  }

  function moveDown(idx) {
    setBible(prev => {
      const plans = [...prev.plans]
      if (idx >= plans.length - 1) return prev
      ;[plans[idx], plans[idx + 1]] = [plans[idx + 1], plans[idx]]
      return { ...prev, plans }
    })
  }

  const alreadyInPlans = new Set(bible.plans.map(p => p.livreId))
  const availableBooks = bible.books.filter(b => !alreadyInPlans.has(b.id))

  return (
    <>
      <button className="btn-outline-dashed" onClick={() => setShowPicker(true)}>
        + CHOISIR UN LIVRE À LIRE
      </button>

      {enCours.length > 0 && (
        <div>
          <div className="kicker" style={{ marginBottom: 10 }}>EN COURS</div>
          {enCours.map((plan) => {
            const book = bible.books.find(b => b.id === plan.livreId)
            const pct = Math.round((plan.jourActuel / plan.total) * 100)
            return (
              <div key={plan.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 18, color: '#f0ece0' }}>
                    {book?.nom}
                  </div>
                  <div className="kicker">
                    {plan.type === 'fixe' ? `JOUR ${plan.jourActuel}/${plan.total}` : 'LIBRE'}
                  </div>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {aVenir.length > 0 && (
        <div>
          <div className="kicker" style={{ marginBottom: 10 }}>À VENIR</div>
          {aVenir.map((plan, relIdx) => {
            const absIdx = relIdx + 2
            const book = bible.books.find(b => b.id === plan.livreId)
            return (
              <div key={plan.id} style={{ display: 'flex', alignItems: 'center',
                gap: 12, padding: '10px 0', borderBottom: '1px solid #3a3a55' }}>
                <span style={{ color: '#6a6a82', fontSize: 18 }}>⠿</span>
                <span style={{ flex: 1, color: '#f0ece0', fontSize: 15 }}>{book?.nom}</span>
                <span style={{ color: '#6a6a82', fontSize: 12 }}>{book?.totalChapitres} ch.</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-sm" onClick={() => moveUp(absIdx)}>↑</button>
                  <button className="btn-sm" onClick={() => moveDown(absIdx)}>↓</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {bible.plans.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: 24 }}>
          Aucun plan pour l'instant.<br />Ajoute un livre ci-dessus.
        </div>
      )}

      <div>
        <div className="kicker" style={{ marginBottom: 10 }}>RYTHME</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {RYTHMES.map(r => (
            <button key={r.id} className="btn-sm"
              style={rythme === r.id ? { color: '#e8c46a', borderColor: '#e8c46a' } : {}}
              onClick={() => setRythme(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setShowPicker(false)}>
          <div style={{ background: '#151520', borderRadius: '20px 20px 0 0',
            maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #3a3a55',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0 }}>
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
                  <span style={{ color: '#f0ece0', fontSize: 15 }}>{b.nom}</span>
                  <span style={{ color: '#6a6a82', fontSize: 12 }}>{b.totalChapitres} ch.</span>
                </div>
              ))}
              {availableBooks.length === 0 && (
                <div style={{ color: '#6a6a82', fontSize: 13, padding: 24, textAlign: 'center' }}>
                  Tous les livres sont déjà dans tes plans.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
