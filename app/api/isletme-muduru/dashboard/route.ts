/**
 * İşletme Müdürü dashboard: tesis istatistikleri, personel, finans, salon durumları
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

const ROL_LABELS: Record<string, string> = {
  tenant_owner: 'Tesis Sahibi',
  owner: 'Tesis Sahibi',
  admin: 'Yönetici',
  manager: 'Müdür',
  tesis_muduru: 'Tesis İşletme Müdürü',
  isletme_muduru: 'İşletme Müdürü',
  sportif_direktor: 'Sportif Direktör',
  coach: 'Antrenör',
  antrenor: 'Antrenör',
  trainer: 'Antrenör',
  kasa: 'Kasa / Kayıt',
  receptionist: 'Kayıt Personeli',
  kayit_gorevlisi: 'Kayıt Görevlisi',
  cleaning: 'Temizlik',
  temizlik: 'Temizlik',
}

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

    // Rol kontrolü
    const { data: userRole } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle()

    const allowedRoles = ['tesis_muduru', 'isletme_muduru', 'manager', 'tenant_owner', 'owner', 'admin']
    const rawRole = userRole?.role ? String(userRole.role).toLowerCase() : null

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

    const ayBaslangic = new Date()
    ayBaslangic.setDate(1)
    const ayStr = ayBaslangic.toISOString().slice(0, 10)

    const [athletesRes, personnelRes, schedulesRes, paymentsRes, attendanceRes, expensesRes] = await Promise.all([
      service.from('athletes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      service.from('user_tenants').select('id, user_id, role, created_at').eq('tenant_id', tenantId),
      service.from('tenant_schedule').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      service.from('payments').select('id, amount, status, created_at, description').eq('tenant_id', tenantId).gte('created_at', ayStr),
      service.from('attendance').select('status').eq('tenant_id', tenantId).gte('lesson_date', ayStr),
      service.from('recurring_expenses').select('amount').eq('tenant_id', tenantId).eq('is_active', true),
    ])

    const toplamSporcu = athletesRes.count ?? 0
    const toplamPersonel = personnelRes.data?.length ?? 0
    const toplamAntrenor = (personnelRes.data ?? []).filter(
      (p: { role: string }) => ['coach', 'antrenor', 'trainer'].includes(String(p.role).toLowerCase())
    ).length
    const aktifDersSayisi = schedulesRes.count ?? 0

    const odemeler = paymentsRes.data ?? []
    const aylikGelir = odemeler
      .filter((p: { status: string }) => p.status === 'paid' || p.status === 'completed')
      .reduce((s: number, p: { amount: number }) => s + (Number(p.amount) || 0), 0)
    const bekleyenOdemeler = odemeler.filter((p: { status: string }) => p.status === 'pending').length

    const aylikGider = (expensesRes.data ?? []).reduce(
      (s: number, e: { amount: number }) => s + (Number(e.amount) || 0), 0
    )

    const toplamOdeme = odemeler.length
    const odenmis = odemeler.filter((p: { status: string }) => p.status === 'paid' || p.status === 'completed').length
    const tahsilOrani = toplamOdeme > 0 ? Math.round((odenmis / toplamOdeme) * 100) : 0

    const yoklamalar = attendanceRes.data ?? []
    const geldi = yoklamalar.filter((a: { status: string }) => a.status === 'present').length
    const devamOrani = yoklamalar.length > 0 ? Math.round((geldi / yoklamalar.length) * 100) : 0

    // Personel listesi
    const personeller = (personnelRes.data ?? []).map((p: { id: string; user_id: string; role: string; created_at: string }) => ({
      id: p.id,
      ad_soyad: p.user_id.slice(0, 8) + '...',
      email: '',
      rol: p.role,
      rol_label: ROL_LABELS[String(p.role).toLowerCase()] ?? p.role,
      durum: 'aktif' as const,
      baslama_tarihi: p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR') : '—',
    }))

    // Son ödemeler
    const sonOdemeler = odemeler.slice(0, 10).map((o: { id: string; amount: number; status: string; created_at: string; description?: string }) => ({
      id: o.id,
      aciklama: (o as { description?: string }).description || 'Aidat ödemesi',
      tutar: Number(o.amount) || 0,
      tarih: o.created_at ? new Date(o.created_at).toLocaleDateString('tr-TR') : '—',
      durum: o.status,
    }))

    // Son etkinlikler
    const { data: sonYoklamalar } = await service
      .from('attendance')
      .select('id, lesson_date, status')
      .eq('tenant_id', tenantId)
      .order('lesson_date', { ascending: false })
      .limit(5)

    const sonEtkinlikler = (sonYoklamalar ?? []).map((y: { id: string; lesson_date: string; status: string }) => ({
      id: y.id,
      baslik: `Yoklama: ${y.status === 'present' ? 'Geldi' : y.status === 'excused' ? 'İzinli' : 'Gelmedi'}`,
      tarih: y.lesson_date,
      tip: 'Yoklama',
    }))

    return NextResponse.json({
      toplamSporcu,
      toplamAntrenor,
      toplamPersonel,
      aktifDersSayisi,
      aylikGelir,
      aylikGider,
      devamOrani,
      bekleyenOdemeler,
      dolulukOrani: 0,
      tahsilOrani,
      sonEtkinlikler,
      personeller,
      sonOdemeler,
      salonlar: [],
    })
  } catch (e) {
    console.error('[isletme-muduru/dashboard]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
