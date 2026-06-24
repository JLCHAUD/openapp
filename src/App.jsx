import { useState, Suspense, lazy } from 'react'
import { apps } from './apps.js'
import './App.css'

const lazyApps = Object.fromEntries(
  apps.filter(a => a.component).map(a => [a.id, lazy(a.component)])
)

export default function App() {
  const [activeApp, setActiveApp] = useState(null)
  const ActiveComponent = activeApp ? lazyApps[activeApp] : null

  if (ActiveComponent) {
    return (
      <Suspense fallback={<div className="loading">CHARGEMENT</div>}>
        <ActiveComponent onBack={() => setActiveApp(null)} />
      </Suspense>
    )
  }

  return (
    <div className="home">
      <div className="home-header">
        <span className="home-kicker">Mon espace</span>
        <h1 className="home-title">OpenApp</h1>
      </div>
      <div className="home-grid">
        {apps.map(app => (
          <button
            key={app.id}
            className={`app-tile${app.soon ? ' app-tile--soon' : ''}`}
            style={{ '--tile-color': app.color }}
            onClick={() => !app.soon && setActiveApp(app.id)}
          >
            <span className="app-tile-icon">{app.icon}</span>
            <span className="app-tile-label">{app.label}</span>
            {app.soon && <span className="app-tile-soon">BIENTÔT</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
