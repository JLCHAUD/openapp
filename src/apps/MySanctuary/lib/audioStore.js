// Store des enregistrements audio (blobs + métadonnées) dans IndexedDB.
// Les blobs ne passent JAMAIS par localStorage (limite ~5 Mo).
import { idbPut, idbGet, idbGetAll, idbDelete } from './idb.js'

const DB = 'ms_sanctuary'
const STORE = 'ms_audio'

// rec = { id, blob, mime, durationSec, createdAt, title?, coords?, syncStatus?, transcript?, noteId?, audioPath?, error? }
export async function saveRecording(rec) {
  const toStore = { syncStatus: 'pending', transcript: null, noteId: null, title: '', coords: null, language: 'auto', category: 'réflexion', source: 'mic', ...rec }
  await idbPut(DB, STORE, toStore)
  return toStore
}

export async function getRecording(id) {
  return idbGet(DB, STORE, id)
}

export async function listRecordings() {
  const all = await idbGetAll(DB, STORE)
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function updateRecording(id, patch) {
  const current = await idbGet(DB, STORE, id)
  if (!current) return undefined
  const next = { ...current, ...patch }
  await idbPut(DB, STORE, next)
  return next
}

export async function deleteRecording(id) {
  await idbDelete(DB, STORE, id)
}
