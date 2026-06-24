import { ProgressRing } from '../../components/ProgressRing.jsx'
import { calcStreak, todayISO } from '../../tokens.js'

export function Bi1Home({ bible, setBible, navigate }) {
  const totalChapitres = 1189
  const chapitresLus = bible.books.reduce((s, b) => s + b.chapitresLus.length, 0)
  const percent = Math.round((chapitresLus / totalChapitres) * 100)
  const streak = calcStreak(bible.lastReadDate, bible.streak)

  const planEnCours = bible.plans[0] ?? null
  const planParallele = bible.plans[1] ?? null

  function marquerLu() {
    if (!planEnCours) return
    const today = todayISO()
    const newStreak = bible.lastReadDate === today
      ? bible.streak
      : calcStreak(bible.lastReadDate, bible.streak)

    setBible(prev => {
      const plan = prev.plans[0]
      if (!plan) return prev
      const book = prev.books.find(b => b.id === plan.livreId)
      if (!book) return prev
      const nextChapitre = plan.jourActuel
      const updatedBooks = prev.books.map(b =>
        b.id === plan.livreId && !b.chapitresLus.includes(nextChapitre)
          ? { ...b, chapitresLus: [...b.chapitresLus, nextChapitre] }
          : b
      )
      const updatedPlans = prev.plans.map((p, i) =>
        i === 0 ? { ...p, jourActuel: p.jourActuel + 1 } : p
      )
      return { ...prev, books: updatedBooks, plans: updatedPlans, streak: newStreak, lastReadDate: today }
    })
  }

  const planBook = planEnCours ? bible.books.find(b => b.id === planEnCours.livreId) : null
  const planPercent = planEnCours ? Math.round((planEnCours.jourActuel / planEnCours.total) * 100) : 0

  return (
    <>
      {/* Stats globales */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <ProgressRing percent={percent} size={64} stroke={5} />
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 22, fontWeight: 300, color: '#f0ece0' }}>
            {chapitresLus} <span style={{ color: '#6a6a82', fontSize: 14 }}>/ {totalChapitres}</span>
          </div>
          <div style={{ fontSize: 12, color: '#a0a0b8', marginBottom: 4 }}>chapitres lus</div>
          <div style={{ fontSize: 13, color: '#e8c46a' }}>✦ {streak} jours d'affilée</div>
        </div>
      </div>

      {/* Lecture du jour */}
      {planEnCours && planBook ? (
        <div className="card card--gold">
          <div className="kicker" style={{ marginBottom: 12 }}>LECTURE DU JOUR</div>
          <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 20, color: '#f0ece0', marginBottom: 4 }}>
            {planBook.nom} {planEnCours.jourActuel}
          </div>
          <div style={{ fontSize: 12, color: '#a0a0b8', marginBottom: 10 }}>
            Jour {planEnCours.jourActuel} sur {planEnCours.total}
          </div>
          <div className="progress-bar-track" style={{ marginBottom: 16 }}>
            <div className="progress-bar-fill" style={{ width: `${planPercent}%` }} />
          </div>
          <button className="btn-gold" onClick={marquerLu}>✓ MARQUER COMME LU</button>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ color: '#6a6a82', fontSize: 13, marginBottom: 12 }}>Aucun plan en cours</div>
          <button className="btn-outline-dashed" onClick={() => navigate('Bi5Plans')}>
            + CHOISIR UN PLAN
          </button>
        </div>
      )}

      {/* En parallèle */}
      {planParallele && (() => {
        const book2 = bible.books.find(b => b.id === planParallele.livreId)
        return book2 ? (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8c46a', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="kicker" style={{ marginBottom: 4 }}>EN PARALLÈLE</div>
              <div style={{ color: '#f0ece0', fontSize: 15 }}>{book2.nom}</div>
            </div>
          </div>
        ) : null
      })()}

      {/* Liens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        <button style={{ textAlign: 'left', color: '#e8c46a', fontSize: 14,
          fontFamily: 'Cormorant Garamond', fontStyle: 'italic' }}
          onClick={() => navigate('Bi2Map')}>
          Ma carte de lecture →
        </button>
        <button style={{ textAlign: 'left', color: '#e8c46a', fontSize: 14,
          fontFamily: 'Cormorant Garamond', fontStyle: 'italic' }}
          onClick={() => navigate('Bi5Plans')}>
          Mes plans de lecture →
        </button>
      </div>
    </>
  )
}
