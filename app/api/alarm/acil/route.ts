/**
 * POST /api/alarm/acil
 * Acil Destek Alarm Sistemi
 * 
 * Sistem hatasi veya guvenlik ihlali durumunda:
 *   - Patron'a email gonderir
 *   - Patron'a push bildirim gonderir
 *   - security_logs'a severity='acil' kaydeder
 * 
 * Body: { type: 'sistem_hatasi' | 'guvenlik_ihlali', message: string, details?: string, source?: string }
 * 
 * NOT: Dahili cagrilar (uc-duvar.ts) executeAcilAlarm() fonksiyonunu dogrudan
 * kullanir — bu endpoint sadece disaridan (patron oturumu ile) tetikleme icindir.
 * 
 * GET /api/alarm/acil
 * Son acil alarmlari listeler (patron dashboard banner icin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { requirePatron } from '@/lib/auth/api-auth'
import { executeAcilAlarm, type AcilAlarmType } from '@/lib/security/acil-alarm'

export const dynamic = 'force-dynamic'

const VALID_TYPES: AcilAlarmType[] = ['sistem_hatasi', 'guvenlik_ihlali']

// ─── POST: Acil alarm tetikle ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Yetki kontrolu: patron oturumu gerekli
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()

    const type = body.type as AcilAlarmType
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const details = typeof body.details === 'string' ? body.details.trim() : undefined
    const source = typeof body.source === 'string' ? body.source.trim() : 'bilinmiyor'

    // Validasyon
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Gecersiz alarm tipi. Gecerli tipler: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: 'message alani zorunludur.' },
        { status: 400 }
      )
    }

    // Cekirdek alarm mantigini calistir (lib/security/acil-alarm.ts)
    const result = await executeAcilAlarm({ type, message, details, source })

    return NextResponse.json(result)
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('[alarm/acil] Hata:', err)
    return NextResponse.json(
      { error: 'Acil alarm tetikleme hatasi', detail: err },
      { status: 500 }
    )
  }
}

// ─── GET: Son acil alarmlari listele (patron dashboard banner icin) ──────

export async function GET(req: NextRequest) {
  try {
    // Patron yetki kontrolu
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50)
    const spikeHours = Number(searchParams.get('hours')) || 24

    const db = getSupabaseServer()
    if (!db) {
      return NextResponse.json({ error: 'Supabase baglantisi yok' }, { status: 500 })
    }

    // Son X saat icindeki acil alarmlar
    const since = new Date(Date.now() - spikeHours * 60 * 60 * 1000).toISOString()

    const { data, error } = await db
      .from('security_logs')
      .select('id, event_type, severity, description, blocked, created_at')
      .eq('severity', 'acil')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const alarmlar = (data ?? []) as {
      id: string
      event_type: string
      severity: string
      description: string | null
      blocked: boolean
      created_at: string
    }[]

    return NextResponse.json({
      ok: true,
      acil_alarm_var: alarmlar.length > 0,
      toplam: alarmlar.length,
      alarmlar,
      kontrol_periyodu_saat: spikeHours,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: 'Acil alarm listesi hatasi', detail: err },
      { status: 500 }
    )
  }
}
