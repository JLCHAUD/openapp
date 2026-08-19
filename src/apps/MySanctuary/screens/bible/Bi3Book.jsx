import { todayISO, calcStreak } from '../../tokens.js'
import { useTapHold } from '../../hooks/useTapHold.js'

export function Bi3Book({ bible, setBible, navigate, params }) {
  const book = bible.books.find(b => b.id === params.bookId)
  if (!book) return <div style={{ color: '#6a6a82', textAlign: 'center' }}>Livre introuvable</div>

  const chapitresLus = book.chapitresLus.length
  const total = book.totalChapitres
  const percent = Math.round((chapitresLus / total) * 100)
  const enCours = chapitresLus + 1

  const chapters = Array.from({ length: total }, (_, i) => i + 1)

  function getStatus(ch) {
    if (book.chapitresLus.includes(ch)) return 'read'
    if (ch === enCours && chapitresLus < total) return 'current'
    return 'unread'
  }

  // Bascule lu / non-lu : un appui court sur un chapitre déjà lu annule le marquage.
  function toggleLu(ch) {
    const today = todayISO()
    setBible(prev => {
      const target = prev.books.find(b => b.id === book.id)
      if (!target) return prev

      if (target.chapitresLus.includes(ch)) {
        // Annuler : repasse le chapitre en non-lu
        const updatedBooks = prev.books.map(b =>
          b.id === book.id ? { ...b, chapitresLus: b.chapitresLus.filter(c => c !== ch) } : b
        )
        const updatedPlans = prev.plans.map(p =>
          p.livreId === book.id && p.statut === 'termine' ? { ...p, statut: 'cours' } : p
        )
        return { ...prev, books: updatedBooks, plans: updatedPlans }
      }

      const newStreak = prev.lastReadDate === today
        ? prev.streak
        : calcStreak(prev.lastReadDate, prev.streak)
      const updatedBooks = prev.books.map(b =>
        b.id === book.id ? { ...b, chapitresLus: [...b.chapitresLus, ch] } : b
      )
      const estTermine = target.chapitresLus.length + 1 === target.totalChapitres
      const updatedPlans = estTermine
        ? prev.plans.map(p => p.livreId === book.id ? { ...p, statut: 'termine' } : p)
        : prev.plans
      return { ...prev, books: updatedBooks, plans: updatedPlans, streak: newStreak, lastReadDate: today }
    })
  }

  return (
    <>
      <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 16, color: '#a0a0b8' }}>
        {chapitresLus} chapitres lus sur {total}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="progress-bar-track" style={{ flex: 1 }}>
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <span style={{ fontFamily: 'Cormorant Garamond', fontSize: 18, color: '#e8c46a' }}>{percent}%</span>
      </div>

      <div className="card">
        <div className="chapter-grid">
          {chapters.map(ch => (
            <ChapterSquare key={ch} ch={ch} status={getStatus(ch)}
              bookId={book.id} bookName={book.nom}
              onShort={() => toggleLu(ch)}
              onLong={() => navigate('Bi4Verses', {
                bookId: book.id, bookName: book.nom,
                chapterNum: ch, totalVersets: 26
              })} />
          ))}
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[['read','Lu'],['current','En cours'],['unread','À lire']].map(([cls, label]) => (
          <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className={`chapter-square ${cls}`} style={{ width: 18, height: 18, fontSize: 10 }} />
            <span style={{ fontSize: 11, color: '#6a6a82' }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: '#6a6a82', textAlign: 'center' }}>
        Appui court → marquer lu / annuler · Appui long → ouvrir le chapitre
      </div>
    </>
  )
}

function ChapterSquare({ ch, status, onShort, onLong }) {
  const handlers = useTapHold(onShort, onLong)

  return (
    <div
      className={`chapter-square ${status}`}
      {...handlers}
    >
      {ch}
    </div>
  )
}
