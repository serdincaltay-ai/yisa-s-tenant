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
    const status = searchParams.get('status')
    const periodMonth = searchParams.get('period_month')
    const periodYear = searchParams.get('period_year')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    let q = service
      .from('payments')
      .select('id, athlete_id, amount, payment_type, period_month, period_year, due_date, paid_date, status, payment_method, notes, created_at, athletes(name, surname)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (status && ['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      q = q.eq('status', status)
    }
    if (periodMonth) {
      const m = parseInt(periodMonth, 10)
      if (m >= 1 && m <= 12) q = q.eq('period_month', m)
    }
    if (periodYear) {
      const y = parseInt(periodYear, 10)
      if (y >= 2020 && y <= 2030) q = q.eq('period_year', y)
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ items: [], error: error.message })

    const items = (data ?? []).map((row: Record<string, unknown>) => {
      const a = row.athletes as Record<string, unknown> | null
      return {
        id: row.id,
        athlete_id: row.athlete_id,
        athlete_name: a ? `${a.name ?? ''} ${a.surname ?? ''}`.trim() : '—',
        amount: Number(row.amount),
        payment_type: row.payment_type,
        period_month: row.period_month,
        period_year: row.period_year,
        due_date: row.due_date,
        paid_date: row.paid_date,
        status: row.status,
        payment_method: row.payment_method,
        notes: row.notes,
        created_at: row.created_at,
      }
    })
    return NextResponse.json({ items })
  } catch (e) {
    console.error('[franchise/payments GET]', e)
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

    if (body.bulk === true) {
      const amount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount)
      const periodMonth = body.period_month ? parseInt(String(body.period_month), 10) : new Date().getMonth() + 1
      const periodYear = body.period_year ? parseInt(String(body.period_year), 10) : new Date().getFullYear()
      const dueDate = typeof body.due_date === 'string' ? body.due_date : `${periodYear}-${String(periodMonth).padStart(2, '0')}-15`
      if (Number.isNaN(amount) || amount <= 0) return NextResponse.json({ error: 'Geçerli tutar girin' }, { status: 400 })

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
      const service = createServiceClient(url, key)

      const { data: athletes } = await service.from('athletes').select('id').eq('tenant_id', tenantId).eq('status', 'active')
      if (!athletes?.length) return NextResponse.json({ error: 'Aktif üye yok' }, { status: 400 })

      const existing = await service.from('payments').select('athlete_id').eq('tenant_id', tenantId).eq('period_month', periodMonth).eq('period_year', periodYear).eq('payment_type', 'aidat')
      const existingIds = new Set((existing.data ?? []).map((r: { athlete_id: string }) => r.athlete_id))
      const toCreate = athletes.filter((a: { id: string }) => !existingIds.has(a.id))
      if (toCreate.length === 0) return NextResponse.json({ ok: true, message: 'Tüm aktif üyeler için bu dönem aidatı zaten oluşturulmuş', created: 0 })

      const rows = toCreate.map((a: { id: string }) => ({
        tenant_id: tenantId,
        athlete_id: a.id,
        amount,
        payment_type: 'aidat',
        period_month: periodMonth,
        period_year: periodYear,
        due_date: dueDate,
        status: 'pending',
      }))
      const { data: inserted, error } = await service.from('payments').insert(rows).select('id')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, created: inserted?.length ?? 0, message: `${inserted?.length ?? 0} aidat oluşturuldu` })
    }

    const athleteId = body.athlete_id as string | undefined
    const amount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount)
    const paymentType = ['aidat', 'kayit', 'ekstra'].includes(body.payment_type) ? body.payment_type : 'aidat'
    const periodMonth = typeof body.period_month === 'number' ? body.period_month : body.period_month ? parseInt(body.period_month, 10) : null
    const periodYear = typeof body.period_year === 'number' ? body.period_year : body.period_year ? parseInt(body.period_year, 10) : null
    const dueDate = typeof body.due_date === 'string' ? body.due_date : null
    const paidDate = typeof body.paid_date === 'string' ? body.paid_date : null
    const status = ['pending', 'paid', 'overdue', 'cancelled'].includes(body.status) ? body.status : (paidDate ? 'paid' : 'pending')
    const paymentMethod = body.payment_method && ['nakit', 'kart', 'havale', 'eft'].includes(body.payment_method) ? body.payment_method : null
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null

    if (!athleteId) return NextResponse.json({ error: 'athlete_id zorunludur' }, { status: 400 })
    if (Number.isNaN(amount) || amount <= 0) return NextResponse.json({ error: 'Geçerli tutar girin' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: athlete } = await service.from('athletes').select('id').eq('id', athleteId).eq('tenant_id', tenantId).maybeSingle()
    if (!athlete) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })

    const { data, error } = await service
      .from('payments')
      .insert({
        tenant_id: tenantId,
        athlete_id: athleteId,
        amount,
        payment_type: paymentType,
        period_month: periodMonth,
        period_year: periodYear,
        due_date: dueDate || null,
        paid_date: paidDate || null,
        status,
        payment_method: paymentMethod,
        notes: notes || null,
      })
      .select('id, amount, status, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (status === 'paid' && data?.id) {
      const odemeYontemi = paymentMethod === 'kart' ? 'kart' : paymentMethod === 'havale' || paymentMethod === 'eft' ? 'havale' : 'nakit'
      const kategori = paymentType === 'kayit' ? 'aidat' : paymentType === 'ekstra' ? 'ders_ucreti' : 'aidat'
      try {
        await service.from('cash_register').insert({
          tenant_id: tenantId,
          tarih: paidDate || new Date().toISOString().slice(0, 10),
          tur: 'gelir',
          kategori,
          aciklama: `Ödeme #${data.id}`,
          tutar: amount,
          odeme_yontemi: odemeYontemi,
          kaydeden_id: user.id,
        })
      } catch { /* kasa kaydı opsiyonel */ }
    }
    return NextResponse.json({ ok: true, payment: data })
  } catch (e) {
    console.error('[franchise/payments POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const id = body.id as string | undefined
    const status = body.status as string | undefined
    const paidDate = body.paid_date as string | undefined
    const paymentMethod = body.payment_method as string | undefined

    if (body.bulk === true && Array.isArray(body.ids) && body.ids.length > 0) {
      const ids = body.ids.filter((x: unknown) => typeof x === 'string') as string[]
      const bulkStatus = body.status && ['pending', 'paid', 'overdue', 'cancelled'].includes(body.status) ? body.status : 'paid'
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
      const service = createServiceClient(url, key)
      const bulkPm = body.payment_method as string | undefined
      const updates: Record<string, unknown> = { status: bulkStatus }
      if (bulkStatus === 'paid') updates.paid_date = new Date().toISOString().slice(0, 10)
      if (bulkPm && ['nakit', 'kart', 'havale', 'eft'].includes(bulkPm)) updates.payment_method = bulkPm
      const { data: updated, error } = await service.from('payments').update(updates).eq('tenant_id', tenantId).in('id', ids).select('id')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, count: updated?.length ?? 0, message: `${updated?.length ?? 0} kayıt güncellendi` })
    }

    if (!id) return NextResponse.json({ error: 'id zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const updates: Record<string, unknown> = {}
    if (status && ['pending', 'paid', 'overdue', 'cancelled'].includes(status)) updates.status = status
    if (paidDate) updates.paid_date = paidDate
    if (paymentMethod && ['nakit', 'kart', 'havale', 'eft'].includes(paymentMethod)) updates.payment_method = paymentMethod
    if (status === 'paid' && !paidDate) updates.paid_date = new Date().toISOString().slice(0, 10)

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })

    const { data: prev } = await service.from('payments').select('status, amount, payment_type, payment_method').eq('id', id).eq('tenant_id', tenantId).single()
    const { data, error } = await service.from('payments').update(updates).eq('id', id).eq('tenant_id', tenantId).select('id, status, paid_date').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (status === 'paid' && prev?.status !== 'paid' && data?.id) {
      const tutar = Number(prev?.amount) || 0
      if (tutar > 0) {
        const pm =
          paymentMethod && ['nakit', 'kart', 'havale', 'eft'].includes(paymentMethod)
            ? paymentMethod
            : prev?.payment_method
        const odemeYontemi = pm === 'kart' ? 'kart' : pm === 'havale' || pm === 'eft' ? 'havale' : 'nakit'
        const pt = prev?.payment_type
        const kategori = pt === 'kayit' ? 'aidat' : pt === 'ekstra' ? 'ders_ucreti' : 'aidat'
        const tarih = (updates.paid_date as string) || new Date().toISOString().slice(0, 10)
        try {
          await service.from('cash_register').insert({
            tenant_id: tenantId,
            tarih,
            tur: 'gelir',
            kategori,
            aciklama: `Ödeme #${data.id}`,
            tutar,
            odeme_yontemi: odemeYontemi,
            kaydeden_id: user.id,
          })
        } catch { /* kasa kaydı opsiyonel */ }
      }
    }
    return NextResponse.json({ ok: true, payment: data })
  } catch (e) {
    console.error('[franchise/payments PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
