import { useEffect, useState } from 'react'
import { getSupabase, isConfigured } from '../lib/supabaseClient.js'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) { setReady(true); return }
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_evt, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Connexion par mot de passe (aucun email/lien, même contexte que l'app).
  async function signInPassword(email, password) {
    const sb = getSupabase()
    if (!sb) return { error: 'Supabase non configuré' }
    const { error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    const sb = getSupabase()
    if (sb) await sb.auth.signOut()
  }

  return { session, ready, configured: isConfigured(), signInPassword, signOut }
}
