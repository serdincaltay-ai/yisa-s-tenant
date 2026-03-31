/**
 * GET /api/notifications/preferences — Bildirim tercihlerini getir
 * POST /api/notifications/preferences — Bildirim tercihlerini güncelle
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from '@/lib/db/push-subscriptions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { data, error } = await getNotificationPreferences(auth.user.id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, preferences: data })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Tercih getirme hatası', detail: err }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()

    const yoklama = body.yoklama_sonucu !== false
    const odeme = body.odeme_hatirlatma !== false
    const duyuru = body.duyuru !== false
    const haftalikRapor = body.haftalik_rapor !== false

    const result = await upsertNotificationPreferences({
      user_id: auth.user.id,
      yoklama_sonucu: yoklama,
      odeme_hatirlatma: odeme,
      duyuru: duyuru,
      haftalik_rapor: haftalikRapor,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      preferences: { yoklama_sonucu: yoklama, odeme_hatirlatma: odeme, duyuru: duyuru, haftalik_rapor: haftalikRapor },
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Tercih güncelleme hatası', detail: err }, { status: 500 })
  }
}
