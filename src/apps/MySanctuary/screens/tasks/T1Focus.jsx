import { useState } from 'react'
import { T5Subtasks } from './T5Subtasks.jsx'

export function T1Focus({ tasks, setTasks }) {
  const [expanded, setExpanded] = useState(null)

  const allTasks = tasks.tasks
  const priorities = [1, 2, 3].map(p => allTasks.find(t => t.priorite === p) ?? null)
  const plusTard = allTasks.filter(t => !t.priorite && t.statut !== 'done')

  function updateTask(updated) {
    setTasks(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updated.id ? updated : t) }))
  }

  function promote(taskId) {
    const slot = priorities.findIndex(p => !p)
    if (slot === -1) return
    setTasks(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, priorite: slot + 1 } : t)
    }))
  }

  function demote(taskId) {
    setTasks(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, priorite: null } : t)
    }))
  }

  function addTask(titre) {
    if (!titre.trim()) return
    setTasks(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: Date.now().toString(), titre, priorite: null,
        categorie: 'PERSONNEL', echeance: null, statut: 'todo', sousTaches: [] }]
    }))
  }

  return (
    <>
      <div className="kicker" style={{ marginBottom: 10 }}>PRIORITÉS DU JOUR</div>

      {priorities.map((task, i) => (
        task ? (
          <div key={task.id} className="card card--gold" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontFamily: 'Cormorant Garamond', fontSize: 36,
                color: '#e8c46a', lineHeight: 1, minWidth: 24 }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: '#f0ece0', marginBottom: 4 }}>{task.titre}</div>
                {task.sousTaches.length > 0 && (
                  <div style={{ fontSize: 11, color: '#a0a0b8' }}>
                    {task.sousTaches.filter(s => s.done).length}/{task.sousTaches.length} sous-tâches
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-sm" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
                  {expanded === task.id ? '⌃' : '⌄'}
                </button>
                <button className="btn-sm" onClick={() => demote(task.id)}>↓</button>
              </div>
            </div>
            {expanded === task.id && (
              <T5Subtasks task={task} onUpdate={updateTask} />
            )}
          </div>
        ) : (
          <div key={`slot-${i}`} className="card" style={{
            border: '1px dashed #3a3a55', background: 'transparent',
            padding: '14px 16px', marginBottom: 8, color: '#3a3a55',
            fontFamily: 'Cormorant Garamond', fontSize: 15, fontStyle: 'italic'
          }}>
            Ajouter une priorité…
          </div>
        )
      ))}

      {plusTard.length > 0 && (
        <>
          <div className="kicker" style={{ marginTop: 8, marginBottom: 10 }}>PLUS TARD</div>
          {plusTard.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center',
              gap: 12, padding: '10px 0', borderBottom: '1px solid #3a3a55', opacity: 0.7 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #6a6a82' }} />
              <span style={{ flex: 1, fontSize: 14, color: '#a0a0b8' }}>{task.titre}</span>
              <button className="btn-sm" onClick={() => promote(task.id)}>↑</button>
            </div>
          ))}
        </>
      )}

      <div style={{ fontSize: 12, color: '#6a6a82', textAlign: 'center', padding: '8px 0' }}>
        Utilise ↑ pour promouvoir une tâche en priorité
      </div>

      <input
        placeholder="+ Nouvelle tâche…"
        style={{ background: 'none', border: '1px dashed #3a3a55', borderRadius: 10,
          padding: '10px 14px', color: '#a0a0b8', fontSize: 14, width: '100%', outline: 'none' }}
        onKeyDown={e => { if (e.key === 'Enter') { addTask(e.target.value); e.target.value = '' } }}
      />
    </>
  )
}
