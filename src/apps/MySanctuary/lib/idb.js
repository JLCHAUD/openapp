// Micro-wrapper IndexedDB générique (keyPath 'id'), sans dépendance externe.
const dbCache = {}

export function openDB(name, store) {
  const cacheKey = `${name}::${store}`
  if (dbCache[cacheKey]) return dbCache[cacheKey]
  dbCache[cacheKey] = new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(store)) {
        db.createObjectStore(store, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbCache[cacheKey]
}

async function objectStore(name, store, mode) {
  const db = await openDB(name, store)
  return db.transaction(store, mode).objectStore(store)
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function idbPut(name, store, obj) {
  return wrap((await objectStore(name, store, 'readwrite')).put(obj))
}

export async function idbGet(name, store, id) {
  return wrap((await objectStore(name, store, 'readonly')).get(id))
}

export async function idbGetAll(name, store) {
  return wrap((await objectStore(name, store, 'readonly')).getAll())
}

export async function idbDelete(name, store, id) {
  return wrap((await objectStore(name, store, 'readwrite')).delete(id))
}
