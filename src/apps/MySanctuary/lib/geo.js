// Récupère la position GPS courante. Résout null si indisponible/refusé
// (jamais de rejet — la géoloc est optionnelle pour une dictée).
export function getPosition(options = {}) {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000, ...options }
    )
  })
}
