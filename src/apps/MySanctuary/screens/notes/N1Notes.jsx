import { useState, useEffect, useRef } from 'react'
import { Trash2, X } from 'lucide-react'
import { todayISO, NOTE_TYPES } from '../../tokens.js'
import { getRecording, deleteRecording } from '../../lib/audioStore.js'
import { deleteRemote } from '../../lib/syncClient.js'

const BASE_TYPES = NOTE_TYPES

const EXTRA_COLORS = ['#e05555', '#f0a060', '#b0d060', '#c080f0', '#60d0d0']

export function N1Notes({ notes, setNotes }) {
  const [activeType, setActiveType] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ titre: '', contenu: '', type: 'réflexion' })
  const [addingTheme, setAddingTheme] = useState(false)
  const [newTheme, setNewTheme] = useState('')
  const [readingNote, setReadingNote] = useState(null)
  const [, setAudioTick] = useState(0)
  const audioUrls = useRef({})

  // Charge les URLs audio des notes issues de dictées (lien vers IndexedDB)
  useEffect(() => {
    let cancelled = false
    async function load() {
      Object.values(audioUrls.current).forEach(URL.revokeObjectURL)
      audioUrls.current = {}
      for (const n of notes.notes) {
        if (!n.audioId) continue
        const rec = await getRecording(n.audioId)
        if (rec?.blob && !cancelled) audioUrls.current[n.id] = URL.createObjectURL(rec.blob)
      }
      if (!cancelled) setAudioTick(t => t + 1)
    }
    load()
    return () => { cancelled = true; Object.values(audioUrls.current).forEach(URL.revokeObjectURL) }
  }, [notes.notes])

  const customTypes = notes.customTypes ?? []
  const allTypes = [...BASE_TYPES, ...customTypes]
  const filterTypes = [{ id: 'tous', label: 'Tous', color: '#e8c46a' }, ...allTypes]

  const filtered = activeType === 'tous'
    ? notes.notes
    : notes.notes.filter(n => n.type === activeType)

  function typeColor(type) {
    return allTypes.find(t => t.id === type)?.color ?? '#e8c46a'
  }

  function openNew() {
    setEditId(null)
    setForm({ titre: '', contenu: '', type: 'réflexion' })
    setShowForm(true)
  }

  function openEdit(note) {
    setEditId(note.id)
    setForm({ titre: note.titre, contenu: note.contenu ?? '', type: note.type })
    setShowForm(true)
  }

  function saveNote() {
    if (!form.titre.trim()) return
    if (editId) {
      setNotes(prev => ({
        ...prev,
        notes: prev.notes.map(n => n.id === editId ? { ...n, ...form } : n)
      }))
    } else {
      setNotes(prev => ({
        ...prev,
        notes: [{ id: Date.now().toString(), ...form, date: todayISO() }, ...prev.notes]
      }))
    }
    setForm({ titre: '', contenu: '', type: 'réflexion' })
    setShowForm(false)
    setEditId(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm({ titre: '', contenu: '', type: 'réflexion' })
  }

  function addCustomType() {
    const label = newTheme.trim()
    if (!label) { setAddingTheme(false); return }
    const id = label.toLowerCase().replace(/\s+/g, '-')
    if (allTypes.find(t => t.id === id)) { setAddingTheme(false); setNewTheme(''); return }
    const color = EXTRA_COLORS[customTypes.length % EXTRA_COLORS.length]
    setNotes(prev => ({
      ...prev,
      customTypes: [...(prev.customTypes ?? []), { id, label, color }]
    }))
    setNewTheme('')
    setAddingTheme(false)
  }

  async function deleteNote(note) {
    if (note.audioId) {
      const rec = await getRecording(note.audioId)
      if (rec) await deleteRemote(rec)
      await deleteRecording(note.audioId)
    }
    setNotes(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== note.id) }))
  }

  async function removeAudio(note) {
    if (!note.audioId) return
    const rec = await getRecording(note.audioId)
    if (rec) await deleteRemote(rec)
    await deleteRecording(note.audioId)
    setNotes(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === note.id ? { ...n, audioId: null } : n)
    }))
  }

  function removeCustomType(id) {
    setNotes(prev => ({
      ...prev,
      customTypes: (prev.customTypes ?? []).filter(t => t.id !== id)
    }))
    if (activeType === id) setActiveType('tous')
  }

  return (
    <>
      {/* Chips de filtre */}
      <div className="note-chips" style={{ alignItems: 'center' }}>
        {filterTypes.map(t => (
          <button key={t.id} className={`note-chip${activeType === t.id ? ' active' : ''}`}
            onClick={() => setActiveType(t.id)}>
            {t.label}
          </button>
        ))}
        {customTypes.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button className={`note-chip${activeType === t.id ? ' active' : ''}`}
              style={{ borderColor: activeType === t.id ? t.color : undefined,
                color: activeType === t.id ? t.color : undefined }}
              onClick={() => setActiveType(t.id)}>
              {t.label}
            </button>
            <button onClick={() => removeCustomType(t.id)}
              style={{ color: '#6a6a82', fontSize: 12, lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>
        ))}

        {/* Ajouter un thème */}
        {addingTheme ? (
          <input
            autoFocus
            value={newTheme}
            onChange={e => setNewTheme(e.target.value)}
            placeholder="Nom du thème…"
            style={{ background: '#1e1e2e', border: '1px solid #5a5a82', borderRadius: 16,
              padding: '4px 10px', color: '#f0ece0', fontSize: 11, outline: 'none', width: 110 }}
            onKeyDown={e => { if (e.key === 'Enter') addCustomType(); if (e.key === 'Escape') { setAddingTheme(false); setNewTheme('') } }}
            onBlur={addCustomType}
          />
        ) : (
          <button onClick={() => setAddingTheme(true)}
            style={{ border: '1px dashed #5a5a82', borderRadius: 16, padding: '4px 10px',
              color: '#6a6a82', fontSize: 11, fontFamily: 'Cinzel' }}>+ thème</button>
        )}
      </div>

      {/* Formulaire création / édition */}
      {showForm ? (
        <div className="card card--gold">
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={{ background: 'none', color: '#e8c46a', border: 'none', fontFamily: 'Cinzel',
              fontSize: 9, letterSpacing: 2, marginBottom: 10, outline: 'none', width: '100%' }}>
            {allTypes.map(t => (
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
            <button className="btn-sm" onClick={cancelForm}>Annuler</button>
            <button className="btn-gold" style={{ flex: 1 }} onClick={saveNote}>
              {editId ? 'METTRE À JOUR' : 'ENREGISTRER'}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-outline-dashed" onClick={openNew}>
          + NOUVELLE NOTE
        </button>
      )}

      {/* Liste des notes */}
      {filtered.map(note => (
        <div key={note.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div className="kicker" style={{ color: typeColor(note.type) }}>
              {note.type.toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => openEdit(note)}
                style={{ color: '#6a6a82', fontSize: 13, lineHeight: 1, padding: '0 2px' }}>✏</button>
              <button onClick={() => deleteNote(note)} aria-label="Supprimer la note"
                style={{ color: '#6a6a82', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div onClick={() => setReadingNote(note)} style={{ cursor: 'pointer' }}>
            <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 18,
              color: '#f0ece0', marginBottom: 6 }}>{note.titre}</div>
            {note.contenu && (
              <div style={{ fontSize: 13, color: '#a0a0b8', marginBottom: 8,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' }}>{note.contenu}</div>
            )}
          </div>
          {note.audioId && audioUrls.current[note.id] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <audio controls src={audioUrls.current[note.id]} style={{ flex: 1, height: 32 }} />
              <button onClick={() => removeAudio(note)} aria-label="Supprimer l'audio"
                title="Garder le texte, supprimer l'audio"
                style={{ color: '#6a6a82', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
          <div className="kicker" style={{ color: '#6a6a82' }}>
            {note.source === 'dictee' ? '🎙 ' : ''}{note.date}
          </div>
        </div>
      ))}

      {filtered.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: 24 }}>
          Aucune note{activeType !== 'tous' ? ` de type "${activeType}"` : ''}.
        </div>
      )}

      {/* Mode lecture plein écran : police sobre sans empattement, grande et espacée */}
      {readingNote && (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', zIndex: 100,
          display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ position: 'sticky', top: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', background: '#0a0a0f',
            borderBottom: '1px solid #2a2a3a',
            padding: 'calc(16px + env(safe-area-inset-top)) 20px 16px' }}>
            <div className="kicker" style={{ color: typeColor(readingNote.type) }}>
              {readingNote.type.toUpperCase()} · {readingNote.date}
            </div>
            <button onClick={() => setReadingNote(null)} aria-label="Fermer le mode lecture"
              style={{ color: '#a0a0b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 10, margin: -10 }}>
              <X size={22} />
            </button>
          </div>
          <div style={{ padding: '24px 20px 48px', flex: 1 }}>
            <h1 style={{ fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 700,
              fontSize: 24, color: '#f0ece0', margin: '0 0 20px' }}>{readingNote.titre}</h1>
            {readingNote.audioId && audioUrls.current[readingNote.id] && (
              <audio controls src={audioUrls.current[readingNote.id]}
                style={{ width: '100%', height: 36, marginBottom: 20 }} />
            )}
            <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 400,
              fontSize: 17, lineHeight: 1.7, color: '#e8e4d8', whiteSpace: 'pre-wrap' }}>
              {readingNote.contenu || 'Pas de contenu.'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
