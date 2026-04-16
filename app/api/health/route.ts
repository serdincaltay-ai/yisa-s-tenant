/**
 * YİSA-S Sistem Durum API
 * Çalışmıyorsa nedenini söyler: env eksik mi, Supabase erişilebilir mi?
 * Anahtar DEĞERLERİ döndürülmez; sadece "var mı" ve uzunluk bilgisi.
 * Tarih: 30 Ocak 2026
 */

import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

const ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'TOGETHER_API_KEY',
] as const

function getEnvStatus(): Record<string, { set: boolean; length: number }> {
  const out: Record<string, { set: boolean; length: number }> = {}
  for (const key of ENV_KEYS) {
    const v = process.env[key]
    const str = typeof v === 'string' ? v.trim() : ''
    out[key] = { set: str.length > 0, length: str.length }
  }
  return out
}

export async function GET() {
  const env = getEnvStatus()
  const reasons: string[] = []

  if (!env.NEXT_PUBLIC_SUPABASE_URL.set) reasons.push('NEXT_PUBLIC_SUPABASE_URL yok')
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY.set) reasons.push('NEXT_PUBLIC_SUPABASE_ANON_KEY yok')
  if (!env.GOOGLE_GEMINI_API_KEY.set) {
    reasons.push('GOOGLE_GEMINI_API_KEY yok (ilk adım Gemini için gerekli)')
  }
  if (!env.OPENAI_API_KEY.set) reasons.push('OPENAI_API_KEY yok (imla yedeği + CELF için)')

  let supabaseOk = false
  try {
    const supabase = getSupabaseServer()
    if (supabase) {
      const { error } = await supabase.from('tenants').select('id').limit(1)
      supabaseOk = !error
      if (error && error.code === '42P01') reasons.push('Supabase: tenants tablosu yok (tek SQL çalıştırıldı mı?)')
      else if (error) reasons.push(`Supabase: ${error.message}`)
    } else {
      reasons.push('Supabase client oluşturulamadı (URL veya SERVICE_ROLE_KEY eksik)')
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    reasons.push(`Supabase bağlantı hatası: ${msg}`)
  }

  const ok = reasons.length === 0 && supabaseOk
  return NextResponse.json({
    ok,
    reason: ok ? undefined : (reasons[0] ?? 'Bilinmeyen hata'),
    reasons: reasons.length ? reasons : undefined,
    env: env,
    supabase: supabaseOk ? 'ok' : 'fail',
    message: ok
      ? 'Sistem hazır. İlk adım Gemini, aynı API anahtarları Asistan + CELF için kullanılıyor.'
      : 'Sorun var. reasons ve env alanlarına bakın; .env.local ve tek SQL kontrol edin.',
  })
}
