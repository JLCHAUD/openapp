import { heatColor } from '../../tokens.js'

export function Bi2Map({ bible, navigate }) {
  const totalLus = bible.books.reduce((s, b) => s + b.chapitresLus.length, 0)

  const at = bible.books.filter(b => b.testament === 'AT')
  const nt = bible.books.filter(b => b.testament === 'NT')

  function bookPercent(book) {
    return Math.round((book.chapitresLus.length / book.totalChapitres) * 100)
  }

  function BookSquare({ book }) {
    const pct = bookPercent(book)
    const isCurrent = book.chapitresLus.length > 0 && book.chapitresLus.length < book.totalChapitres
    const textColor = pct >= 60 ? '#2a1800' : '#d8d4c8'
    return (
      <div
        className={`book-square${isCurrent ? ' current' : ''}`}
        style={{ background: heatColor(pct), display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title={`${book.nom} — ${pct}%`}
        onClick={() => navigate('Bi3Book', { bookId: book.id, bookName: book.nom })}
      >
        <span style={{ fontSize: 7, fontFamily: 'Inter, sans-serif', fontWeight: 600,
          lineHeight: 1, letterSpacing: 0, color: textColor,
          userSelect: 'none', pointerEvents: 'none' }}>
          {book.abr}
        </span>
      </div>
    )
  }

  function Section({ label, books }) {
    return (
      <div>
        <div className="kicker" style={{ marginBottom: 10 }}>{label}</div>
        <div className="book-grid">
          {books.map(b => <BookSquare key={b.id} book={b} />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 16, color: '#a0a0b8', marginBottom: 4 }}>
        {totalLus} <span style={{ color: '#6a6a82' }}>/ 1189 chapitres lus</span>
      </div>

      <div className="card">
        <Section label="ANCIEN TESTAMENT · 39 LIVRES" books={at} />
      </div>

      <div className="card">
        <Section label="NOUVEAU TESTAMENT · 27 LIVRES" books={nt} />
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        <span style={{ fontSize: 11, color: '#6a6a82' }}>0%</span>
        <div style={{ flex: 1, height: 6, borderRadius: 3,
          background: 'linear-gradient(to right, #1e1e2e, #4a3a1e, #8a6a2e, #c9a84c, #e8c46a)' }} />
        <span style={{ fontSize: 11, color: '#6a6a82' }}>100%</span>
      </div>

      <div style={{ fontSize: 12, color: '#6a6a82', textAlign: 'center' }}>
        Touche un livre pour voir ses chapitres
      </div>
    </>
  )
}
