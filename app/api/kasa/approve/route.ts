/**
 * Patron: Ödemeyi onayla — Sadece Patron bu işlemi yapabilir
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth
    const user = auth.user

    const body = await req.json()
    const kasaId = typeof body.kasa_id === 'string' ? body.kasa_id : ''

    if (!kasaId) return NextResponse.json({ error: 'kasa_id gerekli' }, { status: 400 })

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Veritabanı bağlantısı yok' }, { status: 503 })

    const { error: kasaErr } = await supabase
      .from('celf_kasa')
      .update({
        odeme_onaylandi: true,
        odeme_onaylayan: user.id,
        odeme_onay_tarihi: new Date().toISOString(),
      })
      .eq('id', kasaId)
      .eq('hareket_tipi', 'gelir')

    if (kasaErr) return NextResponse.json({ error: kasaErr.message }, { status: 500 })

    // tenant_purchases'ta da onayla
    await supabase
      .from('tenant_purchases')
      .update({ odeme_onaylandi: true, approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('celf_kasa_id', kasaId)

    return NextResponse.json({ ok: true, message: 'Ödeme onaylandı. Kullanıcı ürünü kullanabilir.' })
  } catch (e) {
    console.error('[kasa/approve]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
