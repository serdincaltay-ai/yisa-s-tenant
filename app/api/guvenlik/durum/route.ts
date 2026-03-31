/**
 * Güvenlik Dashboard API
 * GET: Güvenlik logları + 3 duvar durumu + alarm istatistikleri
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSecurityLogs } from '@/lib/db/security-logs'
import { ucDuvarDurumu } from '@/lib/security/uc-duvar'
import { requireDashboard } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireDashboard()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

    // Güvenlik logları
    const { data: logs, error: logsError } = await getSecurityLogs(limit)
    if (logsError) {
      return NextResponse.json({ error: logsError }, { status: 500 })
    }

    const logList = logs ?? []

    // Alarm istatistikleri
    const istatistikler = {
      toplam: logList.length,
      engellenen: logList.filter((l) => l.blocked).length,
      izin_verilen: logList.filter((l) => !l.blocked).length,
      seviye_dagilimi: {
        sari: logList.filter((l) => l.severity === 'sari').length,
        turuncu: logList.filter((l) => l.severity === 'turuncu').length,
        kirmizi: logList.filter((l) => l.severity === 'kirmizi').length,
        acil: logList.filter((l) => l.severity === 'acil').length,
      },
      olay_turleri: Object.entries(
        logList.reduce<Record<string, number>>((acc, l) => {
          acc[l.event_type] = (acc[l.event_type] || 0) + 1
          return acc
        }, {})
      ).map(([tur, sayi]) => ({ tur, sayi })).sort((a, b) => b.sayi - a.sayi),
    }

    // 3 Duvar durumu
    const duvarlar = ucDuvarDurumu()

    return NextResponse.json({
      ok: true,
      logs: logList,
      istatistikler,
      duvarlar,
      toplam_kural: duvarlar.reduce((acc, d) => acc + d.kural_sayisi, 0),
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Güvenlik dashboard hatası', detail: err }, { status: 500 })
  }
}
