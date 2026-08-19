import { describe, it, expect, vi, beforeEach } from 'vitest'

const maybeSingleMock = vi.fn()
const upsertMock = vi.fn(async () => ({ error: null }))
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
const selectMock = vi.fn(() => ({ eq: eqMock }))

vi.mock('./supabaseClient.js', () => ({
  getSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'uid-1' } } }) },
    from: () => ({ select: selectMock, upsert: upsertMock }),
  }),
}))

beforeEach(() => {
  maybeSingleMock.mockReset(); upsertMock.mockClear(); eqMock.mockClear(); selectMock.mockClear()
})

describe('cloudSync', () => {
  it('pullState renvoie data + updatedAt en ms', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { data: { a: 1 }, updated_at: '2026-07-05T10:00:00.000Z' }, error: null,
    })
    const { pullState } = await import('./cloudSync.js')
    const res = await pullState('ms_bible')
    expect(res.data).toEqual({ a: 1 })
    expect(res.updatedAt).toBe(Date.parse('2026-07-05T10:00:00.000Z'))
  })

  it('pullState renvoie null si pas de ligne', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    const { pullState } = await import('./cloudSync.js')
    expect(await pullState('ms_bible')).toBeNull()
  })

  it('pushState upsert avec owner, key, data et updated_at', async () => {
    const { pushState } = await import('./cloudSync.js')
    const ts = Date.parse('2026-07-05T12:00:00.000Z')
    const res = await pushState('ms_tasks', { t: 2 }, ts)
    expect(res.error).toBeNull()
    const [row, opts] = upsertMock.mock.calls[0]
    expect(row).toMatchObject({ owner: 'uid-1', key: 'ms_tasks', data: { t: 2 } })
    expect(Date.parse(row.updated_at)).toBe(ts)
    expect(opts).toEqual({ onConflict: 'owner,key' })
  })
})
