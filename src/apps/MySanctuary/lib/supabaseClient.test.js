import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ tag: 'client' })),
}))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_test')
})
afterEach(() => vi.unstubAllEnvs())

describe('supabaseClient', () => {
  it('isConfigured est vrai quand les env sont présentes', async () => {
    const mod = await import('./supabaseClient.js')
    expect(mod.isConfigured()).toBe(true)
  })

  it('getSupabase renvoie un singleton', async () => {
    const mod = await import('./supabaseClient.js')
    expect(mod.getSupabase()).toBe(mod.getSupabase())
  })

  it('getSupabase renvoie null sans configuration', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.resetModules()
    const mod = await import('./supabaseClient.js')
    expect(mod.getSupabase()).toBeNull()
  })
})
