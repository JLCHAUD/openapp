import { useState } from 'react'
import { T5Subtasks } from './T5Subtasks.jsx'

const inputBase = {
  background: 'none', border: '1.5px dashed #5a5a82', borderRadius: 10,
  padding: '10px 14px', color: '#a0a0b8', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
}

export function T1Focus({ tasks, setTasks }) {
  const [expanded, setExpanded] = useState(null)
  const [addingSlot, setAddingSlot] = useState(null)
  const [newTask, setNewTask] = useState('')

  const allTasks = tasks.tasks
  const priorities = [1, 2, 3].map(p => allTasks.find(t => t.priorite === p) ?? null)
  const plusTard = allTasks.filter(t => !t.priorite && t.statut !== 'done')

  function updateTask(updated) {
    setTasks(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updated.id ? updated : t) }))
  }

  function addPriority(titre, slot) {
    if (!titre.trim()) return
    setTasks(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: Date.now().toString(), titre, priorite: slot,
        categorie: 'PERSONNEL', echeance: null, statut: 'todo', sousTaches: [] }]
    }))
    setAddingSlot(null)
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

  function addTask() {
    if (!newTask.trim()) return
    setTasks(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: Date.now().toString(), titre: newTask, priorite: null,
        categorie: 'PERSONNEL', echeance: null, statut: 'todo', sousTaches: [] }]
    }))
    setNewTask('')
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
            {expanded === task.id && <T5Subtasks task={task} onUpdate={updateTask} />}
          </div>
        ) : addingSlot === i + 1 ? (
          <div key={`slot-adding-${i}`} className="card card--gold" style={{ marginBottom: 8 }}>
            <input
              autoFocus
              placeholder="Titre de la priorité…"
              style={{ background: 'transparent', border: 'none', padding: '4px 0',
                color: '#f0ece0', fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              onKeyDown={e => { if (e.key === 'Enter') addPriority(e.target.value, i + 1) }}
              onBlur={e => { if (e.target.value.trim()) addPriority(e.target.value, i + 1); else setAddingSlot(null) }}
            />
          </div>
        ) : (
          <div key={`slot-${i}`} onClick={() => setAddingSlot(i + 1)}
            style={{ border: '1.5px dashed #5a5a82', background: 'transparent',
              padding: '14px 16px', marginBottom: 8, color: '#8080a0',
              fontFamily: 'Cormorant Garamond', fontSize: 16, fontStyle: 'italic',
              borderRadius: 14, cursor: 'pointer' }}>
            + Ajouter une priorité…
          </div>
        )
      ))}

      {plusTard.length > 0 && (
        <>
          <div className="kicker" style={{ marginTop: 8, marginBottom: 10 }}>PLUS TARD</div>
          {plusTard.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center',
              gap: 12, padding: '10px 0', borderBottom: '1px solid #3a3a55' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #6a6a82', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: '#a0a0b8' }}>{task.titre}</span>
              <button className="btn-sm" onClick={() => promote(task.id)}>↑ Priorité</button>
            </div>
          ))}
        </>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="+ Nouvelle tâche…"
          style={{ ...inputBase, flex: 1 }}
          onKeyDown={e => { if (e.key === 'Enter') addTask() }}
        />
        <button onClick={addTask}
          style={{ background: '#1e1e2e', border: '1.5px solid #5a5a82', borderRadius: 10,
            padding: '10px 18px', color: '#a0a0b8', fontSize: 20, lineHeight: 1 }}>+</button>
      </div>
    </>
  )
}
