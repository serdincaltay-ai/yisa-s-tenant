/**
 * GET /api/veli/appointments/slots
 * Müsait randevu saatlerini döner (belirli tarih için)
 * Query: athlete_id, date (YYYY-MM-DD)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const DEFAULT_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00',
]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ slots: [] })

    const athleteId = req.nextUrl.searchParams.get('athlete_id')
    const date = req.nextUrl.searchParams.get('date')
    if (!athleteId || !date) return NextResponse.json({ slots: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ slots: [] })

    const service = createServiceClient(url, key)

    // Veli sahiplik kontrolü
    const { data: athlete } = await service
      .from('athletes')
      .select('id, tenant_id')
      .eq('id', athleteId)
      .eq('parent_user_id', user.id)
      .single()
    if (!athlete) return NextResponse.json({ slots: [] })

    // Dolu randevuları bul
    const { data: booked } = await service
      .from('appointments')
      .select('appointment_time')
      .eq('tenant_id', athlete.tenant_id)
      .eq('appointment_date', date)
      .in('status', ['bekliyor', 'onaylandi'])

    const bookedTimes = new Set(
      (booked ?? []).map((b: Record<string, unknown>) => {
        const t = String(b.appointment_time ?? '')
        return t.slice(0, 5) // "09:00:00" -> "09:00"
      })
    )

    // Müsait saatleri hesapla
    const slots = DEFAULT_SLOTS.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }))

    return NextResponse.json({ slots, date })
  } catch (e) {
    console.error('[veli/appointments/slots]', e)
    return NextResponse.json({ slots: [] })
  }
}
