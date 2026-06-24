import { useState } from 'react'
import { todayISO } from '../../tokens.js'

const NOTE_TYPES = [
  { id: 'tous', label: 'Tous', color: '#e8c46a' },
  { id: 'réflexion', label: 'Réflexion', color: '#e8c46a' },
  { id: 'prière', label: 'Prière', color: '#a89cf8' },
  { id: 'gratitude', label: 'Gratitude', color: '#4caf82' },
  { id: 'prophétie', label: 'Prophétie', color: '#e8c46a' },
  { id: 'sermon', label: 'Sermon', color: '#a0a0b8' },
]

export function N1Notes({ notes, setNotes, navigate }) {
  const [activeType, setActiveType] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', contenu: '', type: 'réflexion' })

  const filtered = activeType === 'tous'
    ? notes.notes
    : notes.notes.filter(n => n.type === activeType)

  function typeColor(type) {
    return NOTE_TYPES.find(t => t.id === type)?.color ?? '#e8c46a'
  }

  function addNote() {
    if (!form.titre.trim()) return
    setNotes(prev => ({
      ...prev,
      notes: [{ id: Date.now().toString(), ...form, date: todayISO() }, ...prev.notes]
    }))
    setForm({ titre: '', contenu: '', type: 'réflexion' })
    setShowForm(false)
  }

  return (
    <>
      <div className="note-chips">
        {NOTE_TYPES.map(t => (
          <button key={t.id} className={`note-chip${activeType === t.id ? ' active' : ''}`}
            onClick={() => setActiveType(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {showForm ? (
        <div className="card card--gold">
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={{ background: 'none', color: '#e8c46a', border: 'none', fontFamily: 'Cinzel',
              fontSize: 9, letterSpacing: 2, marginBottom: 10, outline: 'none', width: '100%' }}>
            {NOTE_TYPES.filter(t => t.id !== 'tous').map(t => (
              <option key={t.id} value={t.id} style={{ background: '#151520' }}>{t.label}</option>
            ))}
          </select>
          <input placeholder="Titre…"
            value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
            style={{ display: 'block', width: '100%', background: 'none', border: 'none',
              outline: 'none', color: '#f0ece0', fontSize: 18,
              fontFamily: 'Cormorant Garamond', marginBottom: 10 }} />
          <textarea placeholder="Contenu…" rows={4}
            value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
            style={{ display: 'block', width: '100%', background: 'none', border: 'none',
              outline: 'none', color: '#a0a0b8', fontSize: 14, resize: 'none' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
            <button className="btn-gold" style={{ flex: 1 }} onClick={addNote}>ENREGISTRER</button>
          </div>
        </div>
      ) : (
        <button className="btn-outline-dashed" onClick={() => setShowForm(true)}>
          + NOUVELLE NOTE
        </button>
      )}

      {filtered.map(note => (
        <div key={note.id} className="card" style={{ marginBottom: 8 }}>
          <div className="kicker" style={{ color: typeColor(note.type), marginBottom: 6 }}>
            {note.type.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 18,
            color: '#f0ece0', marginBottom: 6 }}>{note.titre}</div>
          {note.contenu && (
            <div style={{ fontSize: 13, color: '#a0a0b8', marginBottom: 8,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' }}>{note.contenu}</div>
          )}
          <div className="kicker" style={{ color: '#6a6a82' }}>{note.date}</div>
        </div>
      ))}

      {filtered.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: 24 }}>
          Aucune note{activeType !== 'tous' ? ` de type "${activeType}"` : ''}.
        </div>
      )}
    </>
  )
}
