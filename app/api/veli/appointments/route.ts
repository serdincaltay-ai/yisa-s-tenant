/**
 * /api/veli/appointments
 * GET — Velinin randevularını listele
 * POST — Yeni randevu oluştur
 * PATCH — Randevu iptal et
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    const athleteId = req.nextUrl.searchParams.get('athlete_id')

    let query = service
      .from('appointments')
      .select('id, tenant_id, athlete_id, coach_id, appointment_date, appointment_time, duration_minutes, parent_name, parent_surname, parent_phone, note, status, created_at')
      .eq('parent_user_id', user.id)
      .order('appointment_date', { ascending: false })

    if (athleteId) {
      query = query.eq('athlete_id', athleteId)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('[veli/appointments GET]', error)
      return NextResponse.json({ items: [] })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[veli/appointments GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const body = await req.json()

    const {
      athlete_id,
      appointment_date,
      appointment_time,
      parent_name,
      parent_surname,
      parent_phone,
      note,
    } = body

    if (!athlete_id || !appointment_date || !appointment_time || !parent_name) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }

    // Veli sahiplik kontrolü
    const { data: athlete } = await service
      .from('athletes')
      .select('id, tenant_id')
      .eq('id', athlete_id)
      .eq('parent_user_id', user.id)
      .single()
    if (!athlete) {
      return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })
    }

    // Aynı tarih/saat çakışma kontrolü
    const { data: existing } = await service
      .from('appointments')
      .select('id')
      .eq('tenant_id', athlete.tenant_id)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .in('status', ['bekliyor', 'onaylandi'])
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Bu saat dolu. Lütfen başka bir saat seçin.' }, { status: 409 })
    }

    const { data: created, error } = await service
      .from('appointments')
      .insert({
        tenant_id: athlete.tenant_id,
        athlete_id,
        parent_user_id: user.id,
        appointment_date,
        appointment_time,
        parent_name: String(parent_name).trim(),
        parent_surname: parent_surname ? String(parent_surname).trim() : null,
        parent_phone: parent_phone ? String(parent_phone).trim() : null,
        note: note ? String(note).trim() : null,
        status: 'bekliyor',
      })
      .select()
      .single()

    if (error) {
      console.error('[veli/appointments POST]', error)
      return NextResponse.json({ error: 'Randevu oluşturulamadı: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, appointment: created })
  } catch (e) {
    console.error('[veli/appointments POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const body = await req.json()

    const { id, status } = body
    if (!id) return NextResponse.json({ error: 'Randevu ID gerekli' }, { status: 400 })

    // Sadece iptal izni ver
    if (status !== 'iptal') {
      return NextResponse.json({ error: 'Sadece iptal işlemi yapabilirsiniz' }, { status: 403 })
    }

    const { error } = await service
      .from('appointments')
      .update({ status: 'iptal', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('parent_user_id', user.id)

    if (error) {
      console.error('[veli/appointments PATCH]', error)
      return NextResponse.json({ error: 'Randevu güncellenemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[veli/appointments PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
