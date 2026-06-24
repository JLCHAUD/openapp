import { useState, lazy, Suspense } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { initBibleState, initTasksState, initNotesState } from './tokens.js'
import { Header } from './components/Header.jsx'
import { TabBar } from './components/TabBar.jsx'
import './MySanctuary.css'

const Bi1Home    = lazy(() => import('./screens/bible/Bi1Home.jsx').then(m => ({ default: m.Bi1Home })))
const Bi2Map     = lazy(() => import('./screens/bible/Bi2Map.jsx').then(m => ({ default: m.Bi2Map })))
const Bi3Book    = lazy(() => import('./screens/bible/Bi3Book.jsx').then(m => ({ default: m.Bi3Book })))
const Bi4Verses  = lazy(() => import('./screens/bible/Bi4Verses.jsx').then(m => ({ default: m.Bi4Verses })))
const Bi5Plans   = lazy(() => import('./screens/bible/Bi5Plans.jsx').then(m => ({ default: m.Bi5Plans })))
const T1Focus    = lazy(() => import('./screens/tasks/T1Focus.jsx').then(m => ({ default: m.T1Focus })))
const T2Habits   = lazy(() => import('./screens/tasks/T2Habits.jsx').then(m => ({ default: m.T2Habits })))
const T3Deadlines= lazy(() => import('./screens/tasks/T3Deadlines.jsx').then(m => ({ default: m.T3Deadlines })))
const T4Boards   = lazy(() => import('./screens/tasks/T4Boards.jsx').then(m => ({ default: m.T4Boards })))
const N1Notes    = lazy(() => import('./screens/notes/N1Notes.jsx').then(m => ({ default: m.N1Notes })))
const N2Prayer   = lazy(() => import('./screens/notes/N2Prayer.jsx').then(m => ({ default: m.N2Prayer })))
const N3Dictee   = lazy(() => import('./screens/notes/N3Dictee.jsx').then(m => ({ default: m.N3Dictee })))

const BACK_MAP = {
  Bi2Map:    { screen: 'Bi1Home', params: {} },
  Bi3Book:   { screen: 'Bi2Map',  params: {} },
  Bi4Verses: (params) => ({ screen: 'Bi3Book', params: { bookId: params.bookId, bookName: params.bookName } }),
  Bi5Plans:  { screen: 'Bi1Home', params: {} },
  N2Prayer:  { screen: 'N1Notes', params: {} },
  N3Dictee:  { screen: 'N1Notes', params: {} },
}

const SCREEN_TITLES = {
  Bi1Home: 'Bible',
  Bi2Map: 'Carte de lecture',
  Bi5Plans: 'Mes plans',
  N2Prayer: 'Carnet de prière',
  N3Dictee: 'Dictée vocale',
}

export default function MySanctuary({ onBack }) {
  const [activeTab, setActiveTab] = useState('bible')
  const [nav, setNav] = useState({ screen: 'Bi1Home', params: {} })
  const [activeTaskView, setActiveTaskView] = useState('T1Focus')

  const [bible, setBible] = useLocalStorage('ms_bible', initBibleState())
  const [tasks, setTasks] = useLocalStorage('ms_tasks', initTasksState())
  const [notes, setNotes] = useLocalStorage('ms_notes', initNotesState())

  function navigate(screen, params = {}) { setNav({ screen, params }) }

  function goBack() {
    const entry = BACK_MAP[nav.screen]
    if (!entry) return
    setNav(typeof entry === 'function' ? entry(nav.params) : entry)
  }

  const isSecondary = activeTab !== 'tasks' && !['Bi1Home', 'N1Notes'].includes(nav.screen)

  function headerTitle() {
    if (activeTab === 'tasks') return 'Tâches'
    if (nav.screen === 'Bi3Book') return nav.params.bookName || 'Livre'
    if (nav.screen === 'Bi4Verses') return `${nav.params.bookName || ''} ${nav.params.chapterNum || ''}`.trim()
    return SCREEN_TITLES[nav.screen] || 'Mon Sanctuaire'
  }

  const screenProps = { bible, setBible, tasks, setTasks, notes, setNotes, navigate }

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'bible') setNav({ screen: 'Bi1Home', params: {} })
    if (tab === 'notes') setNav({ screen: 'N1Notes', params: {} })
  }

  function renderContent() {
    if (activeTab === 'bible') {
      const screens = { Bi1Home, Bi2Map, Bi3Book, Bi4Verses, Bi5Plans }
      const Screen = screens[nav.screen]
      return Screen ? <Screen {...screenProps} params={nav.params} /> : null
    }
    if (activeTab === 'tasks') {
      const views = { T1Focus, T2Habits, T3Deadlines, T4Boards }
      const Screen = views[activeTaskView]
      return (
        <>
          <div className="task-subnav">
            {[['T1Focus','Focus'],['T2Habits','Habitudes'],['T3Deadlines','Échéances'],['T4Boards','Tableaux']].map(([id, label]) => (
              <button key={id}
                className={`task-subnav-btn${activeTaskView === id ? ' active' : ''}`}
                onClick={() => setActiveTaskView(id)}>{label}</button>
            ))}
          </div>
          {Screen ? <Screen {...screenProps} /> : null}
        </>
      )
    }
    if (activeTab === 'notes') {
      const screens = { N1Notes, N2Prayer, N3Dictee }
      const Screen = screens[nav.screen] || N1Notes
      return <Screen {...screenProps} params={nav.params} />
    }
  }

  return (
    <div className="ms-root">
      <Header kicker="MON SANCTUAIRE" title={headerTitle()}
        isSecondary={isSecondary} onBack={goBack} onHome={onBack} />
      <TabBar activeTab={activeTab} onChange={handleTabChange} />
      <main className="ms-main">
        <Suspense fallback={null}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  )
}
