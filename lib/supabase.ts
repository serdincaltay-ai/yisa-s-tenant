/**
 * YİSA-S Supabase Client
 * Tarayıcıda createBrowserClient (çerez) — giriş oturumu dashboard ile paylaşılır.
 */

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Tarayıcıda createBrowserClient (çerez) — login ile aynı oturum, dashboard oturumu görür
const isBrowser = typeof window !== 'undefined'
export const supabase = url && anon
  ? (isBrowser ? createBrowserClient(url, anon) : createSupabaseClient(url, anon))
  : createMockClient()

// Supabase bağlantısının aktif olup olmadığını kontrol et
export const isSupabaseConfigured = Boolean(url && anon)

// Mock client - Supabase yapılandırılmadığında hata vermeden çalışır
function createMockClient(): SupabaseClient {
  const mockResponse = { data: null, error: { message: 'Supabase yapılandırılmamış. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlayın.' } }
  const mockAuthResponse = { data: { user: null, session: null }, error: null }
  
  return {
    auth: {
      getUser: async () => mockAuthResponse,
      getSession: async () => mockAuthResponse,
      signInWithPassword: async () => mockResponse,
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: [], error: null, then: (fn: (v: { data: never[], error: null }) => void) => fn({ data: [], error: null }) }),
      insert: () => mockResponse,
      update: () => mockResponse,
      delete: () => mockResponse,
      upsert: () => mockResponse,
    }),
  } as unknown as SupabaseClient
}

/**
 * Sunucu tarafı (API route) için Supabase client.
 * SUPABASE_SERVICE_ROLE_KEY varsa kullanır (chat_messages, patron_commands, celf_tasks, celf_logs, audit_log yazmak için).
 * Yoksa anon key ile oku/yaz (RLS politikalarına tabi).
 */
export function getSupabaseServer(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (url && serviceKey) return createSupabaseClient(url, serviceKey)
  if (url && anon) return createSupabaseClient(url, anon)
  return null
}
