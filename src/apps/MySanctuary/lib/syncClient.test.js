import { describe, it, expect, vi, beforeEach } from 'vitest'

const uploadMock = vi.fn(async () => ({ error: null }))
const insertMock = vi.fn(async () => ({ error: null }))
const inMock = vi.fn(async () => ({ data: [], error: null }))
const selectMock = vi.fn(() => ({ in: inMock }))
const removeMock = vi.fn(async () => ({ error: null }))
const deleteEqMock = vi.fn(async () => ({ error: null }))
const deleteMock = vi.fn(() => ({ eq: deleteEqMock }))
const updates = []

vi.mock('./supabaseClient.js', () => ({
  getSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'uid-1' } } }) },
    storage: { from: () => ({ upload: uploadMock, remove: removeMock }) },
    from: () => ({ insert: insertMock, select: selectMock, delete: deleteMock }),
  }),
}))
vi.mock('./audioStore.js', () => ({
  updateRecording: vi.fn(async (id, patch) => { updates.push({ id, ...patch }) }),
}))

beforeEach(() => {
  uploadMock.mockClear(); insertMock.mockClear(); inMock.mockClear(); selectMock.mockClear()
  removeMock.mockClear(); deleteEqMock.mockClear(); deleteMock.mockClear()
  updates.length = 0
  vi.stubGlobal('crypto', { randomUUID: () => 'job-uuid' })
})

describe('pushRecording', () => {
  it('upload + insert puis passe le statut local en transcribing', async () => {
    const { pushRecording } = await import('./syncClient.js')
    const rec = { id: 'r1', blob: new Blob(['x']), mime: 'audio/mp4', durationSec: 3, title: 'T', coords: null }
    const res = await pushRecording(rec)
    expect(res.error).toBeNull()
    expect(uploadMock).toHaveBeenCalledOnce()
    expect(insertMock).toHaveBeenCalledOnce()
    expect(updates.some(u => u.syncStatus === 'transcribing' && u.remoteId === 'job-uuid')).toBe(true)
  })

  it('passe en erreur si l\'upload échoue', async () => {
    uploadMock.mockResolvedValueOnce({ error: { message: 'boom' } })
    const { pushRecording } = await import('./syncClient.js')
    const rec = { id: 'r2', blob: new Blob(['x']), mime: 'audio/webm', durationSec: 2, title: 'T', coords: null }
    const res = await pushRecording(rec)
    expect(res.error).toBe('boom')
    expect(insertMock).not.toHaveBeenCalled()
    expect(updates.some(u => u.syncStatus === 'error')).toBe(true)
  })
})

describe('pullTranscripts', () => {
  it('rapatrie le texte des jobs terminés', async () => {
    inMock.mockResolvedValueOnce({
      data: [{ id: 'job-1', status: 'done', transcript: 'bonjour le monde', error: null }],
      error: null,
    })
    const { pullTranscripts } = await import('./syncClient.js')
    const recs = [{ id: 'r1', syncStatus: 'transcribing', remoteId: 'job-1' }]
    const res = await pullTranscripts(recs)
    expect(res.updated).toBe(1)
    expect(updates.some(u => u.id === 'r1' && u.syncStatus === 'done' && u.transcript === 'bonjour le monde')).toBe(true)
  })

  it('ne fait aucun appel réseau s\'il n\'y a rien en attente', async () => {
    const { pullTranscripts } = await import('./syncClient.js')
    const res = await pullTranscripts([{ id: 'r1', syncStatus: 'done', remoteId: 'job-1' }])
    expect(res.updated).toBe(0)
    expect(selectMock).not.toHaveBeenCalled()
  })
})

describe('deleteRemote', () => {
  it('supprime le fichier du bucket et la ligne du job', async () => {
    const { deleteRemote } = await import('./syncClient.js')
    await deleteRemote({ audioPath: 'uid-1/job-1.m4a', remoteId: 'job-1' })
    expect(removeMock).toHaveBeenCalledWith(['uid-1/job-1.m4a'])
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'job-1')
  })

  it('ne fait rien si l\'enregistrement n\'a jamais été synchronisé', async () => {
    const { deleteRemote } = await import('./syncClient.js')
    await deleteRemote({ audioPath: null, remoteId: null })
    expect(removeMock).not.toHaveBeenCalled()
    expect(deleteMock).not.toHaveBeenCalled()
  })
})
