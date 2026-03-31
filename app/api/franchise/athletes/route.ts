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
    const q = searchParams.get('q')?.trim()
    const status = searchParams.get('status')?.trim()
    const branch = searchParams.get('branch')?.trim()
    const branchId = searchParams.get('branch_id')?.trim()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    let query = service
      .from('athletes')
      .select('id, name, surname, birth_date, gender, branch, branch_id, level, "group", status, parent_name, parent_phone, parent_email, notes, trainer_id, created_at')
      .eq('tenant_id', tenantId)

    if (status && ['active', 'inactive', 'trial'].includes(status)) query = query.eq('status', status)
    if (branch) query = query.eq('branch', branch)
    if (branchId) query = query.eq('branch_id', branchId)
    if (q) {
      query = query.or(`name.ilike.%${q}%,surname.ilike.%${q}%`)
    }
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[franchise/athletes GET]', e)
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
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const surname = typeof body.surname === 'string' ? body.surname.trim() : null
    const birthDate = typeof body.birth_date === 'string' && body.birth_date ? body.birth_date : null
    const gender = typeof body.gender === 'string' && ['E', 'K', 'diger'].includes(body.gender) ? body.gender : null
    const branch = typeof body.branch === 'string' ? body.branch.trim() : null
    const level = typeof body.level === 'string' ? body.level.trim() : null
    const group = typeof body.group === 'string' ? body.group.trim() : null
    const parentName = typeof body.parent_name === 'string' ? body.parent_name.trim() : null
    const parentPhone = typeof body.parent_phone === 'string' ? body.parent_phone.trim() : null
    const parentEmail = typeof body.parent_email === 'string' ? body.parent_email.trim() : null
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null

    if (!name) return NextResponse.json({ error: 'Ad zorunludur' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    let parentUserId: string | null = null
    if (parentEmail) {
      try {
        const { data: listData } = await service.auth.admin.listUsers({ perPage: 500 })
        const users = listData?.users as unknown as Array<{ id: string; email?: string }> | undefined
        const u = users?.find((x) => (x.email ?? '').toLowerCase() === parentEmail.toLowerCase())
        if (u) parentUserId = u.id
      } catch (_) {}
    }

    const { data, error } = await service
      .from('athletes')
      .insert({
        tenant_id: tenantId,
        name,
        surname: surname || null,
        birth_date: birthDate || null,
        gender,
        branch: branch || null,
        branch_id: typeof body.branch_id === 'string' ? body.branch_id : null,
        level: level || null,
        group: group || null,
        status: 'active',
        parent_name: parentName || null,
        parent_phone: parentPhone || null,
        parent_email: parentEmail || null,
        parent_user_id: parentUserId,
        notes: notes || null,
      } as Record<string, unknown>)
      .select('id, name, surname, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, athlete: data })
  } catch (e) {
    console.error('[franchise/athletes POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
