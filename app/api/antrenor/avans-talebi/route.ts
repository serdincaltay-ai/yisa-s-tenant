/**
 * Antrenör: Avans talebi — tutar, sebep gir, gönder
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    const { data } = await service
      .from('advance_requests')
      .select('id, amount, reason, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[antrenor/avans-talebi GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const amount = Number(body.amount)
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (!amount || amount <= 0) return NextResponse.json({ error: 'Geçerli bir tutar giriniz' }, { status: 400 })
    if (!reason) return NextResponse.json({ error: 'Sebep zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' })

    const service = createServiceClient(url, key)

    const { data, error } = await service
      .from('advance_requests')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        amount,
        reason,
        status: 'pending',
      })
      .select('id, amount, reason, status')
      .single()

    if (error) {
      console.error('[avans-talebi insert]', error)
      return NextResponse.json({ ok: false, error: 'Avans talebi gönderilemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, talebi: data })
  } catch (e) {
    console.error('[antrenor/avans-talebi POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
