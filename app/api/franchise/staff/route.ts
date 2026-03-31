import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getTenantId(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const service = createServiceClient(url, key)

  const { data: ut } = await service
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (ut?.tenant_id) return ut.tenant_id

  const { data: t } = await service
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()
  return t?.id ?? null
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ items: [], message: 'Tenant atanmamış' })

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role')?.trim()
    const branchIdFilter = searchParams.get('branch_id')?.trim()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    let query = service
      .from('staff')
      .select('id, name, surname, email, phone, role, branch, branch_id, is_active, created_at, birth_date, address, city, district, previous_work, chronic_condition, has_driving_license, languages, employment_type, employment_start_date, is_competitive_coach, license_type, bio, photo_url, user_id')
      .eq('tenant_id', tenantId)
    if (roleFilter && ['admin', 'manager', 'trainer', 'receptionist', 'other', 'cleaning'].includes(roleFilter)) {
      query = query.eq('role', roleFilter)
    }
    if (branchIdFilter) {
      query = query.eq('branch_id', branchIdFilter)
    }
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[franchise/staff GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const surname = typeof body.surname === 'string' ? body.surname.trim() : null
    const email = typeof body.email === 'string' ? body.email.trim() : null
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null
    const role = typeof body.role === 'string' && ['admin', 'manager', 'trainer', 'receptionist', 'other', 'cleaning'].includes(body.role)
      ? body.role
      : 'trainer'
    const branch = typeof body.branch === 'string' ? body.branch.trim() : null
    const birth_date = body.birth_date && /^\d{4}-\d{2}-\d{2}$/.test(String(body.birth_date)) ? body.birth_date : null
    const address = typeof body.address === 'string' ? body.address.trim() : null
    const city = typeof body.city === 'string' ? body.city.trim() : null
    const district = typeof body.district === 'string' ? body.district.trim() : null
    const previous_work = typeof body.previous_work === 'string' ? body.previous_work.trim() : null
    const chronic_condition = typeof body.chronic_condition === 'string' ? body.chronic_condition.trim() : null
    const has_driving_license = typeof body.has_driving_license === 'boolean' ? body.has_driving_license : (body.has_driving_license === true || body.has_driving_license === 'true' || body.has_driving_license === '1')
    const languages = typeof body.languages === 'string' ? body.languages.trim() : null
    const employment_type = typeof body.employment_type === 'string' && ['full_time', 'part_time', 'intern'].includes(body.employment_type) ? body.employment_type : 'full_time'
    const employment_start_date = body.employment_start_date && /^\d{4}-\d{2}-\d{2}$/.test(String(body.employment_start_date)) ? body.employment_start_date : null
    const is_competitive_coach = typeof body.is_competitive_coach === 'boolean' ? body.is_competitive_coach : (body.is_competitive_coach === true || body.is_competitive_coach === 'true' || body.is_competitive_coach === '1')
    const license_type = typeof body.license_type === 'string' ? body.license_type.trim() : null
    const bio = typeof body.bio === 'string' ? body.bio.trim() : null
    const photo_url = typeof body.photo_url === 'string' ? body.photo_url.trim() : null

    if (!name) return NextResponse.json({ error: 'Ad zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('staff')
      .insert({
        tenant_id: tenantId,
        name,
        surname: surname || null,
        email: email || null,
        phone: phone || null,
        role,
        branch: branch || null,
        branch_id: typeof body.branch_id === 'string' ? body.branch_id : null,
        is_active: true,
        birth_date: birth_date || null,
        address: address || null,
        city: city || null,
        district: district || null,
        previous_work: previous_work || null,
        chronic_condition: chronic_condition || null,
        has_driving_license: has_driving_license ?? null,
        languages: languages || null,
        employment_type,
        employment_start_date: employment_start_date || null,
        is_competitive_coach: is_competitive_coach ?? false,
        license_type: license_type || null,
        bio: bio || null,
        photo_url: photo_url || null,
      })
      .select('id, name, surname, role, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, staff: data })
  } catch (e) {
    console.error('[franchise/staff POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
