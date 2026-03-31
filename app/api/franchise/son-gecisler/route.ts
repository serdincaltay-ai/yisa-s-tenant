/**
 * Franchise: son geçişler — attendance tablosundan son yoklama kayıtları (JOIN athletes)
 * Query: ?limit=10 (varsayılan 10)
 * Response: [{ id, sporcu_ad, sporcu_soyad, tarih, saat, ders_adi, yoklama_durumu }]
 * RLS: tenant_id filtresi (getTenantIdWithFallback).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export type SonGecisRow = {
  id: string
  sporcu_ad: string
  sporcu_soyad: string
  tarih: string
  saat: string
  ders_adi: string
  yoklama_durumu: 'geldi' | 'gelmedi' | 'izinli' | 'geç kaldı'
}

const emptyItems: SonGecisRow[] = []

function statusToYoklama(status: string | null): SonGecisRow['yoklama_durumu'] {
  switch (status) {
    case 'present':
      return 'geldi'
    case 'absent':
      return 'gelmedi'
    case 'excused':
      return 'izinli'
    case 'late':
      return 'geç kaldı'
    case 'penalized':
      return 'gelmedi'
    default:
      return 'geldi'
  }
}

function formatSaat(lessonTime: string | null, createdAt: string): string {
  if (lessonTime) return lessonTime.slice(0, 5)
  try {
    return new Date(createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(emptyItems)

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json(emptyItems)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json(emptyItems)

    const limitParam = req.nextUrl.searchParams.get('limit')
    const limit = Math.min(50, Math.max(1, Number(limitParam) || 10))

    const service = createServiceClient(url, key)
    const { data: rows } = await service
      .from('attendance')
      .select('id, lesson_date, lesson_time, status, created_at, athletes(name, surname)')
      .eq('tenant_id', tenantId)
      .order('lesson_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    type AthleteRaw = { name: string | null; surname: string | null } | null
    type Row = {
      id: string
      lesson_date: string
      lesson_time: string | null
      status: string | null
      created_at: string
      athletes?: AthleteRaw | AthleteRaw[]
    }

    const items: SonGecisRow[] = (rows ?? []).map((row: Row) => {
      const raw = row.athletes
      const a = Array.isArray(raw) ? raw[0] ?? null : raw ?? null
      const sporcu_ad = a?.name ?? ''
      const sporcu_soyad = a?.surname ?? ''
      const tarih = row.lesson_date
      const saat = formatSaat(row.lesson_time, row.created_at)
      const ders_adi = '—'
      const yoklama_durumu = statusToYoklama(row.status)
      return {
        id: row.id,
        sporcu_ad,
        sporcu_soyad,
        tarih,
        saat,
        ders_adi,
        yoklama_durumu,
      }
    })

    return NextResponse.json(items)
  } catch (e) {
    console.error('[franchise/son-gecisler]', e)
    return NextResponse.json(emptyItems)
  }
}
