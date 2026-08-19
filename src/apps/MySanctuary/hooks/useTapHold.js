import { useRef, useCallback } from 'react'

const LONG_PRESS_MS = 600
// Après un touchend, on ignore les événements souris fantômes que les
// navigateurs mobiles émettent juste après un tap (sinon l'action se
// déclenche deux fois : lu → non-lu → lu, comme si rien ne changeait).
const GHOST_MOUSE_GUARD_MS = 600

// Détecte appui court / appui long, sans double-déclenchement tactile+souris.
export function useTapHold(onShort, onLong) {
  const timerRef = useRef(null)
  const firedRef = useRef(false)
  const lastTouchAtRef = useRef(0)

  const start = useCallback((e) => {
    e.preventDefault()
    if (e.type === 'mousedown' && Date.now() - lastTouchAtRef.current < GHOST_MOUSE_GUARD_MS) {
      return // événement souris fantôme consécutif à un tap tactile
    }
    firedRef.current = false
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onLong()
    }, LONG_PRESS_MS)
  }, [onLong])

  const end = useCallback((e) => {
    if (e.type === 'mouseup' && Date.now() - lastTouchAtRef.current < GHOST_MOUSE_GUARD_MS) {
      return
    }
    if (e.type === 'touchend') lastTouchAtRef.current = Date.now()
    clearTimeout(timerRef.current)
    if (!firedRef.current) onShort()
  }, [onShort])

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current)
    firedRef.current = true
  }, [])

  return {
    onMouseDown: start, onMouseUp: end, onMouseLeave: cancel,
    onTouchStart: start, onTouchEnd: end,
    onContextMenu: (e) => e.preventDefault(),
  }
}
