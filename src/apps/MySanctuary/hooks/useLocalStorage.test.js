import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage.js'

beforeEach(() => localStorage.clear())

describe('useLocalStorage', () => {
  it('retourne la valeur initiale si clé absente', () => {
    const { result } = renderHook(() => useLocalStorage('test', { a: 1 }))
    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('persiste une valeur mise à jour', () => {
    const { result } = renderHook(() => useLocalStorage('test', 0))
    act(() => result.current[1](42))
    expect(result.current[0]).toBe(42)
    expect(JSON.parse(localStorage.getItem('test'))).toBe(42)
  })

  it('accepte un updater function', () => {
    const { result } = renderHook(() => useLocalStorage('test', 10))
    act(() => result.current[1](prev => prev + 5))
    expect(result.current[0]).toBe(15)
  })
})
