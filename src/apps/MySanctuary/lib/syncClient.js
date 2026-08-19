import { getSupabase } from './supabaseClient.js'
import { updateRecording } from './audioStore.js'

const BUCKET = 'audio-notes'

function extFromMime(mime = '') {
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('wav')) return 'wav'
  return 'bin'
}

// Envoie un enregistrement : upload de l'audio + création du job de transcription.
// Met à jour le statut local au fil des étapes.
export async function pushRecording(rec) {
  const sb = getSupabase()
  if (!sb) return { error: 'Supabase non configuré' }

  const { data: userData } = await sb.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) return { error: 'Non connecté' }

  await updateRecording(rec.id, { syncStatus: 'uploading', error: null })

  const jobId = crypto.randomUUID()
  const path = `${uid}/${jobId}.${extFromMime(rec.mime)}`

  const up = await sb.storage.from(BUCKET).upload(path, rec.blob, {
    contentType: rec.mime, upsert: true,
  })
  if (up.error) {
    await updateRecording(rec.id, { syncStatus: 'error', error: up.error.message })
    return { error: up.error.message }
  }

  const ins = await sb.from('dictation_jobs').insert({
    id: jobId,
    status: 'pending',
    audio_path: path,
    audio_mime: rec.mime,
    duration_sec: rec.durationSec,
    title: rec.title,
    coords: rec.coords,
    language: rec.language || 'auto',
    device: 'iphone',
  })
  if (ins.error) {
    await updateRecording(rec.id, { syncStatus: 'error', error: ins.error.message })
    return { error: ins.error.message }
  }

  await updateRecording(rec.id, { syncStatus: 'transcribing', remoteId: jobId, audioPath: path })
  return { error: null }
}

// Récupère les transcriptions prêtes : pour chaque enregistrement local encore
// « transcribing », interroge son job distant et rapatrie le texte s'il est prêt.
export async function pullTranscripts(recordings) {
  const sb = getSupabase()
  if (!sb) return { updated: 0 }

  const waiting = recordings.filter(r => r.syncStatus === 'transcribing' && r.remoteId)
  if (waiting.length === 0) return { updated: 0 }

  const ids = waiting.map(r => r.remoteId)
  const { data, error } = await sb
    .from('dictation_jobs')
    .select('id,status,transcript,error,language')
    .in('id', ids)
  if (error || !data) return { updated: 0 }

  let updated = 0
  for (const rec of waiting) {
    const job = data.find(j => j.id === rec.remoteId)
    if (!job) continue
    if (job.status === 'done') {
      await updateRecording(rec.id, { syncStatus: 'done', transcript: job.transcript, language: job.language, error: null })
      updated++
    } else if (job.status === 'error') {
      await updateRecording(rec.id, { syncStatus: 'error', error: job.error })
      updated++
    }
  }
  return { updated }
}

// Supprime côté serveur : le fichier audio du bucket + la ligne du job.
export async function deleteRemote(rec) {
  const sb = getSupabase()
  if (!sb || !rec) return
  if (rec.audioPath) {
    try { await sb.storage.from(BUCKET).remove([rec.audioPath]) } catch { /* ignore */ }
  }
  if (rec.remoteId) {
    try { await sb.from('dictation_jobs').delete().eq('id', rec.remoteId) } catch { /* ignore */ }
  }
}

// Pousse tous les enregistrements en attente ou en erreur.
export async function pushAllPending(recordings) {
  const results = []
  for (const rec of recordings) {
    if (rec.syncStatus === 'pending' || rec.syncStatus === 'error') {
      results.push(await pushRecording(rec))
    }
  }
  return results
}
