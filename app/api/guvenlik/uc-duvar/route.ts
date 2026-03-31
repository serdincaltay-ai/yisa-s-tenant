/**
 * 3 Duvar Güvenlik API
 * POST: Mesaj/komut → 3 duvar kontrolü (yasak bölge + siber güvenlik + CELF denetim)
 * GET: 3 duvar sistemi genel durumu
 */

import { NextRequest, NextResponse } from 'next/server'
import { ucDuvarKontrol, ucDuvarDurumu } from '@/lib/security/uc-duvar'
import { createSecurityLog } from '@/lib/db/security-logs'
import type { DirectorKey } from '@/lib/robots/celf-center'
import { requireDashboard } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireDashboard()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const action = typeof body.action === 'string' ? body.action : undefined
    const directorKey = typeof body.director_key === 'string' ? (body.director_key as DirectorKey) : undefined
    const requiredData = Array.isArray(body.required_data) ? body.required_data : undefined
    const affectedData = Array.isArray(body.affected_data) ? body.affected_data : undefined

    if (!message) {
      return NextResponse.json({ error: 'message alanı gerekli.' }, { status: 400 })
    }

    const sonuc = ucDuvarKontrol({
      message,
      action,
      directorKey,
      requiredData,
      affectedData,
    })

    // Engellenen veya uyarılı işlemleri logla
    if (sonuc.sonuc === 'engellendi') {
      await createSecurityLog({
        event_type: 'uc_duvar_engel',
        severity: 'kirmizi',
        description: `3 Duvar engelledi: ${sonuc.engel_sebebi ?? 'Bilinmeyen sebep'}`,
        blocked: true,
      })
    } else if (sonuc.sonuc === 'uyari') {
      await createSecurityLog({
        event_type: 'uc_duvar_uyari',
        severity: 'turuncu',
        description: `3 Duvar uyarı: ${sonuc.uyarilar.join('; ')}`,
        blocked: false,
      })
    }

    return NextResponse.json({
      ok: true,
      ...sonuc,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: '3 Duvar kontrol hatası', detail: err }, { status: 500 })
  }
}

export async function GET() {
  try {
    const auth = await requireDashboard()
    if (auth instanceof NextResponse) return auth

    const durum = ucDuvarDurumu()
    return NextResponse.json({
      ok: true,
      duvarlar: durum,
      toplam_kural: durum.reduce((acc, d) => acc + d.kural_sayisi, 0),
      sistem_aktif: durum.every((d) => d.aktif),
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Duvar durumu hatası', detail: err }, { status: 500 })
  }
}
