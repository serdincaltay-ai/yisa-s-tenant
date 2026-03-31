/**
 * Kayıt personeli: devam durumu raporu
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

    // Tüm sporcular
    const { data: athletes } = await service
      .from('athletes')
      .select('id, name, surname, branch')
      .eq('tenant_id', tenantId)

    const athleteList = athletes ?? []

    // Yoklama verileri
    const { data: attendance } = await service
      .from('attendance')
      .select('athlete_id, status')
      .eq('tenant_id', tenantId)

    const attendanceList = attendance ?? []

    // Sporcu bazlı gruplama
    const athleteAttendance = new Map<string, { present: number; total: number }>()
    for (const a of attendanceList) {
      const aid = (a as { athlete_id: string }).athlete_id
      const cur = athleteAttendance.get(aid) ?? { present: 0, total: 0 }
      cur.total++
      if ((a as { status: string }).status === 'present') cur.present++
      athleteAttendance.set(aid, cur)
    }

    const kayitlar = athleteList.map((a: { id: string; name: string; surname?: string; branch?: string }) => {
      const att = athleteAttendance.get(a.id) ?? { present: 0, total: 0 }
      return {
        id: a.id,
        ogrenci_adi: `${a.name} ${a.surname ?? ''}`.trim(),
        brans: a.branch ?? 'Genel',
        toplam_ders: att.total,
        katilim: att.present,
        devamsizlik: att.total - att.present,
        devam_orani: att.total > 0 ? Math.round((att.present / att.total) * 100) : 0,
      }
    })

    return NextResponse.json({ kayitlar })
  } catch (e) {
    console.error('[kayit/devam-raporu]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
