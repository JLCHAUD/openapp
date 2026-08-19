export const apps = [
  {
    id: 'my-sanctuary',
    label: 'My Sanctuary',
    icon: '✦',
    color: '#e8c46a',
    component: () => import('./apps/MySanctuary/index.jsx'),
  },
  {
    id: 'ma-piscine',
    label: 'Ma Piscine',
    icon: '〜',
    color: '#4caf82',
    component: null,
    soon: true,
  },
  {
    id: 'ludo',
    label: 'Ludo',
    icon: '⚄',
    color: '#a89cf8',
    component: () => import('./apps/Ludo/index.jsx'),
  },
]
