import { getSupabase } from './supabaseClient.js'

// Récupère l'état cloud pour une clé. Renvoie { data, updatedAt(ms) } ou null.
export async function pullState(key) {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from('app_state')
    .select('data,updated_at')
    .eq('key', key)
    .maybeSingle()
  if (error || !data) return null
  return { data: data.data, updatedAt: Date.parse(data.updated_at) || 0 }
}

// Écrit (upsert) l'état cloud pour une clé, en fixant nous-mêmes l'horodatage.
export async function pushState(key, data, tsMs) {
  const sb = getSupabase()
  if (!sb) return { error: 'not-configured' }
  const { data: userData } = await sb.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) return { error: 'not-authenticated' }
  const { error } = await sb.from('app_state').upsert(
    { owner: uid, key, data, updated_at: new Date(tsMs || Date.now()).toISOString() },
    { onConflict: 'owner,key' }
  )
  return { error: error?.message ?? null }
}
