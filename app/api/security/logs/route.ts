/**
 * GET /api/security/logs
 * security_logs tablosundan son logları döndürür.
 * Severity bazlı istatistikler ve 3 Duvar durum bilgisi dahil.
 */

import { NextResponse } from 'next/server'
import { getSecurityLogs } from '@/lib/db/security-logs'
import { FORBIDDEN_FOR_AI, REQUIRE_PATRON_APPROVAL } from '@/lib/security/patron-lock'
import { SIBER_GUVENLIK_KURALLARI } from '@/lib/security/siber-guvenlik'
import { requireDashboard } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireDashboard()
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? '100'), 500)

  const { data: logs, error } = await getSecurityLogs(limit)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  const safeData = logs ?? []

  // Severity bazlı sayılar
  const severityCounts: Record<string, number> = { sari: 0, turuncu: 0, kirmizi: 0, acil: 0 }
  let blockedCount = 0
  let allowedCount = 0

  for (const log of safeData) {
    const sev = log.severity as string
    if (sev in severityCounts) {
      severityCounts[sev] += 1
    }
    if (log.blocked) {
      blockedCount += 1
    } else {
      allowedCount += 1
    }
  }

  // Event type dağılımı
  const eventTypeCounts: Record<string, number> = {}
  for (const log of safeData) {
    eventTypeCounts[log.event_type] = (eventTypeCounts[log.event_type] || 0) + 1
  }

  // 3 Duvar sistemi durum özeti
  const duvarlar = {
    forbidden_zones: {
      name: 'Yasak Bölgeler (Forbidden Zones)',
      description: 'AI erişiminin tamamen engellendiği alanlar',
      aktif: true,
      kural_sayisi: FORBIDDEN_FOR_AI.length,
    },
    patron_lock: {
      name: 'Patron Kilidi (Patron Lock)',
      description: 'Patron onayı gerektiren hassas işlemler',
      aktif: true,
      kural_sayisi: REQUIRE_PATRON_APPROVAL.length,
    },
    siber_guvenlik: {
      name: 'Siber Güvenlik (7/24 İzleme)',
      description: '4 seviyeli alarm sistemi — bypass edilemez',
      aktif: true,
      kural_sayisi: SIBER_GUVENLIK_KURALLARI.AUDIT_KEYWORDS.length,
      alarm_seviyeleri: ['Sarı', 'Turuncu', 'Kırmızı', 'Acil'],
    },
  }

  return NextResponse.json({
    logs: safeData,
    stats: {
      toplam: safeData.length,
      engellenen: blockedCount,
      izin_verilen: allowedCount,
      severity: severityCounts,
      event_types: eventTypeCounts,
    },
    duvarlar,
  })
}
