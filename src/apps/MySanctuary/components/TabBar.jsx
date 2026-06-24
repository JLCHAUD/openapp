import { Book, CheckSquare, Edit } from 'lucide-react'

const TABS = [
  { id: 'bible', label: 'BIBLE', Icon: Book },
  { id: 'tasks', label: 'TÂCHES', Icon: CheckSquare },
  { id: 'notes', label: 'NOTES', Icon: Edit },
]

export function TabBar({ activeTab, onChange }) {
  return (
    <nav className="ms-tabbar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`ms-tab${activeTab === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={17} strokeWidth={2} />
          <span className="ms-tab-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
