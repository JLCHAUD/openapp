import { todayISO } from '../../tokens.js'

const DAYS = ['L','M','M','J','V','S','D']

function getWeekDates() {
  const today = new Date()
  const dow = today.getDay() // 0=Sun
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export function T2Habits({ tasks, setTasks }) {
  const week = getWeekDates()
  const today = todayISO()
  const habits = tasks.habits

  function toggleDay(habitId, dateStr) {
    setTasks(prev => ({
      ...prev,
      habits: prev.habits.map(h =>
        h.id === habitId
          ? {
              ...h,
              joursFaits: h.joursFaits.includes(dateStr)
                ? h.joursFaits.filter(d => d !== dateStr)
                : [...h.joursFaits, dateStr]
            }
          : h
      )
    }))
  }

  function addHabit(nom) {
    if (!nom.trim()) return
    setTasks(prev => ({
      ...prev,
      habits: [...prev.habits, { id: Date.now().toString(), nom, joursFaits: [] }]
    }))
  }

  return (
    <>
      {/* En-tête jours */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 24px)',
        gap: 6, alignItems: 'center', padding: '0 16px', marginBottom: 8 }}>
        <span />
        {DAYS.map((d, i) => (
          <span key={i} style={{ fontFamily: 'Cinzel', fontSize: 9,
            color: week[i] === today ? '#e8c46a' : '#6a6a82', textAlign: 'center' }}>{d}</span>
        ))}
      </div>

      {habits.map(habit => (
        <div key={habit.id} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 24px)',
            gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#f0ece0' }}>{habit.nom}</span>
            {week.map((dateStr, i) => {
              const done = habit.joursFaits.includes(dateStr)
              const isToday = dateStr === today
              return (
                <div key={i}
                  className={`habit-circle${done ? ' done' : isToday ? ' today' : ''}`}
                  onClick={() => isToday ? toggleDay(habit.id, dateStr) : null}
                  style={{ cursor: isToday ? 'pointer' : 'default' }}
                >
                  {done && <span style={{ color: '#1a1408', fontSize: 10 }}>✓</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {habits.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: 24 }}>
          Aucune habitude. Ajoutes-en une ci-dessous.
        </div>
      )}

      <input
        placeholder="+ Nouvelle habitude…"
        style={{ background: 'none', border: '1.5px dashed #5a5a82', borderRadius: 10,
          padding: '10px 14px', color: '#a0a0b8', fontSize: 14, width: '100%',
          outline: 'none', boxSizing: 'border-box' }}
        onKeyDown={e => { if (e.key === 'Enter') { addHabit(e.target.value); e.target.value = '' } }}
      />
    </>
  )
}
