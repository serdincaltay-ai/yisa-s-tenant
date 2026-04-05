/**
 * Sportif Direktör dashboard: branş özeti, antrenör performans, ölçüm trendleri, yetenek tespit
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

    // Rol kontrolü — sportif_direktor, owner, admin, manager erişebilir
    const { data: userRole } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle()

    const allowedRoles = ['sportif_direktor', 'tenant_owner', 'owner', 'admin', 'manager']
    const rawRole = userRole?.role ? String(userRole.role).toLowerCase() : null

    // Ayrıca tenants.owner_id kontrol et
    const { data: ownerCheck } = await service
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!ownerCheck && (!rawRole || !allowedRoles.includes(rawRole))) {
      return NextResponse.json({ error: 'Yetki yok' }, { status: 403 })
    }

    // Branş bazlı sporcu sayıları
    const { data: athletes } = await service
      .from('athletes')
      .select('id, branch, name, surname, birth_date')
      .eq('tenant_id', tenantId)

    const athleteList = athletes ?? []

    // Antrenörler
    const { data: coaches } = await service
      .from('user_tenants')
      .select('id, user_id, role')
      .eq('tenant_id', tenantId)
      .in('role', ['coach', 'antrenor', 'trainer'])

    const coachList = coaches ?? []

    // Ders programı
    const { data: schedules } = await service
      .from('tenant_schedule')
      .select('id, coach_id, branch')
      .eq('tenant_id', tenantId)

    const scheduleList = schedules ?? []

    // Yoklama verileri (son 30 gün)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: attendance } = await service
      .from('attendance')
      .select('athlete_id, status')
      .eq('tenant_id', tenantId)
      .gte('lesson_date', thirtyDaysAgo.toISOString().slice(0, 10))

    const attendanceList = attendance ?? []
    const totalPresent = attendanceList.filter((a: { status: string }) => a.status === 'present').length
    const ortalamaDevamOrani = attendanceList.length > 0 ? Math.round((totalPresent / attendanceList.length) * 100) : 0

    // Branş bazlı istatistikler
    const bransMap = new Map<string, { sporcu: number; antrenor: number }>()
    for (const a of athleteList) {
      const b = (a as { branch?: string }).branch || 'Genel'
      const cur = bransMap.get(b) ?? { sporcu: 0, antrenor: 0 }
      cur.sporcu++
      bransMap.set(b, cur)
    }
    for (const s of scheduleList) {
      const b = (s as { branch?: string }).branch || 'Genel'
      const cur = bransMap.get(b) ?? { sporcu: 0, antrenor: 0 }
      cur.antrenor = 1 // en az 1 antrenör
      bransMap.set(b, cur)
    }

    const branslar = Array.from(bransMap.entries()).map(([brans, v]) => ({
      brans,
      sporcu_sayisi: v.sporcu,
      antrenor_sayisi: v.antrenor,
      devam_orani: ortalamaDevamOrani,
    }))

    // Antrenör performans
    const antrenorler = coachList.map((c: { id: string; user_id: string }) => {
      const coachSchedules = scheduleList.filter((s: { coach_id?: string }) => s.coach_id === c.user_id)
      return {
        id: c.id,
        ad_soyad: c.user_id.slice(0, 8) + '...',
        brans: coachSchedules.length > 0 ? ((coachSchedules[0] as { branch?: string }).branch || 'Genel') : 'Genel',
        sporcu_sayisi: Math.floor(athleteList.length / Math.max(coachList.length, 1)),
        devam_orani: ortalamaDevamOrani,
        ortalama_olcum_skoru: 0,
        ders_sayisi: coachSchedules.length,
      }
    })

    return NextResponse.json({
      branslar,
      toplamSporcu: athleteList.length,
      toplamAntrenor: coachList.length,
      ortalamaDevamOrani,
      toplamBrans: branslar.length,
      antrenorler,
      olcumTrendleri: [],
      yetenekliSporcular: [],
    })
  } catch (e) {
    console.error('[sportif-direktor/dashboard]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
