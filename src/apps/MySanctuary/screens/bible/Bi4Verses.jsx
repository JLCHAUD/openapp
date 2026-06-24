import { useState } from 'react'
import { todayISO, calcStreak } from '../../tokens.js'

export function Bi4Verses({ bible, setBible, navigate, params }) {
  const { bookId, chapterNum, totalVersets = 26 } = params
  const book = bible.books.find(b => b.id === bookId)
  const isRead = book?.chapitresLus.includes(chapterNum)

  const [versetsLus, setVersetsLus] = useState(isRead ? totalVersets : 0)

  const pct = totalVersets > 1 ? (versetsLus / totalVersets) * 100 : 0
  const trackBg = `linear-gradient(to right, #e8c46a ${pct}%, #282840 ${pct}%)`

  function marquerTermine() {
    setBible(prev => {
      const updatedBooks = prev.books.map(b =>
        b.id === bookId && !b.chapitresLus.includes(chapterNum)
          ? { ...b, chapitresLus: [...b.chapitresLus, chapterNum] }
          : b
      )
      const today = todayISO()
      const newStreak = calcStreak(prev.lastReadDate, prev.streak)
      return { ...prev, books: updatedBooks, streak: newStreak, lastReadDate: today }
    })
    navigate('Bi3Book', { bookId, bookName: params.bookName })
  }

  return (
    <>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div className="big-number">{versetsLus}</div>
        <div style={{ fontSize: 13, color: '#6a6a82' }}>/ {totalVersets} versets lus</div>
      </div>

      <div className="card card--gold">
        <div className="kicker" style={{ marginBottom: 16 }}>JUSQU'OÙ AS-TU LU ?</div>
        <input
          type="range" min={0} max={totalVersets}
          value={versetsLus}
          onChange={e => setVersetsLus(Number(e.target.value))}
          style={{ background: trackBg }}
          className="verse-slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: '#6a6a82', marginTop: 8, marginBottom: 20 }}>
          <span>v.1</span>
          <span>v.{versetsLus}</span>
          <span>v.{totalVersets}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button className="btn-sm" style={{ flex: 1 }}
            onClick={() => setVersetsLus(v => Math.max(0, v - 1))}>− 1 verset</button>
          <button className="btn-sm" style={{ flex: 1 }}
            onClick={() => setVersetsLus(v => Math.min(totalVersets, v + 1))}>+ 1 verset</button>
        </div>
        <button className="btn-gold" onClick={marquerTermine}>
          ✓ CHAPITRE TERMINÉ
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#6a6a82', textAlign: 'center' }}>
        Glisse le curseur ou utilise ± verset
      </div>
    </>
  )
}
