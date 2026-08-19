import { listRecordings, updateRecording } from './audioStore.js'

// Transforme chaque dictée transcrite (sans note encore) en note de sa catégorie.
// Appelé depuis la racine de l'app (pas depuis l'écran Dictée) pour que la
// conversion se fasse même si l'utilisateur ne revient jamais sur l'onglet Enr.
export async function createNotesForDone(setNotes) {
  const list = await listRecordings()
  let created = 0
  for (const rec of list) {
    if (rec.syncStatus !== 'done' || !rec.transcript || rec.noteId) continue
    const noteId = (crypto?.randomUUID?.() ?? Date.now().toString())
    setNotes(prev => ({
      ...prev,
      notes: [{
        id: noteId,
        titre: rec.title || 'Dictée',
        contenu: rec.transcript,
        type: rec.category || 'réflexion',
        date: (rec.createdAt || new Date().toISOString()).slice(0, 10),
        audioId: rec.id,
        source: 'dictee',
      }, ...prev.notes],
    }))
    await updateRecording(rec.id, { noteId })
    created++
  }
  return created
}
