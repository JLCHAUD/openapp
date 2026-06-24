import { todayISO } from '../../tokens.js'

function daysDiff(dateStr) {
  const today = new Date(todayISO())
  const target = new Date(dateStr)
  return Math.round((target - today) / 86400000)
}

export function T3Deadlines({ tasks, setTasks }) {
  const today = todayISO()
  const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const withDeadline = tasks.tasks.filter(t => t.echeance && t.statut !== 'done')
  const enRetard = withDeadline.filter(t => t.echeance < today)
  const aujourdhui = withDeadline.filter(t => t.echeance === today)
  const semaine = withDeadline.filter(t => t.echeance > today && t.echeance <= inSevenDays)

  function toggleDone(id) {
    setTasks(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, statut: t.statut === 'done' ? 'todo' : 'done' } : t)
    }))
  }

  function TaskRow({ task, meta, metaColor }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 0', borderBottom: '1px solid #3a3a55' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%',
          border: `1.5px solid ${metaColor || '#6a6a82'}`, cursor: 'pointer',
          flexShrink: 0 }} onClick={() => toggleDone(task.id)} />
        <span style={{ flex: 1, fontSize: 14, color: '#f0ece0' }}>{task.titre}</span>
        <span style={{ fontSize: 12, color: metaColor || '#6a6a82' }}>{meta}</span>
      </div>
    )
  }

  function Section({ label, tasks: list, cardClass, metaFn, metaColor }) {
    if (!list.length) return null
    return (
      <div className={`card ${cardClass}`} style={{ marginBottom: 8 }}>
        <div className="kicker" style={{ marginBottom: 10, color: metaColor }}>{label}</div>
        {list.map(t => <TaskRow key={t.id} task={t} meta={metaFn(t)} metaColor={metaColor} />)}
      </div>
    )
  }

  return (
    <>
      <Section label="EN RETARD" tasks={enRetard} cardClass="card--red"
        metaFn={t => `${daysDiff(t.echeance)} j`} metaColor="#e05555" />
      <Section label="AUJOURD'HUI" tasks={aujourdhui} cardClass="card--gold"
        metaFn={t => t.echeance} metaColor="#e8c46a" />
      <Section label="CETTE SEMAINE" tasks={semaine} cardClass=""
        metaFn={t => { const d = daysDiff(t.echeance); return d === 1 ? 'demain' : `dans ${d} j` }}
        metaColor="#a0a0b8" />

      {withDeadline.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: 24 }}>
          Aucune échéance à venir.
        </div>
      )}

      <div style={{ fontSize: 12, color: '#6a6a82', textAlign: 'center' }}>
        Ajoute une échéance depuis la vue Focus ou Tableaux
      </div>
    </>
  )
}
