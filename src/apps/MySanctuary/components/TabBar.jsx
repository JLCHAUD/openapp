import { Book, Edit, Mic } from 'lucide-react'

const TABS = [
  { id: 'bible', label: 'BIBLE', Icon: Book },
  // { id: 'tasks', label: 'TÂCHES', Icon: CheckSquare }, // mis de côté pour simplifier (réactivable)
  { id: 'notes', label: 'NOTES', Icon: Edit },
  { id: 'enr', label: 'ENR', Icon: Mic },
]

export function TabBar({ activeTab, onChange, isRecording }) {
  return (
    <nav className="ms-tabbar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`ms-tab${activeTab === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
          style={{ position: 'relative' }}
        >
          <Icon size={17} strokeWidth={2} />
          <span className="ms-tab-label">{label}</span>
          {id === 'enr' && isRecording && activeTab !== 'enr' && (
            <span className="rec-blink" style={{ position: 'absolute', top: 2, right: '30%',
              width: 8, height: 8, borderRadius: '50%', background: '#e05555' }} />
          )}
        </button>
      ))}
    </nav>
  )
}
