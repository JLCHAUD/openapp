import { useState, useEffect, lazy, Suspense } from 'react'
import { useCloudState } from './hooks/useCloudState.js'
import { useAuth } from './hooks/useAuth.js'
import { useAudioRecorder } from './hooks/useAudioRecorder.js'
import { initBibleState, initTasksState, initNotesState } from './tokens.js'
import { Header } from './components/Header.jsx'
import { TabBar } from './components/TabBar.jsx'
import { listRecordings } from './lib/audioStore.js'
import { pullTranscripts } from './lib/syncClient.js'
import { createNotesForDone } from './lib/dictationSync.js'
import './MySanctuary.css'

const Bi1Home    = lazy(() => import('./screens/bible/Bi1Home.jsx').then(m => ({ default: m.Bi1Home })))
const Bi3Book    = lazy(() => import('./screens/bible/Bi3Book.jsx').then(m => ({ default: m.Bi3Book })))
const Bi4Verses  = lazy(() => import('./screens/bible/Bi4Verses.jsx').then(m => ({ default: m.Bi4Verses })))
const T1Focus    = lazy(() => import('./screens/tasks/T1Focus.jsx').then(m => ({ default: m.T1Focus })))
const T2Habits   = lazy(() => import('./screens/tasks/T2Habits.jsx').then(m => ({ default: m.T2Habits })))
const T3Deadlines= lazy(() => import('./screens/tasks/T3Deadlines.jsx').then(m => ({ default: m.T3Deadlines })))
const T4Boards   = lazy(() => import('./screens/tasks/T4Boards.jsx').then(m => ({ default: m.T4Boards })))
const N1Notes    = lazy(() => import('./screens/notes/N1Notes.jsx').then(m => ({ default: m.N1Notes })))
const N2Prayer   = lazy(() => import('./screens/notes/N2Prayer.jsx').then(m => ({ default: m.N2Prayer })))
const N3Dictee   = lazy(() => import('./screens/notes/N3Dictee.jsx').then(m => ({ default: m.N3Dictee })))

const BACK_MAP = {
  Bi3Book:   { screen: 'Bi1Home', params: {} },
  Bi4Verses: (params) => ({ screen: 'Bi3Book', params: { bookId: params.bookId, bookName: params.bookName } }),
  N2Prayer:  { screen: 'N1Notes', params: {} },
}

const SCREEN_TITLES = {
  Bi1Home: 'Bible',
  N2Prayer: 'Carnet de prière',
  N3Dictee: 'Dictée vocale',
  N1Notes: 'Notes',
}

export default function MySanctuary({ onBack }) {
  const [activeTab, setActiveTab] = useState('bible')
  const [nav, setNav] = useState({ screen: 'Bi1Home', params: {} })
  const [activeTaskView, setActiveTaskView] = useState('T1Focus')

  const [bible, setBible] = useCloudState('ms_bible', initBibleState())
  const [tasks, setTasks] = useCloudState('ms_tasks', initTasksState())
  const [notes, setNotes] = useCloudState('ms_notes', initNotesState())

  // L'enregistreur vit ici (racine de l'app), pas dans l'écran Dictée : ainsi
  // l'enregistrement continue en arrière-plan si on change d'onglet en cours de dictée.
  const recorder = useAudioRecorder()

  // Récupère les transcriptions terminées et les convertit en notes, quel que
  // soit l'onglet actif — pour ne pas dépendre du fait de revenir sur "Enr".
  const { session } = useAuth()
  useEffect(() => {
    if (!session) return
    let cancelled = false
    let running = false // évite deux tick() qui se chevauchent (ex. requête réseau lente)
    async function tick() {
      if (running) return
      running = true
      try {
        await pullTranscripts(await listRecordings())
        if (!cancelled) await createNotesForDone(setNotes)
      } finally {
        running = false
      }
    }
    tick()
    const iv = setInterval(tick, 10000)
    return () => { cancelled = true; clearInterval(iv) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  function navigate(screen, params = {}) { setNav({ screen, params }) }

  function goBack() {
    const entry = BACK_MAP[nav.screen]
    if (!entry) return
    setNav(typeof entry === 'function' ? entry(nav.params) : entry)
  }

  const isSecondary = activeTab !== 'tasks' && !['Bi1Home', 'N1Notes', 'N2Prayer', 'N3Dictee'].includes(nav.screen)
  const isBiHome = activeTab === 'bible' && nav.screen === 'Bi1Home'

  function headerTitle() {
    if (activeTab === 'tasks') return 'Tâches'
    if (activeTab === 'enr') return 'Dictée vocale'
    if (nav.screen === 'Bi3Book') return nav.params.bookName || 'Livre'
    if (nav.screen === 'Bi4Verses') return `${nav.params.bookName || ''} ${nav.params.chapterNum || ''}`.trim()
    return SCREEN_TITLES[nav.screen] || 'Bible'
  }

  const screenProps = { bible, setBible, tasks, setTasks, notes, setNotes, navigate }

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'bible') setNav({ screen: 'Bi1Home', params: {} })
    if (tab === 'notes') setNav({ screen: 'N1Notes', params: {} })
    if (tab === 'enr') setNav({ screen: 'N3Dictee', params: {} })
  }

  function renderContent() {
    if (activeTab === 'bible') {
      const screens = { Bi1Home, Bi3Book, Bi4Verses }
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
      const screens = { N1Notes, N2Prayer }
      const current = screens[nav.screen] ? nav.screen : 'N1Notes'
      const Screen = screens[current]
      return (
        <>
          <div className="task-subnav" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {[['N1Notes','Notes'],['N2Prayer','Prière']].map(([id, label]) => (
              <button key={id}
                className={`task-subnav-btn${current === id ? ' active' : ''}`}
                onClick={() => navigate(id, {})}>{label}</button>
            ))}
          </div>
          <Screen {...screenProps} params={nav.params} />
        </>
      )
    }
    if (activeTab === 'enr') {
      return <N3Dictee {...screenProps} recorder={recorder} params={nav.params} />
    }
  }

  return (
    <div className="ms-root">
      <Header kicker="My Sanctuary" title={headerTitle()}
        isSecondary={isSecondary} onBack={goBack} onHome={onBack} />
      <TabBar activeTab={activeTab} onChange={handleTabChange} isRecording={recorder.isRecording} />
      <main className={`ms-main${isBiHome ? ' ms-main--fill' : ''}`}>
        <Suspense fallback={null}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  )
}
