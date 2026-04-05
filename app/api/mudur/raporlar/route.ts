/**
 * Mudur raporlar: sporcu, yoklama, gelir istatistikleri
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
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamis' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Mudur/owner rol kontrolu — sadece yetkili kullanicilar erisebilir
    const { data: userRole } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .in('role', ['tenant_owner', 'owner', 'manager'])
      .limit(1)
      .maybeSingle()
    if (!userRole) return NextResponse.json({ error: 'Yetki yok' }, { status: 403 })

    // Brans bazli sporcu dagilimi
    const { data: athletes } = await service
      .from('athletes')
      .select('branch, status')
      .eq('tenant_id', tenantId)

    const bransDagilimi: Record<string, number> = {}
    const durumDagilimi: Record<string, number> = {}
    for (const a of athletes ?? []) {
      const b = (a as { branch?: string }).branch || 'Belirtilmemis'
      const s = (a as { status?: string }).status || 'active'
      bransDagilimi[b] = (bransDagilimi[b] || 0) + 1
      durumDagilimi[s] = (durumDagilimi[s] || 0) + 1
    }

    // Aylik yoklama ozeti (son 6 ay)
    const altiAyOnce = new Date()
    altiAyOnce.setMonth(altiAyOnce.getMonth() - 6)
    const { data: yoklamalar } = await service
      .from('attendance')
      .select('lesson_date, status')
      .eq('tenant_id', tenantId)
      .gte('lesson_date', altiAyOnce.toISOString().slice(0, 10))

    const aylikYoklama: Record<string, { geldi: number; gelmedi: number; toplam: number }> = {}
    for (const y of yoklamalar ?? []) {
      const ay = (y as { lesson_date: string }).lesson_date.slice(0, 7)
      if (!aylikYoklama[ay]) aylikYoklama[ay] = { geldi: 0, gelmedi: 0, toplam: 0 }
      aylikYoklama[ay].toplam++
      if ((y as { status: string }).status === 'present') aylikYoklama[ay].geldi++
      else aylikYoklama[ay].gelmedi++
    }

    // Aylik gelir ozeti
    const { data: odemeler } = await service
      .from('payments')
      .select('amount, status, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', altiAyOnce.toISOString())

    const aylikGelir: Record<string, number> = {}
    for (const p of odemeler ?? []) {
      const rec = p as { amount: number; status: string; created_at: string }
      if (rec.status === 'paid' || rec.status === 'completed') {
        const ay = rec.created_at.slice(0, 7)
        aylikGelir[ay] = (aylikGelir[ay] || 0) + (Number(rec.amount) || 0)
      }
    }

    return NextResponse.json({
      bransDagilimi: Object.entries(bransDagilimi).map(([brans, sayi]) => ({ brans, sayi })),
      durumDagilimi: Object.entries(durumDagilimi).map(([durum, sayi]) => ({ durum, sayi })),
      aylikYoklama: Object.entries(aylikYoklama)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ay, v]) => ({ ay, ...v })),
      aylikGelir: Object.entries(aylikGelir)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ay, tutar]) => ({ ay, tutar })),
    })
  } catch (e) {
    console.error('[mudur/raporlar]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
