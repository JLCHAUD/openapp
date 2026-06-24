export const COLORS = {
  bgApp: '#0a0a0f',
  bgCard: '#151520',
  bgPanel: '#1e1e2e',
  border: '#3a3a55',
  progressTrack: '#282840',
  gold: '#e8c46a',
  goldDark: '#a07a3a',
  textPrimary: '#f0ece0',
  textSecondary: '#a0a0b8',
  textMuted: '#6a6a82',
  red: '#e05555',
  green: '#4caf82',
  purple: '#a89cf8',
}

export const BIBLE_BOOKS = [
  // Ancien Testament (39)
  { id: 1,  nom: 'Genèse',                testament: 'AT', totalChapitres: 50 },
  { id: 2,  nom: 'Exode',                 testament: 'AT', totalChapitres: 40 },
  { id: 3,  nom: 'Lévitique',             testament: 'AT', totalChapitres: 27 },
  { id: 4,  nom: 'Nombres',               testament: 'AT', totalChapitres: 36 },
  { id: 5,  nom: 'Deutéronome',           testament: 'AT', totalChapitres: 34 },
  { id: 6,  nom: 'Josué',                 testament: 'AT', totalChapitres: 24 },
  { id: 7,  nom: 'Juges',                 testament: 'AT', totalChapitres: 21 },
  { id: 8,  nom: 'Ruth',                  testament: 'AT', totalChapitres: 4  },
  { id: 9,  nom: '1 Samuel',              testament: 'AT', totalChapitres: 31 },
  { id: 10, nom: '2 Samuel',              testament: 'AT', totalChapitres: 24 },
  { id: 11, nom: '1 Rois',               testament: 'AT', totalChapitres: 22 },
  { id: 12, nom: '2 Rois',               testament: 'AT', totalChapitres: 25 },
  { id: 13, nom: '1 Chroniques',         testament: 'AT', totalChapitres: 29 },
  { id: 14, nom: '2 Chroniques',         testament: 'AT', totalChapitres: 36 },
  { id: 15, nom: 'Esdras',               testament: 'AT', totalChapitres: 10 },
  { id: 16, nom: 'Néhémie',              testament: 'AT', totalChapitres: 13 },
  { id: 17, nom: 'Esther',               testament: 'AT', totalChapitres: 10 },
  { id: 18, nom: 'Job',                  testament: 'AT', totalChapitres: 42 },
  { id: 19, nom: 'Psaumes',              testament: 'AT', totalChapitres: 150},
  { id: 20, nom: 'Proverbes',            testament: 'AT', totalChapitres: 31 },
  { id: 21, nom: 'Ecclésiaste',          testament: 'AT', totalChapitres: 12 },
  { id: 22, nom: 'Cantique',             testament: 'AT', totalChapitres: 8  },
  { id: 23, nom: 'Ésaïe',               testament: 'AT', totalChapitres: 66 },
  { id: 24, nom: 'Jérémie',             testament: 'AT', totalChapitres: 52 },
  { id: 25, nom: 'Lamentations',        testament: 'AT', totalChapitres: 5  },
  { id: 26, nom: 'Ézéchiel',            testament: 'AT', totalChapitres: 48 },
  { id: 27, nom: 'Daniel',              testament: 'AT', totalChapitres: 12 },
  { id: 28, nom: 'Osée',                testament: 'AT', totalChapitres: 14 },
  { id: 29, nom: 'Joël',                testament: 'AT', totalChapitres: 3  },
  { id: 30, nom: 'Amos',                testament: 'AT', totalChapitres: 9  },
  { id: 31, nom: 'Abdias',              testament: 'AT', totalChapitres: 1  },
  { id: 32, nom: 'Jonas',               testament: 'AT', totalChapitres: 4  },
  { id: 33, nom: 'Michée',              testament: 'AT', totalChapitres: 7  },
  { id: 34, nom: 'Nahum',               testament: 'AT', totalChapitres: 3  },
  { id: 35, nom: 'Habacuc',             testament: 'AT', totalChapitres: 3  },
  { id: 36, nom: 'Sophonie',            testament: 'AT', totalChapitres: 3  },
  { id: 37, nom: 'Aggée',               testament: 'AT', totalChapitres: 2  },
  { id: 38, nom: 'Zacharie',            testament: 'AT', totalChapitres: 14 },
  { id: 39, nom: 'Malachie',            testament: 'AT', totalChapitres: 4  },
  // Nouveau Testament (27)
  { id: 40, nom: 'Matthieu',            testament: 'NT', totalChapitres: 28 },
  { id: 41, nom: 'Marc',                testament: 'NT', totalChapitres: 16 },
  { id: 42, nom: 'Luc',                 testament: 'NT', totalChapitres: 24 },
  { id: 43, nom: 'Jean',                testament: 'NT', totalChapitres: 21 },
  { id: 44, nom: 'Actes',               testament: 'NT', totalChapitres: 28 },
  { id: 45, nom: 'Romains',             testament: 'NT', totalChapitres: 16 },
  { id: 46, nom: '1 Corinthiens',       testament: 'NT', totalChapitres: 16 },
  { id: 47, nom: '2 Corinthiens',       testament: 'NT', totalChapitres: 13 },
  { id: 48, nom: 'Galates',             testament: 'NT', totalChapitres: 6  },
  { id: 49, nom: 'Éphésiens',           testament: 'NT', totalChapitres: 6  },
  { id: 50, nom: 'Philippiens',         testament: 'NT', totalChapitres: 4  },
  { id: 51, nom: 'Colossiens',          testament: 'NT', totalChapitres: 4  },
  { id: 52, nom: '1 Thessaloniciens',   testament: 'NT', totalChapitres: 5  },
  { id: 53, nom: '2 Thessaloniciens',   testament: 'NT', totalChapitres: 3  },
  { id: 54, nom: '1 Timothée',          testament: 'NT', totalChapitres: 6  },
  { id: 55, nom: '2 Timothée',          testament: 'NT', totalChapitres: 4  },
  { id: 56, nom: 'Tite',                testament: 'NT', totalChapitres: 3  },
  { id: 57, nom: 'Philémon',            testament: 'NT', totalChapitres: 1  },
  { id: 58, nom: 'Hébreux',             testament: 'NT', totalChapitres: 13 },
  { id: 59, nom: 'Jacques',             testament: 'NT', totalChapitres: 5  },
  { id: 60, nom: '1 Pierre',            testament: 'NT', totalChapitres: 5  },
  { id: 61, nom: '2 Pierre',            testament: 'NT', totalChapitres: 3  },
  { id: 62, nom: '1 Jean',              testament: 'NT', totalChapitres: 5  },
  { id: 63, nom: '2 Jean',              testament: 'NT', totalChapitres: 1  },
  { id: 64, nom: '3 Jean',              testament: 'NT', totalChapitres: 1  },
  { id: 65, nom: 'Jude',                testament: 'NT', totalChapitres: 1  },
  { id: 66, nom: 'Apocalypse',          testament: 'NT', totalChapitres: 22 },
]

export function heatColor(percent) {
  if (percent === 0)   return '#1e1e2e'
  if (percent < 25)   return '#4a3a1e'
  if (percent < 50)   return '#8a6a2e'
  if (percent < 100)  return '#c9a84c'
  return '#e8c46a'
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function calcStreak(lastReadDate, currentStreak) {
  if (!lastReadDate) return 0
  const today = todayISO()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (lastReadDate === today) return currentStreak
  if (lastReadDate === yesterday) return currentStreak + 1
  return 0
}

export function initBibleState() {
  return {
    books: BIBLE_BOOKS.map(b => ({ ...b, chapitresLus: [] })),
    plans: [],
    streak: 0,
    lastReadDate: null,
  }
}

export function initTasksState() {
  return {
    tasks: [],
    habits: [],
    categories: ['PERSONNEL', 'MAISON', 'SANTÉ'],
  }
}

export function initNotesState() {
  return { notes: [], prayers: [] }
}
