import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/** Antrenör izin talebi oluşturur (staff_leave_requests). */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const { data: staff } = await service.from('staff').select('id').eq('user_id', user.id).eq('role', 'trainer').maybeSingle()
    if (!staff) return NextResponse.json({ error: 'Profil kaydı bulunamadı' }, { status: 404 })

    const body = (await req.json()) as { leave_date?: string; reason?: string }
    const leave_date = typeof body.leave_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.leave_date) ? body.leave_date : null
    if (!leave_date) return NextResponse.json({ error: 'Geçerli tarih gerekli (YYYY-MM-DD)' }, { status: 400 })
    const reason = typeof body.reason === 'string' ? body.reason.trim() : null

    const { data, error } = await service
      .from('staff_leave_requests')
      .insert({ staff_id: staff.id, leave_date, reason })
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[antrenor/leave-request POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
