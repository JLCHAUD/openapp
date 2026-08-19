import { useState, useRef, useEffect, useCallback } from 'react'
import { getSupabase } from '../lib/supabaseClient.js'
import { pullState, pushState } from '../lib/cloudSync.js'

function readLocal(key, initial) {
  try {
    const v = window.localStorage.getItem(key)
    return v ? JSON.parse(v) : initial
  } catch { return initial }
}
function readTs(key) {
  const t = Number(window.localStorage.getItem(key + '__t'))
  return Number.isFinite(t) ? t : 0
}

/**
 * Comme useLocalStorage, mais sauvegarde aussi dans Supabase (si connecté).
 * Règle : dernière écriture gagne (par horodatage). À l'ouverture, si le cloud
 * est plus récent que le local, on adopte le cloud (les données reviennent après
 * une mise à jour / un cache vidé). Sinon on pousse le local vers le cloud.
 */
export function useCloudState(key, initial) {
  const [value, setLocalValue] = useState(() => readLocal(key, initial))
  const tsRef = useRef(readTs(key))
  const authedRef = useRef(false)
  const debounceRef = useRef(null)

  const schedulePush = useCallback((data, ts) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (authedRef.current) pushState(key, data, ts)
    }, 2000)
  }, [key])

  const setValue = useCallback((updater) => {
    setLocalValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const now = Date.now()
      tsRef.current = now
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
        window.localStorage.setItem(key + '__t', String(now))
      } catch { /* quota / private mode */ }
      schedulePush(next, now)
      return next
    })
  }, [key, schedulePush])

  // Réconciliation cloud ↔ local (à l'ouverture et à chaque changement de session)
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    let cancelled = false

    async function reconcile() {
      const { data: { session } } = await sb.auth.getSession()
      authedRef.current = !!session
      if (!session) return
      const cloud = await pullState(key)
      if (cancelled) return
      if (cloud && cloud.updatedAt > tsRef.current) {
        // Le cloud est plus récent → on l'adopte
        tsRef.current = cloud.updatedAt
        try {
          window.localStorage.setItem(key, JSON.stringify(cloud.data))
          window.localStorage.setItem(key + '__t', String(cloud.updatedAt))
        } catch { /* ignore */ }
        setLocalValue(cloud.data)
      } else {
        // Local plus récent (ou pas de cloud) → on sauvegarde le local
        const localData = readLocal(key, initial)
        pushState(key, localData, tsRef.current || Date.now())
      }
    }

    reconcile()
    const { data: sub } = sb.auth.onAuthStateChange((_evt, s) => {
      authedRef.current = !!s
      if (s) reconcile()
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue]
}
