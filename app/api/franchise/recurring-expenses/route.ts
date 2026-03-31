import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = ['kira', 'elektrik', 'su', 'dogalgaz', 'internet', 'sigorta', 'personel', 'diger'] as const
const VALID_FREQUENCIES = ['monthly', 'quarterly', 'yearly'] as const

function getService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [], message: 'Tenant atanmamis' })

    const service = getService()
    if (!service) return NextResponse.json({ items: [] })

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') !== 'false'

    let q = service
      .from('recurring_expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (activeOnly) {
      q = q.eq('is_active', true)
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ items: [], error: error.message })

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[recurring-expenses GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamis' }, { status: 403 })

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const body = await req.json()

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const category = VALID_CATEGORIES.includes(body.category) ? body.category : null
    const amount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount)
    const currency = typeof body.currency === 'string' ? body.currency.trim() : 'TRY'
    const frequency = VALID_FREQUENCIES.includes(body.frequency) ? body.frequency : 'monthly'
    const dueDay = typeof body.due_day === 'number' ? body.due_day : parseInt(body.due_day, 10)
    const startDate = typeof body.start_date === 'string' ? body.start_date : new Date().toISOString().slice(0, 10)
    const endDate = typeof body.end_date === 'string' ? body.end_date : null
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null

    if (!title) return NextResponse.json({ error: 'Baslik zorunludur' }, { status: 400 })
    if (!category) return NextResponse.json({ error: 'Gecerli kategori secin' }, { status: 400 })
    if (Number.isNaN(amount) || amount <= 0) return NextResponse.json({ error: 'Gecerli tutar girin' }, { status: 400 })
    if (Number.isNaN(dueDay) || dueDay < 1 || dueDay > 28) return NextResponse.json({ error: 'Odeme gunu 1-28 arasi olmalidir' }, { status: 400 })

    const { data, error } = await service
      .from('recurring_expenses')
      .insert({
        tenant_id: tenantId,
        title,
        category,
        amount,
        currency,
        frequency,
        due_day: dueDay,
        start_date: startDate,
        end_date: endDate || null,
        notes: notes || null,
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[recurring-expenses POST]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamis' }, { status: 403 })

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const body = await req.json()
    const id = body.id as string | undefined
    if (!id) return NextResponse.json({ error: 'id zorunludur' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
    if (VALID_CATEGORIES.includes(body.category)) updates.category = body.category
    if (body.amount !== undefined) {
      const amt = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount)
      if (!Number.isNaN(amt) && amt > 0) updates.amount = amt
    }
    if (typeof body.currency === 'string') updates.currency = body.currency.trim()
    if (VALID_FREQUENCIES.includes(body.frequency)) updates.frequency = body.frequency
    if (body.due_day !== undefined) {
      const dd = typeof body.due_day === 'number' ? body.due_day : parseInt(body.due_day, 10)
      if (!Number.isNaN(dd) && dd >= 1 && dd <= 28) updates.due_day = dd
    }
    if (typeof body.start_date === 'string') updates.start_date = body.start_date
    if (body.end_date !== undefined) updates.end_date = body.end_date || null
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
    if (typeof body.notes === 'string') updates.notes = body.notes.trim() || null

    const { data, error } = await service
      .from('recurring_expenses')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[recurring-expenses PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamis' }, { status: 403 })

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id zorunludur' }, { status: 400 })

    const { error } = await service
      .from('recurring_expenses')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[recurring-expenses DELETE]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
