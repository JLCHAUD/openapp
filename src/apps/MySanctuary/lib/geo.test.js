import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPosition } from './geo.js'

afterEach(() => { vi.unstubAllGlobals() })

describe('getPosition', () => {
  it('renvoie lat/lon/accuracy en cas de succès', async () => {
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: ok => ok({ coords: { latitude: 48.8566, longitude: 2.3522, accuracy: 12 } }) }
    })
    expect(await getPosition()).toEqual({ lat: 48.8566, lon: 2.3522, accuracy: 12 })
  })

  it('renvoie null si la géoloc échoue (refus)', async () => {
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: (_ok, err) => err(new Error('denied')) }
    })
    expect(await getPosition()).toBeNull()
  })

  it('renvoie null si la géoloc n\'est pas supportée', async () => {
    vi.stubGlobal('navigator', {})
    expect(await getPosition()).toBeNull()
  })
})
