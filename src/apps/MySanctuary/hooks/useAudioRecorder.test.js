import { describe, it, expect, vi, afterEach } from 'vitest'
import { pickMime } from './useAudioRecorder.js'

afterEach(() => { vi.unstubAllGlobals() })

describe('pickMime', () => {
  it('choisit audio/mp4 si supporté (iOS)', () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: t => t === 'audio/mp4' })
    expect(pickMime()).toBe('audio/mp4')
  })

  it('retombe sur webm/opus', () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: t => t === 'audio/webm;codecs=opus' })
    expect(pickMime()).toBe('audio/webm;codecs=opus')
  })

  it('renvoie une chaîne vide si rien n\'est supporté', () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => false })
    expect(pickMime()).toBe('')
  })
})
