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
  { id: 1,  nom: 'Genèse',                abr: 'Gn',  testament: 'AT', totalChapitres: 50  },
  { id: 2,  nom: 'Exode',                 abr: 'Ex',  testament: 'AT', totalChapitres: 40  },
  { id: 3,  nom: 'Lévitique',             abr: 'Lv',  testament: 'AT', totalChapitres: 27  },
  { id: 4,  nom: 'Nombres',               abr: 'Nb',  testament: 'AT', totalChapitres: 36  },
  { id: 5,  nom: 'Deutéronome',           abr: 'Dt',  testament: 'AT', totalChapitres: 34  },
  { id: 6,  nom: 'Josué',                 abr: 'Jos', testament: 'AT', totalChapitres: 24  },
  { id: 7,  nom: 'Juges',                 abr: 'Jg',  testament: 'AT', totalChapitres: 21  },
  { id: 8,  nom: 'Ruth',                  abr: 'Rt',  testament: 'AT', totalChapitres: 4   },
  { id: 9,  nom: '1 Samuel',              abr: '1S',  testament: 'AT', totalChapitres: 31  },
  { id: 10, nom: '2 Samuel',              abr: '2S',  testament: 'AT', totalChapitres: 24  },
  { id: 11, nom: '1 Rois',                abr: '1R',  testament: 'AT', totalChapitres: 22  },
  { id: 12, nom: '2 Rois',                abr: '2R',  testament: 'AT', totalChapitres: 25  },
  { id: 13, nom: '1 Chroniques',          abr: '1Ch', testament: 'AT', totalChapitres: 29  },
  { id: 14, nom: '2 Chroniques',          abr: '2Ch', testament: 'AT', totalChapitres: 36  },
  { id: 15, nom: 'Esdras',                abr: 'Esd', testament: 'AT', totalChapitres: 10  },
  { id: 16, nom: 'Néhémie',               abr: 'Né',  testament: 'AT', totalChapitres: 13  },
  { id: 17, nom: 'Esther',                abr: 'Est', testament: 'AT', totalChapitres: 10  },
  { id: 18, nom: 'Job',                   abr: 'Jb',  testament: 'AT', totalChapitres: 42  },
  { id: 19, nom: 'Psaumes',               abr: 'Ps',  testament: 'AT', totalChapitres: 150 },
  { id: 20, nom: 'Proverbes',             abr: 'Pr',  testament: 'AT', totalChapitres: 31  },
  { id: 21, nom: 'Ecclésiaste',           abr: 'Ec',  testament: 'AT', totalChapitres: 12  },
  { id: 22, nom: 'Cantique',              abr: 'Ct',  testament: 'AT', totalChapitres: 8   },
  { id: 23, nom: 'Ésaïe',                 abr: 'Es',  testament: 'AT', totalChapitres: 66  },
  { id: 24, nom: 'Jérémie',               abr: 'Jr',  testament: 'AT', totalChapitres: 52  },
  { id: 25, nom: 'Lamentations',          abr: 'Lm',  testament: 'AT', totalChapitres: 5   },
  { id: 26, nom: 'Ézéchiel',              abr: 'Ez',  testament: 'AT', totalChapitres: 48  },
  { id: 27, nom: 'Daniel',                abr: 'Dn',  testament: 'AT', totalChapitres: 12  },
  { id: 28, nom: 'Osée',                  abr: 'Os',  testament: 'AT', totalChapitres: 14  },
  { id: 29, nom: 'Joël',                  abr: 'Jl',  testament: 'AT', totalChapitres: 3   },
  { id: 30, nom: 'Amos',                  abr: 'Am',  testament: 'AT', totalChapitres: 9   },
  { id: 31, nom: 'Abdias',                abr: 'Ab',  testament: 'AT', totalChapitres: 1   },
  { id: 32, nom: 'Jonas',                 abr: 'Jon', testament: 'AT', totalChapitres: 4   },
  { id: 33, nom: 'Michée',                abr: 'Mi',  testament: 'AT', totalChapitres: 7   },
  { id: 34, nom: 'Nahum',                 abr: 'Na',  testament: 'AT', totalChapitres: 3   },
  { id: 35, nom: 'Habacuc',               abr: 'Ha',  testament: 'AT', totalChapitres: 3   },
  { id: 36, nom: 'Sophonie',              abr: 'So',  testament: 'AT', totalChapitres: 3   },
  { id: 37, nom: 'Aggée',                 abr: 'Ag',  testament: 'AT', totalChapitres: 2   },
  { id: 38, nom: 'Zacharie',              abr: 'Za',  testament: 'AT', totalChapitres: 14  },
  { id: 39, nom: 'Malachie',              abr: 'Ml',  testament: 'AT', totalChapitres: 4   },
  // Nouveau Testament (27)
  { id: 40, nom: 'Matthieu',              abr: 'Mt',  testament: 'NT', totalChapitres: 28  },
  { id: 41, nom: 'Marc',                  abr: 'Mc',  testament: 'NT', totalChapitres: 16  },
  { id: 42, nom: 'Luc',                   abr: 'Lc',  testament: 'NT', totalChapitres: 24  },
  { id: 43, nom: 'Jean',                  abr: 'Jn',  testament: 'NT', totalChapitres: 21  },
  { id: 44, nom: 'Actes',                 abr: 'Ac',  testament: 'NT', totalChapitres: 28  },
  { id: 45, nom: 'Romains',               abr: 'Rm',  testament: 'NT', totalChapitres: 16  },
  { id: 46, nom: '1 Corinthiens',         abr: '1Co', testament: 'NT', totalChapitres: 16  },
  { id: 47, nom: '2 Corinthiens',         abr: '2Co', testament: 'NT', totalChapitres: 13  },
  { id: 48, nom: 'Galates',               abr: 'Ga',  testament: 'NT', totalChapitres: 6   },
  { id: 49, nom: 'Éphésiens',             abr: 'Ep',  testament: 'NT', totalChapitres: 6   },
  { id: 50, nom: 'Philippiens',           abr: 'Ph',  testament: 'NT', totalChapitres: 4   },
  { id: 51, nom: 'Colossiens',            abr: 'Col', testament: 'NT', totalChapitres: 4   },
  { id: 52, nom: '1 Thessaloniciens',     abr: '1Th', testament: 'NT', totalChapitres: 5   },
  { id: 53, nom: '2 Thessaloniciens',     abr: '2Th', testament: 'NT', totalChapitres: 3   },
  { id: 54, nom: '1 Timothée',            abr: '1Tm', testament: 'NT', totalChapitres: 6   },
  { id: 55, nom: '2 Timothée',            abr: '2Tm', testament: 'NT', totalChapitres: 4   },
  { id: 56, nom: 'Tite',                  abr: 'Tt',  testament: 'NT', totalChapitres: 3   },
  { id: 57, nom: 'Philémon',              abr: 'Phm', testament: 'NT', totalChapitres: 1   },
  { id: 58, nom: 'Hébreux',               abr: 'Hé',  testament: 'NT', totalChapitres: 13  },
  { id: 59, nom: 'Jacques',               abr: 'Jc',  testament: 'NT', totalChapitres: 5   },
  { id: 60, nom: '1 Pierre',              abr: '1P',  testament: 'NT', totalChapitres: 5   },
  { id: 61, nom: '2 Pierre',              abr: '2P',  testament: 'NT', totalChapitres: 3   },
  { id: 62, nom: '1 Jean',                abr: '1Jn', testament: 'NT', totalChapitres: 5   },
  { id: 63, nom: '2 Jean',                abr: '2Jn', testament: 'NT', totalChapitres: 1   },
  { id: 64, nom: '3 Jean',                abr: '3Jn', testament: 'NT', totalChapitres: 1   },
  { id: 65, nom: 'Jude',                  abr: 'Jd',  testament: 'NT', totalChapitres: 1   },
  { id: 66, nom: 'Apocalypse',            abr: 'Ap',  testament: 'NT', totalChapitres: 22  },
]

export const NOTE_TYPES = [
  { id: 'réflexion',    label: 'Réflexion',    color: '#e8c46a' },
  { id: 'prière',       label: 'Prière',       color: '#a89cf8' },
  { id: 'gratitude',    label: 'Gratitude',    color: '#4caf82' },
  { id: 'prophétie',    label: 'Prophétie',    color: '#e8c46a' },
  { id: 'sermon',       label: 'Sermon',       color: '#a0a0b8' },
  { id: 'amélioration', label: 'Amélioration', color: '#60b8ff' },
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
