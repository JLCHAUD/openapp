export function Bi3Book({ bible, navigate, params }) {
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
          {chapters.map(ch => {
            const status = getStatus(ch)
            return (
              <div key={ch} className={`chapter-square ${status}`}
                onClick={() => navigate('Bi4Verses', {
                  bookId: book.id, bookName: book.nom,
                  chapterNum: ch, totalVersets: estimateVerses(book.id, ch)
                })}>
                {ch}
              </div>
            )
          })}
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
        Touche un chapitre pour suivre tes versets
      </div>
    </>
  )
}

// Estimation simple : moyenne de 26 versets par chapitre
function estimateVerses(bookId, chapterNum) {
  return 26
}
