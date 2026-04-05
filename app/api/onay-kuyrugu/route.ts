/**
 * Onay Kuyrugu API: Demo talep ozet istatistikleri + provisioning zincir durumu
 * demo_requests → tenants baglantisi
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Patron/owner rol kontrolu — sadece yetkili kullanicilar erisebilir
    const { data: userRole } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['tenant_owner', 'owner', 'patron'])
      .limit(1)
      .maybeSingle()
    if (!userRole) return NextResponse.json({ error: 'Yetki yok' }, { status: 403 })

    // Demo talep istatistikleri — sunucu tarafli count sorgulari (limit sorunu yok)
    const yediGunOnce = new Date()
    yediGunOnce.setDate(yediGunOnce.getDate() - 7)

    const [toplamRes, bekleyenRes, onaylananRes, reddedilenRes, sonHaftaRes, tenantCountRes] = await Promise.all([
      service.from('demo_requests').select('id', { count: 'exact', head: true }),
      service.from('demo_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      service.from('demo_requests').select('id', { count: 'exact', head: true }).eq('status', 'converted'),
      service.from('demo_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      service.from('demo_requests').select('id', { count: 'exact', head: true }).gte('created_at', yediGunOnce.toISOString()),
      service.from('tenants').select('id', { count: 'exact', head: true }),
    ])

    const toplam = toplamRes.count ?? 0
    const bekleyen = bekleyenRes.count ?? 0
    const onaylanan = onaylananRes.count ?? 0
    const reddedilen = reddedilenRes.count ?? 0
    const sonHafta = sonHaftaRes.count ?? 0
    const toplamTenant = tenantCountRes.count ?? 0

    // Kaynak dagilimi (son 200 kayit yeterli — gorsel dagitim icin)
    const { data: recentRequests } = await service
      .from('demo_requests')
      .select('source')
      .order('created_at', { ascending: false })
      .limit(200)

    const kaynakDagilimi: Record<string, number> = {}
    for (const r of recentRequests ?? []) {
      const src = (r as { source?: string }).source || 'bilinmeyen'
      kaynakDagilimi[src] = (kaynakDagilimi[src] || 0) + 1
    }

    return NextResponse.json({
      ozet: {
        toplam,
        bekleyen,
        onaylanan,
        reddedilen,
        sonHaftaTalep: sonHafta,
        toplamTenant,
      },
      kaynakDagilimi: Object.entries(kaynakDagilimi).map(([kaynak, sayi]) => ({ kaynak, sayi })),
    })
  } catch (e) {
    console.error('[onay-kuyrugu]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
