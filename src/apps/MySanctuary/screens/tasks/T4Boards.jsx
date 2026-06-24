import { useState } from 'react'

export function T4Boards({ tasks, setTasks }) {
  const [activeCol, setActiveCol] = useState(tasks.categories[0] || 'PERSONNEL')
  const [expanded, setExpanded] = useState(null)

  function moveTask(taskId, toCategorie) {
    setTasks(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, categorie: toCategorie } : t)
    }))
  }

  function toggleDone(id) {
    setTasks(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, statut: t.statut === 'done' ? 'todo' : 'done' } : t)
    }))
  }

  function addTask(titre, categorie) {
    if (!titre.trim()) return
    setTasks(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: Date.now().toString(), titre, priorite: null,
        categorie, echeance: null, statut: 'todo', sousTaches: [] }]
    }))
  }

  return (
    <>
      {/* En-têtes colonnes */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {tasks.categories.map(cat => {
          const count = tasks.tasks.filter(t => t.categorie === cat && t.statut !== 'done').length
          return (
            <button key={cat} onClick={() => setActiveCol(cat)}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 10,
                background: activeCol === cat ? 'rgba(232,196,106,0.1)' : '#151520',
                border: `2px solid ${activeCol === cat ? '#e8c46a' : '#3a3a55'}`,
                color: activeCol === cat ? '#e8c46a' : '#a0a0b8',
                fontFamily: 'Cinzel', fontSize: 9, letterSpacing: 2,
              }}>
              {cat} · {count}
            </button>
          )
        })}
      </div>

      {/* Cartes de la colonne active */}
      <div>
        {tasks.tasks
          .filter(t => t.categorie === activeCol && t.statut !== 'done')
          .map(task => (
            <div key={task.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%',
                  border: '1.5px solid #6a6a82', cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => toggleDone(task.id)} />
                <span style={{ flex: 1, fontSize: 14, color: '#f0ece0' }}>{task.titre}</span>
                <button className="btn-sm" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
                  {expanded === task.id ? '⌃' : '⌄'}
                </button>
              </div>
              {expanded === task.id && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tasks.categories.filter(c => c !== activeCol).map(cat => (
                    <button key={cat} className="btn-sm"
                      onClick={() => { moveTask(task.id, cat); setExpanded(null) }}>
                      → {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

        <input
          placeholder="+ Tâche dans cette colonne…"
          style={{ background: 'none', border: '1px dashed #3a3a55', borderRadius: 10,
            padding: '10px 14px', color: '#a0a0b8', fontSize: 14, width: '100%', outline: 'none' }}
          onKeyDown={e => { if (e.key === 'Enter') { addTask(e.target.value, activeCol); e.target.value = '' } }}
        />
      </div>
    </>
  )
}
