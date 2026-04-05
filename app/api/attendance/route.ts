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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ items: [], students: [], message: 'Tenant atanmamış' })

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const brans = searchParams.get('brans')

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date parametresi gerekli (YYYY-MM-DD)' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [], students: [] })

    const service = createServiceClient(url, key)

    let studentsQuery = service
      .from('athletes')
      .select('id, ad_soyad, brans')
      .eq('tenant_id', tenantId)
      .eq('status', 'aktif')
      .order('ad_soyad', { ascending: true })

    if (brans) {
      studentsQuery = studentsQuery.eq('brans', brans)
    }

    const { data: students, error: studentsError } = await studentsQuery

    if (studentsError) return NextResponse.json({ items: [], students: [] })

    const { data: attendanceRows, error: attError } = await service
      .from('student_attendance')
      .select('id, student_id, date, status, note, seans_dustu')
      .eq('tenant_id', tenantId)
      .eq('date', date)

    if (attError) return NextResponse.json({ items: [], students: students ?? [] })

    const attMap = new Map((attendanceRows ?? []).map((r: { student_id: string }) => [r.student_id, r]))
    const items = (students ?? []).map((s: { id: string; ad_soyad: string | null; brans: string | null }) => {
      const att = attMap.get(s.id) as unknown as { id: string; status: string; note: string | null; seans_dustu: boolean } | undefined
      return {
        student_id: s.id,
        ad_soyad: s.ad_soyad,
        brans: s.brans,
        attendance_id: att?.id,
        status: att?.status ?? 'katilmadi',
        note: att?.note ?? null,
        seans_dustu: att?.seans_dustu ?? false,
      }
    })

    return NextResponse.json({ items, students: students ?? [] })
  } catch (e) {
    console.error('[attendance GET]', e)
    return NextResponse.json({ items: [], students: [] })
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
    const records = body.records as Array<{ student_id: string; date: string; status: string; note?: string; seans_dustu?: boolean }>
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'records dizisi gerekli' }, { status: 400 })
    }

    const validStatuses = ['katildi', 'katilmadi', 'bildirimli_iptal']
    const rows = records.map((r) => ({
      tenant_id: tenantId,
      student_id: r.student_id,
      date: r.date,
      status: validStatuses.includes(r.status ?? '') ? r.status : 'katilmadi',
      note: typeof r.note === 'string' ? r.note.trim() : null,
      seans_dustu: r.status === 'katildi' ? true : (r.seans_dustu ?? false),
      noted_by: user.id,
    }))

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('student_attendance')
      .upsert(rows, { onConflict: 'tenant_id,student_id,date' })
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    for (const r of rows) {
      if (r.status === 'katildi' && r.seans_dustu) {
        const { data: sp } = await service
          .from('student_packages')
          .select('id, kalan_seans')
          .eq('tenant_id', tenantId)
          .eq('student_id', r.student_id)
          .eq('status', 'aktif')
          .gt('kalan_seans', 0)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (sp?.id) {
          await service
            .from('student_packages')
            .update({ kalan_seans: Math.max(0, (sp.kalan_seans ?? 0) - 1) })
            .eq('id', sp.id)
        }
      }
    }

    return NextResponse.json({ ok: true, count: data?.length ?? 0 })
  } catch (e) {
    console.error('[attendance POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
