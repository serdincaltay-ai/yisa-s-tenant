import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('athletes')
      .select('id, name, surname, birth_date, gender, branch, level, "group", status, parent_name, parent_phone, parent_email, notes, trainer_id, created_at, updated_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('[franchise/athletes GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })

    const body = await req.json()
    const updates: Record<string, unknown> = {}
    if (typeof body.name === 'string') updates.name = body.name.trim()
    if (typeof body.surname === 'string') updates.surname = body.surname.trim() || null
    if (typeof body.birth_date === 'string') updates.birth_date = body.birth_date || null
    if (typeof body.gender === 'string' && ['E', 'K', 'diger'].includes(body.gender)) updates.gender = body.gender
    if (typeof body.branch === 'string') updates.branch = body.branch.trim() || null
    if (typeof body.level === 'string') updates.level = body.level.trim() || null
    if (typeof body.group === 'string') updates.group = body.group.trim() || null
    if (typeof body.parent_name === 'string') updates.parent_name = body.parent_name.trim() || null
    if (typeof body.parent_phone === 'string') updates.parent_phone = body.parent_phone.trim() || null
    if (typeof body.parent_email === 'string') updates.parent_email = body.parent_email.trim() || null
    if (typeof body.notes === 'string') updates.notes = body.notes.trim() || null
    if (typeof body.status === 'string' && ['active', 'inactive', 'trial'].includes(body.status)) updates.status = body.status
    if (typeof body.trainer_id === 'string') updates.trainer_id = body.trainer_id || null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('athletes')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/athletes PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { error } = await service
      .from('athletes')
      .update({ status: 'inactive' })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/athletes DELETE]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
