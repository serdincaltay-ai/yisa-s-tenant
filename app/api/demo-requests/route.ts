import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import { provisionTenant, rejectDemoRequest } from '@/lib/services/tenant-provisioning'

export const dynamic = 'force-dynamic'

const getUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const getServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? null
const getAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null

/** Service role (veya anon fallback). GET liste ve record_payment için. */
function getSupabase(): SupabaseClient | null {
  const url = getUrl()
  const key = getServiceRoleKey() ?? getAnonKey()
  if (!url || !key) return null
  return createClient(url, key)
}

/** Sadece service_role ile client; anon fallback yok. Public form INSERT için zorunlu (RETURNING RLS). */
function getServiceRoleSupabase(): SupabaseClient | null {
  const url = getUrl()
  const key = getServiceRoleKey()
  if (!url || !key) return null
  return createClient(url, key)
}

/** Patron paneli: Demo taleplerini listele */
export async function GET() {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ items: [] })

    const { data, error } = await supabase
      .from('demo_requests')
      .select('id, name, email, phone, facility_type, city, notes, status, source, created_at, payment_status, payment_amount, payment_at, payment_notes')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[demo-requests] GET error:', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Onay/Red — Patron panelinden (yetkili kullanıcı gerekli)
    const action = body.action as string | undefined
    if (action === 'decide') {
      const auth = await requirePatronOrFlow()
      if (auth instanceof NextResponse) return auth
      const id = typeof body.id === 'string' ? body.id.trim() : ''
      const decision = body.decision as 'approve' | 'reject'
      if (!id || !['approve', 'reject'].includes(decision)) {
        return NextResponse.json({ error: 'id ve decision (approve|reject) gerekli.' }, { status: 400 })
      }

      if (decision === 'reject') {
        const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined
        const result = await rejectDemoRequest(id, reason)
        if (!result.ok) {
          return NextResponse.json({ error: result.message }, { status: 400 })
        }
        return NextResponse.json(result)
      }

      // approve: Full tenant provisioning chain
      // Steps: tenant create -> user setup -> franchise record -> subdomain -> seed data -> status update
      const result = await provisionTenant(id)
      if (!result.ok) {
        const status = result.error_step === 'validation' ? 400
          : result.error_step === 'fetch' ? 404
          : 500
        return NextResponse.json({
          error: result.message,
          steps_completed: result.steps_completed,
          error_step: result.error_step,
          error_detail: result.error_detail,
        }, { status })
      }

      return NextResponse.json(result)
    }

    // Ödeme kaydı — Patron: "Merve ödedi" → bu talep için ödeme alındı işaretle
    if (action === 'record_payment') {
      const authPay = await requirePatronOrFlow()
      if (authPay instanceof NextResponse) return authPay
      const id = typeof body.id === 'string' ? body.id.trim() : ''
      const amount = typeof body.amount === 'number' ? body.amount : (typeof body.amount === 'string' ? parseFloat(body.amount) : undefined)
      const paidAt = typeof body.paid_at === 'string' ? body.paid_at : (body.paid_at ? new Date().toISOString() : undefined)
      const notes = typeof body.payment_notes === 'string' ? body.payment_notes.trim() : null
      if (!id) {
        return NextResponse.json({ error: 'id gerekli.' }, { status: 400 })
      }
      const supabase = getSupabase()
      if (!supabase) return NextResponse.json({ error: 'Sunucu yapılandırma hatası.' }, { status: 500 })
      const { data: row } = await supabase.from('demo_requests').select('id, status').eq('id', id).single()
      if (!row) return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 })
      const update: Record<string, unknown> = {
        payment_status: 'odendi',
        payment_at: paidAt ?? new Date().toISOString(),
      }
      if (amount != null && !Number.isNaN(amount)) update.payment_amount = amount
      if (notes != null) update.payment_notes = notes
      const { error: updErr } = await supabase.from('demo_requests').update(update).eq('id', id)
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
      return NextResponse.json({ ok: true, message: 'Ödeme kaydedildi.' })
    }

    // Yeni demo talebi (form gönderimi)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null
    const facilityType = typeof body.facility_type === 'string' ? body.facility_type.trim() : null
    const city = typeof body.city === 'string' ? body.city.trim() : null
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null
    const source = typeof body.source === 'string' ? body.source : 'www'

    if (!name || !email) {
      return NextResponse.json({ error: 'Ad ve e-posta zorunludur.' }, { status: 400 })
    }

    // Public form: service_role zorunlu — INSERT sonrası .select('id') RLS ile anon'da SELECT yok, 404/500 olur.
    const supabase = getServiceRoleSupabase()
    if (!supabase) {
      console.error('[demo-requests] SUPABASE_SERVICE_ROLE_KEY veya NEXT_PUBLIC_SUPABASE_URL eksik (Vercel env).')
      return NextResponse.json({ error: 'Veritabanı yapılandırma hatası.' }, { status: 500 })
    }
    const { data, error } = await supabase
      .from('demo_requests')
      .insert({
        name,
        email,
        phone: phone || null,
        facility_type: facilityType || null,
        city: city || null,
        notes: notes || null,
        source: ['www', 'demo', 'fiyatlar', 'vitrin', 'manychat'].includes(source) ? source : 'www',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[demo-requests] Insert error:', error)
      return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('[demo-requests] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
