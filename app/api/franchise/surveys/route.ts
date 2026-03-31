import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

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
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const service = getService()
    if (!service) return NextResponse.json({ items: [] })

    const statusFilter = req.nextUrl.searchParams.get('status')
    let query = service
      .from('tenant_surveys')
      .select('id, title, description, questions, status, created_at')
      .eq('tenant_id', tenantId)
    if (statusFilter && ['draft', 'active', 'closed'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[franchise/surveys GET]', e)
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
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const questions = Array.isArray(body.questions) ? body.questions : []
    if (!title) return NextResponse.json({ error: 'Anket başlığı zorunludur' }, { status: 400 })

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const { data, error } = await service
      .from('tenant_surveys')
      .insert({
        tenant_id: tenantId,
        title,
        description: description || null,
        questions,
        status: 'draft',
        created_by: user.id,
      })
      .select('id, title, description, questions, status, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[franchise/surveys POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/** PATCH — anket güncelle (status toggle, title, questions) */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const surveyId = typeof body.id === 'string' ? body.id.trim() : ''
    if (!surveyId) return NextResponse.json({ error: 'Anket ID zorunludur' }, { status: 400 })

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const updates: Record<string, unknown> = {}
    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
    if (typeof body.description === 'string') updates.description = body.description.trim() || null
    if (Array.isArray(body.questions)) updates.questions = body.questions
    if (typeof body.status === 'string' && ['draft', 'active', 'closed'].includes(body.status)) {
      updates.status = body.status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    }

    const { data, error } = await service
      .from('tenant_surveys')
      .update(updates)
      .eq('id', surveyId)
      .eq('tenant_id', tenantId)
      .select('id, title, description, questions, status, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[franchise/surveys PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
