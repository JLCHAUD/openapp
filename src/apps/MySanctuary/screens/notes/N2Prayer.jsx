import { useState } from 'react'
import { todayISO } from '../../tokens.js'

export function N2Prayer({ notes, setNotes }) {
  const [view, setView] = useState('en_cours')
  const [showForm, setShowForm] = useState(false)
  const [newTitre, setNewTitre] = useState('')

  const enCours = notes.prayers.filter(p => p.statut === 'en_cours')
  const exaucees = notes.prayers.filter(p => p.statut === 'exaucee')
  const displayed = view === 'en_cours' ? enCours : exaucees

  function addPrayer() {
    if (!newTitre.trim()) return
    setNotes(prev => ({
      ...prev,
      prayers: [...prev.prayers, {
        id: Date.now().toString(), titre: newTitre,
        statut: 'en_cours', dateDebut: todayISO(), foisPriees: 0, dateExaucement: null
      }]
    }))
    setNewTitre('')
    setShowForm(false)
  }

  function marquerExaucee(id) {
    setNotes(prev => ({
      ...prev,
      prayers: prev.prayers.map(p =>
        p.id === id ? { ...p, statut: 'exaucee', dateExaucement: todayISO() } : p
      )
    }))
  }

  function incrementer(id) {
    setNotes(prev => ({
      ...prev,
      prayers: prev.prayers.map(p =>
        p.id === id ? { ...p, foisPriees: p.foisPriees + 1 } : p
      )
    }))
  }

  function daysSince(dateStr) {
    return Math.round((Date.now() - new Date(dateStr)) / 86400000)
  }

  return (
    <>
      <div className="prayer-toggle" style={{ marginBottom: 12 }}>
        <button className={`prayer-toggle-btn${view === 'en_cours' ? ' active' : ''}`}
          onClick={() => setView('en_cours')}>
          EN COURS · {enCours.length}
        </button>
        <button className={`prayer-toggle-btn${view === 'exaucee' ? ' active' : ''}`}
          onClick={() => setView('exaucee')}>
          EXAUCÉES · {exaucees.length}
        </button>
      </div>

      {displayed.map(prayer => (
        <div key={prayer.id}
          className={`card${prayer.statut === 'exaucee' ? ' card--green' : ''}`}
          style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4,
              background: prayer.statut === 'exaucee' ? '#4caf82' : 'none',
              border: `1.5px solid ${prayer.statut === 'exaucee' ? '#4caf82' : '#6a6a82'}`
            }}>
              {prayer.statut === 'exaucee' && (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, color: '#0a0a0f', lineHeight: '10px' }}>✓</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, color: prayer.statut === 'exaucee' ? '#4caf82' : '#f0ece0',
                marginBottom: 4 }}>{prayer.titre}</div>
              <div style={{ fontSize: 11, color: '#6a6a82' }}>
                {prayer.statut === 'en_cours'
                  ? `depuis ${daysSince(prayer.dateDebut)} jours · prié ${prayer.foisPriees} fois`
                  : `exaucée le ${prayer.dateExaucement}`}
              </div>
            </div>
            {prayer.statut === 'en_cours' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-sm" onClick={() => incrementer(prayer.id)}>+1</button>
                <button className="btn-sm" style={{ color: '#4caf82', borderColor: '#4caf82' }}
                  onClick={() => marquerExaucee(prayer.id)}>✓</button>
              </div>
            )}
          </div>
        </div>
      ))}

      {displayed.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: 24 }}>
          {view === 'en_cours' ? 'Aucune prière en cours.' : 'Aucune prière exaucée.'}
        </div>
      )}

      {showForm ? (
        <div className="card" style={{ marginTop: 8 }}>
          <input placeholder="Sujet de prière…" value={newTitre}
            onChange={e => setNewTitre(e.target.value)}
            style={{ display: 'block', width: '100%', background: 'none', border: 'none',
              outline: 'none', color: '#f0ece0', fontSize: 16, marginBottom: 12 }}
            onKeyDown={e => e.key === 'Enter' && addPrayer()} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
            <button className="btn-gold" style={{ flex: 1 }} onClick={addPrayer}>AJOUTER</button>
          </div>
        </div>
      ) : (
        <button className="btn-outline-dashed" onClick={() => setShowForm(true)}>
          + NOUVELLE PRIÈRE
        </button>
      )}
    </>
  )
}
