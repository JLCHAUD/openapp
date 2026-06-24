export function T5Subtasks({ task, onUpdate }) {
  const done = task.sousTaches.filter(s => s.done).length
  const total = task.sousTaches.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  function toggleSub(id) {
    onUpdate({ ...task, sousTaches: task.sousTaches.map(s => s.id === id ? { ...s, done: !s.done } : s) })
  }

  function addSub(label) {
    if (!label.trim()) return
    onUpdate({ ...task, sousTaches: [...task.sousTaches, { id: Date.now().toString(), label, done: false }] })
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="progress-bar-track" style={{ flex: 1 }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span style={{ fontSize: 12, color: '#a0a0b8' }}>{done}/{total}</span>
      </div>
      {task.sousTaches.map(s => (
        <div key={s.id} className="subtask-row">
          <div className={`subtask-check${s.done ? ' done' : ''}`} onClick={() => toggleSub(s.id)}>
            {s.done && <span style={{ color: '#1a1408', fontSize: 11 }}>✓</span>}
          </div>
          <span className={`subtask-label${s.done ? ' done' : ''}`}>{s.label}</span>
        </div>
      ))}
      <div className="subtask-row" style={{ borderBottom: 'none' }}>
        <div className="subtask-check" style={{ opacity: 0.3 }} />
        <input
          placeholder="+ sous-tâche"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#6a6a82', fontSize: 14 }}
          onKeyDown={e => {
            if (e.key === 'Enter') { addSub(e.target.value); e.target.value = '' }
          }}
        />
      </div>
    </div>
  )
}
