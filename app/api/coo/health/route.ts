/**
 * COO Sigorta — YİSA-S sağlık kontrolü
 * COO bu endpoint'i periyodik çağırır. YİSA-S yanıt vermezse COO devreye girer.
 * Tarih: 5 Şubat 2026
 */

import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, boolean | string> = {}
  let ok = true

  // 1. Supabase
  try {
    const db = getSupabaseServer()
    if (!db) {
      checks.supabase = 'client yok'
      ok = false
    } else {
      const { error } = await db.from('patron_commands').select('id').limit(1)
      checks.supabase = !error
      if (error) ok = false
    }
  } catch {
    checks.supabase = false
    ok = false
  }

  // 2. Temel env
  checks.env_supabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  if (!checks.env_supabase) ok = false

  return NextResponse.json({
    ok,
    service: 'yisa-s',
    timestamp: new Date().toISOString(),
    checks,
    message: ok ? 'YİSA-S çalışıyor.' : 'COO devreye girebilir — YİSA-S sorunlu.',
  })
}
