/**
 * GET /api/veli/movements/havuz
 * Branş bazlı hareket havuzu — tüm hareketler + sporcunun ilerlemesi
 * Query: athlete_id (zorunlu)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ movements: [], athleteProgress: [] })

    const athleteId = req.nextUrl.searchParams.get('athlete_id')
    if (!athleteId) return NextResponse.json({ movements: [], athleteProgress: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ movements: [], athleteProgress: [] })

    const service = createServiceClient(url, key)

    // Veli sahiplik kontrolü
    const { data: athlete } = await service
      .from('athletes')
      .select('id, tenant_id, branch')
      .eq('id', athleteId)
      .eq('parent_user_id', user.id)
      .single()
    if (!athlete) return NextResponse.json({ movements: [], athleteProgress: [] })

    const branch = athlete.branch ?? ''

    // 1) Branş hareketlerini getir (genel + tenant'a özel)
    let movements: Record<string, unknown>[] = []
    try {
      const { data } = await service
        .from('branch_movements')
        .select('id, branch, name, description, video_url, image_url, duration_seconds, repetitions, difficulty, sort_order')
        .eq('branch', branch)
        .eq('is_active', true)
        .or(`tenant_id.is.null,tenant_id.eq.${athlete.tenant_id}`)
        .order('sort_order', { ascending: true })
      movements = data ?? []
    } catch {
      // Tablo yoksa sessiz geç
    }

    // 2) Sporcunun ilerleme durumunu getir
    let athleteProgress: Record<string, unknown>[] = []
    try {
      const { data } = await service
        .from('athlete_movements')
        .select('id, movement_id, branch_movement_id, tamamlandi, tamamlanma_tarihi, antrenor_notu, ilerleme, tekrar_sayisi, son_calisma_tarihi, created_at')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })
      athleteProgress = data ?? []
    } catch {
      // Tablo yoksa sessiz geç
    }

    // Hareketleri ilerlemeyle birleştir
    const result = movements.map((m) => {
      const mid = String(m.id)
      const progress = athleteProgress.find(
        (p) => String(p.branch_movement_id) === mid || String(p.movement_id) === mid
      )
      return {
        id: mid,
        name: String(m.name ?? ''),
        description: String(m.description ?? ''),
        video_url: m.video_url ? String(m.video_url) : null,
        image_url: m.image_url ? String(m.image_url) : null,
        duration_seconds: m.duration_seconds ? Number(m.duration_seconds) : null,
        repetitions: m.repetitions ? Number(m.repetitions) : null,
        difficulty: String(m.difficulty ?? 'orta'),
        tamamlandi: progress ? Boolean(progress.tamamlandi) : false,
        tamamlanma_tarihi: progress?.tamamlanma_tarihi ? String(progress.tamamlanma_tarihi) : null,
        ilerleme: progress ? Number(progress.ilerleme ?? 0) : 0,
        tekrar_sayisi: progress ? Number(progress.tekrar_sayisi ?? 0) : 0,
        son_calisma_tarihi: progress?.son_calisma_tarihi ? String(progress.son_calisma_tarihi) : null,
        antrenor_notu: progress?.antrenor_notu ? String(progress.antrenor_notu) : null,
      }
    })

    return NextResponse.json({ movements: result, branch })
  } catch (e) {
    console.error('[veli/movements/havuz]', e)
    return NextResponse.json({ movements: [], athleteProgress: [] })
  }
}
