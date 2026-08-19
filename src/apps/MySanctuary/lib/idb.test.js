import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { openDB, idbPut, idbGet, idbGetAll, idbDelete } from './idb.js'

describe('idb', () => {
  it('put puis get renvoie l\'objet', async () => {
    await openDB('test-db', 'items')
    await idbPut('test-db', 'items', { id: 'a', v: 1 })
    expect(await idbGet('test-db', 'items', 'a')).toEqual({ id: 'a', v: 1 })
  })

  it('getAll renvoie tous les objets', async () => {
    await idbPut('test-db', 'items', { id: 'b', v: 2 })
    const all = await idbGetAll('test-db', 'items')
    expect(all.length).toBeGreaterThanOrEqual(2)
  })

  it('delete retire l\'objet', async () => {
    await idbDelete('test-db', 'items', 'a')
    expect(await idbGet('test-db', 'items', 'a')).toBeUndefined()
  })
})
