/**
 * Kayıt personeli: veli iletişim bilgileri
 */

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
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Sporcu verileri (veli bilgileri dahil)
    const { data: athletes } = await service
      .from('athletes')
      .select('id, name, surname, branch, parent_name, parent_phone, parent_email')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    const veliler = (athletes ?? []).map((a: {
      id: string
      name: string
      surname?: string
      branch?: string
      parent_name?: string
      parent_phone?: string
      parent_email?: string
    }) => ({
      id: a.id,
      veli_adi: a.parent_name ?? '—',
      telefon: a.parent_phone ?? '',
      email: a.parent_email ?? '',
      ogrenci_adi: `${a.name} ${a.surname ?? ''}`.trim(),
      brans: a.branch ?? '',
    }))

    return NextResponse.json({ veliler })
  } catch (e) {
    console.error('[kayit/veli-iletisim]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
