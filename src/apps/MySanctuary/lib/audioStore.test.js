import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import {
  saveRecording, getRecording, listRecordings, updateRecording, deleteRecording
} from './audioStore.js'

describe('audioStore', () => {
  it('sauve et relit un enregistrement (syncStatus par défaut pending)', async () => {
    const blob = new Blob(['x'], { type: 'audio/webm' })
    await saveRecording({ id: '1', blob, mime: 'audio/webm', durationSec: 3, createdAt: '2026-07-04T10:00:00Z' })
    const r = await getRecording('1')
    expect(r.mime).toBe('audio/webm')
    expect(r.syncStatus).toBe('pending')
    expect(r.source).toBe('mic')
  })

  it('met à jour le statut et le transcript', async () => {
    await updateRecording('1', { syncStatus: 'done', transcript: 'bonjour' })
    const r = await getRecording('1')
    expect(r.syncStatus).toBe('done')
    expect(r.transcript).toBe('bonjour')
  })

  it('liste triée par date décroissante', async () => {
    const blob = new Blob(['y'], { type: 'audio/webm' })
    await saveRecording({ id: '2', blob, mime: 'audio/webm', durationSec: 1, createdAt: '2026-07-04T12:00:00Z' })
    const all = await listRecordings()
    expect(all[0].id).toBe('2') // plus récent d'abord
  })

  it('supprime un enregistrement', async () => {
    await deleteRecording('1')
    expect(await getRecording('1')).toBeUndefined()
  })

  it('accepte un source personnalisé (import)', async () => {
    const blob = new Blob(['z'], { type: 'audio/mp4' })
    await saveRecording({ id: '3', blob, mime: 'audio/mp4', durationSec: 5, createdAt: '2026-07-08T09:00:00Z', source: 'import' })
    const r = await getRecording('3')
    expect(r.source).toBe('import')
  })
})
