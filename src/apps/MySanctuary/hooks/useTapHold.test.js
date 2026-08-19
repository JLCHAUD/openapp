import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTapHold } from './useTapHold.js'

function fireEvent(type) {
  return { type, preventDefault: () => {} }
}

describe('useTapHold', () => {
  it('déclenche onShort sur un tap court (touch)', () => {
    const onShort = vi.fn(); const onLong = vi.fn()
    const { result } = renderHook(() => useTapHold(onShort, onLong))
    result.current.onTouchStart(fireEvent('touchstart'))
    result.current.onTouchEnd(fireEvent('touchend'))
    expect(onShort).toHaveBeenCalledOnce()
    expect(onLong).not.toHaveBeenCalled()
  })

  it('ignore le mousedown/mouseup fantôme juste après un tap tactile (pas de double appel)', () => {
    const onShort = vi.fn(); const onLong = vi.fn()
    const { result } = renderHook(() => useTapHold(onShort, onLong))
    result.current.onTouchStart(fireEvent('touchstart'))
    result.current.onTouchEnd(fireEvent('touchend'))
    // événements souris fantômes émis juste après par le navigateur mobile
    result.current.onMouseDown(fireEvent('mousedown'))
    result.current.onMouseUp(fireEvent('mouseup'))
    expect(onShort).toHaveBeenCalledOnce() // toujours un seul appel, pas deux
  })

  it('fonctionne normalement à la souris (desktop) sans tap tactile préalable', () => {
    const onShort = vi.fn(); const onLong = vi.fn()
    const { result } = renderHook(() => useTapHold(onShort, onLong))
    result.current.onMouseDown(fireEvent('mousedown'))
    result.current.onMouseUp(fireEvent('mouseup'))
    expect(onShort).toHaveBeenCalledOnce()
  })
})
