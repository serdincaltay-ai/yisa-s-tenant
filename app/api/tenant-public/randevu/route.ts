/**
 * Tenant Public — Ölçüm Randevu API
 * GET: Müsait randevu saatlerini listele (tenant_schedule'dan boş slotları bul)
 * POST: Yeni ölçüm randevusu oluştur (measurement_appointments tablosu)
 * Auth gerekmez (veli henüz giriş yapmamış olabilir).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/* ─── Rate limiter (POST için) ─── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

/* ─── Service client helper (service role zorunlu — anon key'e düşmez) ─── */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/* ─── Gün adı → JS Date day offset ─── */
const GUN_OFFSET: Record<string, number> = {
  Pazartesi: 1,
  Sali: 2,
  Carsamba: 3,
  Persembe: 4,
  Cuma: 5,
  Cumartesi: 6,
  Pazar: 0,
}

/**
 * GET — Gelecek 14 günün müsait randevu slotlarını döndür.
 * tenant_schedule tablosundan ders slotları alınır,
 * measurement_appointments tablosundan dolu slotlar çıkarılır.
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId =
      req.headers.get('x-tenant-id')?.trim() ??
      req.nextUrl.searchParams.get('tenant_id')?.trim() ??
      ''
    if (!tenantId || !/^[0-9a-f-]{36}$/i.test(tenantId)) {
      return NextResponse.json({ error: 'Geçersiz tenant' }, { status: 400 })
    }

    const service = getServiceClient()
    if (!service) {
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }

    // Tenant ders programını al
    const { data: schedule } = await service
      .from('tenant_schedule')
      .select('gun, saat')
      .eq('tenant_id', tenantId)

    if (!schedule || schedule.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Gelecek 14 günü oluştur
    const today = new Date()
    const slots: { date: string; time: string; label: string }[] = []

    for (let d = 1; d <= 14; d++) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      // UTC tutarlılık: dateStr toISOString'den geldiği için gün de UTC olmalı
      const dateStr = date.toISOString().split('T')[0]
      const jsDay = date.getUTCDay()

      for (const item of schedule) {
        const gunNum = GUN_OFFSET[item.gun as string]
        if (gunNum === undefined || gunNum !== jsDay) continue
        const saat = typeof item.saat === 'string' ? item.saat : '09:00'
        const dayLabel = date.toLocaleDateString('tr-TR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
        slots.push({
          date: dateStr,
          time: saat,
          label: `${dayLabel} — ${saat}`,
        })
      }
    }

    // Dolu randevuları çıkar
    if (slots.length > 0) {
      const minDate = slots[0].date
      const maxDate = slots[slots.length - 1].date
      const { data: existing } = await service
        .from('measurement_appointments')
        .select('scheduled_at')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', `${minDate}T00:00:00`)
        .lte('scheduled_at', `${maxDate}T23:59:59`)

      if (existing && existing.length > 0) {
        const takenSet = new Set(
          existing.map((e) => {
            const dt = new Date(e.scheduled_at as string)
            const d = dt.toISOString().split('T')[0]
            const h = dt.toISOString().split('T')[1].slice(0, 5)
            return `${d}|${h}`
          }),
        )
        const available = slots.filter((s) => !takenSet.has(`${s.date}|${s.time}`))
        return NextResponse.json({ slots: available })
      }
    }

    return NextResponse.json({ slots })
  } catch (e) {
    console.error('[tenant-public/randevu GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * POST — Yeni ölçüm randevusu oluştur.
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen bir dakika bekleyin.' },
        { status: 429 },
      )
    }

    const body = await req.json()

    const tenantId =
      req.headers.get('x-tenant-id')?.trim() ??
      (typeof body.tenant_id === 'string' ? body.tenant_id.trim() : '')
    if (!tenantId || !/^[0-9a-f-]{36}$/i.test(tenantId)) {
      return NextResponse.json({ error: 'Geçersiz tenant' }, { status: 400 })
    }

    const scheduledAt = typeof body.scheduled_at === 'string' ? body.scheduled_at : ''
    if (!scheduledAt) {
      return NextResponse.json({ error: 'Randevu zamanı zorunludur' }, { status: 400 })
    }

    // 1) Tarih formatı kontrolü — string'den doğrudan parse et (TZ dönüşümü yok)
    // Client "YYYY-MM-DDTHH:MM:00" formatında gönderir (GET'ten gelen UTC date + schedule saat)
    const [datePart, timePart] = scheduledAt.split('T')
    const reqTime = timePart?.slice(0, 5) ?? '' // "HH:MM"
    if (!datePart || !reqTime || !/^\d{4}-\d{2}-\d{2}$/.test(datePart) || !/^\d{2}:\d{2}$/.test(reqTime)) {
      return NextResponse.json({ error: 'Geçersiz tarih formatı' }, { status: 400 })
    }

    // Geçmiş tarih kontrolü — UTC olarak karşılaştır (GET dateStr toISOString'den gelir)
    const scheduledUtc = new Date(`${datePart}T${reqTime}:00Z`)
    if (isNaN(scheduledUtc.getTime())) {
      return NextResponse.json({ error: 'Geçersiz tarih formatı' }, { status: 400 })
    }
    if (scheduledUtc.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Geçmiş tarihli randevu oluşturulamaz' }, { status: 400 })
    }

    // Gün: UTC olarak hesapla — GET de dateStr'yi toISOString() ile üretir
    const reqDay = scheduledUtc.getUTCDay() // 0=Pazar, 1=Pazartesi...

    const athleteId =
      typeof body.athlete_id === 'string' && /^[0-9a-f-]{36}$/i.test(body.athlete_id)
        ? body.athlete_id
        : null
    const parentName = typeof body.parent_name === 'string' ? body.parent_name.trim() : null
    const parentPhone = typeof body.parent_phone === 'string' ? body.parent_phone.trim() : null
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null
    const durationMinutes =
      typeof body.duration_minutes === 'number' && body.duration_minutes > 0
        ? body.duration_minutes
        : 30

    const service = getServiceClient()
    if (!service) {
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }

    // 2) Slotun tenant programında gerçekten var olduğunu doğrula
    const { data: schedule } = await service
      .from('tenant_schedule')
      .select('gun, saat')
      .eq('tenant_id', tenantId)

    if (!schedule || schedule.length === 0) {
      return NextResponse.json({ error: 'Bu tenant için program bulunamadı' }, { status: 400 })
    }

    const slotValid = schedule.some((item) => {
      const gunNum = GUN_OFFSET[item.gun as string]
      const saat = typeof item.saat === 'string' ? item.saat : ''
      return gunNum === reqDay && saat === reqTime
    })
    if (!slotValid) {
      return NextResponse.json(
        { error: 'Seçilen zaman dilimi programda mevcut değil' },
        { status: 400 },
      )
    }

    // 3) Aynı slot için mevcut randevu kontrolü (çift rezervasyon önleme)
    const { data: existingAppt } = await service
      .from('measurement_appointments')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('scheduled_at', `${datePart}T${reqTime}:00`)
      .in('status', ['pending', 'confirmed'])
      .limit(1)

    if (existingAppt && existingAppt.length > 0) {
      return NextResponse.json(
        { error: 'Bu zaman dilimi zaten dolu. Lütfen başka bir saat seçin.' },
        { status: 409 },
      )
    }

    // Insert — scheduled_at'i UTC olarak kaydet (Z suffix ile)
    const { data, error } = await service
      .from('measurement_appointments')
      .insert({
        tenant_id: tenantId,
        athlete_id: athleteId,
        scheduled_at: `${datePart}T${reqTime}:00+00`,
        duration_minutes: durationMinutes,
        status: 'pending',
        notes,
        parent_name: parentName,
        parent_phone: parentPhone,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[tenant-public/randevu POST]', error)
      return NextResponse.json({ error: 'Randevu oluşturulamadı' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, appointment_id: data?.id })
  } catch (e) {
    console.error('[tenant-public/randevu POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
