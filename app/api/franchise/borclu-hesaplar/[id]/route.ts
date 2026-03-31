/**
 * GET /api/franchise/borclu-hesaplar/[id]
 * Sporcu bazlı borç detayı: ödeme kayıtları (tarih, tutar, durum, açıklama), toplam borç, son ödeme.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export type OdemeKaydi = {
  id: string
  tarih: string
  tutar: number
  durum: string
  aciklama: string
  due_date: string | null
  paid_date: string | null
  payment_type: string
}

export type BorcluDetayResponse = {
  sporcu: { id: string; ad: string; soyad: string; sube: string } | null
  toplamBorc: number
  sonOdeme: string | null
  kayitlar: OdemeKaydi[]
}

const empty: BorcluDetayResponse = { sporcu: null, toplamBorc: 0, sonOdeme: null, kayitlar: [] }

function statusLabel(s: string): string {
  switch (s) {
    case 'paid': return 'Ödendi'
    case 'pending': return 'Bekliyor'
    case 'overdue': return 'Gecikmiş'
    case 'cancelled': return 'İptal'
    case 'processing': return 'İşleniyor'
    default: return s
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: athleteId } = await params
    if (!athleteId) return NextResponse.json(empty)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(empty)

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json(empty)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json(empty)

    const service = createServiceClient(url, key)

    const { data: athlete } = await service
      .from('athletes')
      .select('id, name, surname, branch')
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .single()

    if (!athlete) return NextResponse.json(empty)

    const { data: payments } = await service
      .from('payments')
      .select('id, amount, status, due_date, paid_date, payment_type, notes, created_at')
      .eq('tenant_id', tenantId)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    let toplamGereken = 0
    let toplamOdenen = 0
    let sonOdeme: string | null = null

    const kayitlar: OdemeKaydi[] = (payments ?? []).map((p: Record<string, unknown>) => {
      const amount = Number(p.amount) || 0
      toplamGereken += amount
      const status = (p.status as string) ?? 'pending'
      if (status === 'paid') {
        toplamOdenen += amount
        const pd = p.paid_date as string | null
        if (pd && (!sonOdeme || pd > sonOdeme)) sonOdeme = pd
      }
      const tarih = (p.paid_date ?? p.due_date ?? p.created_at ?? '') as string
      const dueStr = p.due_date ? String(p.due_date).slice(0, 10) : ''
      const aciklama = [
        (p.payment_type as string) === 'aidat' ? 'Aidat' : (p.payment_type as string),
        dueStr,
        (p.notes as string) ?? '',
      ].filter(Boolean).join(' ') || '—'
      return {
        id: p.id as string,
        tarih: tarih ? tarih.slice(0, 10) : '—',
        tutar: amount,
        durum: statusLabel(status),
        aciklama,
        due_date: (p.due_date as string | null) ?? null,
        paid_date: (p.paid_date as string | null) ?? null,
        payment_type: (p.payment_type as string) ?? '—',
      }
    })

    const toplamBorc = Math.round((toplamGereken - toplamOdenen) * 100) / 100

    return NextResponse.json({
      sporcu: {
        id: athlete.id,
        ad: (athlete.name as string) ?? '',
        soyad: (athlete.surname as string) ?? '',
        sube: (athlete.branch as string) ?? '—',
      },
      toplamBorc,
      sonOdeme,
      kayitlar,
    })
  } catch (e) {
    console.error('[franchise/borclu-hesaplar/[id]]', e)
    return NextResponse.json(empty)
  }
}
