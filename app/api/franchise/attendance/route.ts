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
    if (!tenantId) return NextResponse.json({ items: [], message: 'Tenant atanmamış' })

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) return NextResponse.json({ summary: [] })
      const service = createServiceClient(url, key)
      const { data, error } = await service
        .from('attendance')
        .select('lesson_date, status')
        .eq('tenant_id', tenantId)
        .gte('lesson_date', from)
        .lte('lesson_date', to)
      if (error) return NextResponse.json({ summary: [] })
      const byDate: Record<string, { geldi: number; gelmedi: number; izinli: number; hasta: number }> = {}
      for (const r of data ?? []) {
        const d = r.lesson_date as string
        if (!byDate[d]) byDate[d] = { geldi: 0, gelmedi: 0, izinli: 0, hasta: 0 }
        const s = r.status as string
        if (s === 'present') byDate[d].geldi++
        else if (s === 'absent') byDate[d].gelmedi++
        else if (s === 'excused') byDate[d].izinli++
        else if (s === 'late') byDate[d].hasta++
      }
      const summary = Object.entries(byDate).map(([tarih, v]) => ({ tarih, ...v })).sort((a, b) => a.tarih.localeCompare(b.tarih))
      return NextResponse.json({ summary })
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date parametresi gerekli (YYYY-MM-DD)' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('attendance')
      .select('id, athlete_id, lesson_date, lesson_time, status, notes, athletes(name, surname)')
      .eq('tenant_id', tenantId)
      .eq('lesson_date', date)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ items: [], error: error.message })

    const items = (data ?? []).map((row: Record<string, unknown>) => {
      const a = row.athletes as Record<string, unknown> | null
      return {
        id: row.id,
        athlete_id: row.athlete_id,
        athlete_name: a ? `${a.name ?? ''} ${a.surname ?? ''}`.trim() : '—',
        lesson_date: row.lesson_date,
        lesson_time: row.lesson_time,
        status: row.status,
        notes: row.notes,
      }
    })
    return NextResponse.json({ items })
  } catch (e) {
    console.error('[franchise/attendance GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const records = body.records as Array<{ athlete_id: string; lesson_date: string; status?: string; lesson_time?: string | null }>
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'records dizisi gerekli' }, { status: 400 })
    }

    const allowedStatus = ['present', 'absent', 'late', 'excused', 'penalized']
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const rows = records.map((r) => ({
      tenant_id: tenantId,
      athlete_id: r.athlete_id,
      lesson_date: r.lesson_date,
      lesson_time: r.lesson_time ?? null,
      status: allowedStatus.includes(r.status ?? '') ? r.status : 'present',
      marked_by: user.id,
    }))

    const { data, error } = await service
      .from('attendance')
      .upsert(rows, { onConflict: 'tenant_id,athlete_id,lesson_date' })
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Devamsızlık durumunda app-yisa-s SMS / aidat-reminder API tetiği
    const absentRecords = rows.filter((r) => r.status === 'absent')
    const appYisaUrl = process.env.APP_YISA_S_API_URL ?? process.env.NEXT_PUBLIC_APP_YISA_S_API_URL
    const reminderPath = process.env.APP_YISA_S_REMINDER_PATH ?? '/api/reminder/devamsizlik'
    if (appYisaUrl && absentRecords.length > 0) {
      try {
        const base = appYisaUrl.replace(/\/$/, '')
        const path = reminderPath.startsWith('/') ? reminderPath : `/${reminderPath}`
        await fetch(`${base}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            records: absentRecords.map((r) => ({
              athlete_id: r.athlete_id,
              lesson_date: r.lesson_date,
            })),
          }),
        })
      } catch (e) {
        console.warn('[franchise/attendance] Devamsızlık tetik (app-yisa-s SMS/aidat-reminder) hatası:', e)
      }
    }

    return NextResponse.json({ ok: true, count: data?.length ?? 0 })
  } catch (e) {
    console.error('[franchise/attendance POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

const PATCH_ALLOWED_STATUS = ['present', 'absent', 'late', 'excused', 'penalized'] as const

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const updates = body.records as Array<{ id: string; status: string }>
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'records dizisi gerekli (id, status)' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    let okCount = 0
    for (const u of updates) {
      if (!u.id || !PATCH_ALLOWED_STATUS.includes(u.status as (typeof PATCH_ALLOWED_STATUS)[number])) continue
      const { error } = await service
        .from('attendance')
        .update({ status: u.status, marked_by: user.id })
        .eq('id', u.id)
        .eq('tenant_id', tenantId)
      if (!error) okCount++
    }
    return NextResponse.json({ ok: true, count: okCount })
  } catch (e) {
    console.error('[franchise/attendance PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
