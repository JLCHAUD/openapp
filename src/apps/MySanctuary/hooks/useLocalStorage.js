import { useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  function setValue(value) {
    const next = value instanceof Function ? value(storedValue) : value
    setStoredValue(next)
    try { window.localStorage.setItem(key, JSON.stringify(next)) } catch {}
  }

  return [storedValue, setValue]
}
