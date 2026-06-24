import { useState } from 'react'

const RYTHMES = [{ id: 1, label: '1 ch/j' }, { id: 3, label: '3 ch/j' }, { id: 0, label: 'Libre' }]

export function Bi5Plans({ bible, setBible }) {
  const [rythme, setRythme] = useState(1)

  const enCours = bible.plans.filter((_, i) => i < 2)
  const aVenir = bible.plans.slice(2)

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

  return (
    <>
      <button className="btn-outline-dashed">+ CHOISIR UN LIVRE À LIRE</button>

      {enCours.length > 0 && (
        <div>
          <div className="kicker" style={{ marginBottom: 10 }}>EN COURS</div>
          {enCours.map((plan, i) => {
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
                <span style={{ color: '#6a6a82', fontSize: 18, cursor: 'grab' }}>⠿</span>
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

      {/* Sélecteur de rythme */}
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
    </>
  )
}
