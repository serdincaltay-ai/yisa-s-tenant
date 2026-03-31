import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getTenantId(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const service = createServiceClient(url, key)
  const { data: ut } = await service.from('user_tenants').select('tenant_id').eq('user_id', userId).limit(1).maybeSingle()
  if (ut?.tenant_id) return ut.tenant_id
  const { data: t } = await service.from('tenants').select('id').eq('owner_id', userId).limit(1).maybeSingle()
  return t?.id ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamis' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('staff')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Personel bulunamadi' }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('[franchise/staff/[id] GET]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamis' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })

    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if (typeof body.name === 'string') updates.name = body.name.trim()
    if (typeof body.surname === 'string') updates.surname = body.surname.trim() || null
    if (typeof body.email === 'string') updates.email = body.email.trim() || null
    if (typeof body.phone === 'string') updates.phone = body.phone.trim() || null
    if (typeof body.role === 'string') updates.role = body.role
    if (typeof body.branch === 'string') updates.branch = body.branch.trim() || null
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
    if (typeof body.birth_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.birth_date)) updates.birth_date = body.birth_date
    if (typeof body.address === 'string') updates.address = body.address.trim() || null
    if (typeof body.city === 'string') updates.city = body.city.trim() || null
    if (typeof body.district === 'string') updates.district = body.district.trim() || null
    if (typeof body.previous_work === 'string') updates.previous_work = body.previous_work.trim() || null
    if (typeof body.chronic_condition === 'string') updates.chronic_condition = body.chronic_condition.trim() || null
    if (typeof body.has_driving_license === 'boolean') updates.has_driving_license = body.has_driving_license
    if (typeof body.languages === 'string') updates.languages = body.languages.trim() || null
    if (typeof body.employment_type === 'string' && ['full_time', 'part_time', 'intern'].includes(body.employment_type)) updates.employment_type = body.employment_type
    if (typeof body.employment_start_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.employment_start_date)) updates.employment_start_date = body.employment_start_date
    if (typeof body.is_competitive_coach === 'boolean') updates.is_competitive_coach = body.is_competitive_coach
    if (typeof body.license_type === 'string') updates.license_type = body.license_type.trim() || null
    if (typeof body.bio === 'string') updates.bio = body.bio.trim() || null
    if (typeof body.photo_url === 'string') updates.photo_url = body.photo_url.trim() || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Guncellenecek alan yok' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('staff')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Personel bulunamadi' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/staff/[id] PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamis' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { error } = await service
      .from('staff')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[franchise/staff/[id] DELETE]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
