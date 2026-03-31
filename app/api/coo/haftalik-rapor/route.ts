/**
 * GET /api/coo/haftalik-rapor
 * Cron ile her Pazartesi 09:00 UTC çağrılır (vercel.json).
 * Son 7 günün yoklama + ödeme + gelişim özetini velilere email + push ile gönderir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  sendPushNotification,
  type PushSubscriptionData,
} from '@/lib/notifications/web-push'
import { sendEmail } from '@/lib/email/resend'
import { requireCronOrPatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ─── Tipler ──────────────────────────────────────────────────────────────────

interface AthleteRow {
  id: string
  name: string
  surname: string | null
  parent_user_id: string | null
  parent_email: string | null
  parent_name: string | null
  tenant_id: string
  branch: string | null
}

interface AttendanceRow {
  athlete_id: string
  status: string
  date: string
}

interface PaymentRow {
  athlete_id: string
  amount: number
  status: string
  due_date: string
}

interface SubscriptionRow {
  user_id: string
  endpoint: string
  keys_p256dh: string
  keys_auth: string
}

interface RaporOzet {
  sporcu: AthleteRow
  yoklamaOzeti: { toplam: number; katildi: number; gelmedi: number; izinli: number }
  odemeOzeti: { bekleyen: number; odenmis: number; toplamTutar: number }
}

// ─── Ana handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await requireCronOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    }

    const service = createServiceClient(url, key)

    // Son 7 gün tarih aralığı
    const bugun = new Date()
    const yediGunOnce = new Date(bugun)
    yediGunOnce.setDate(yediGunOnce.getDate() - 7)
    const baslangicStr = yediGunOnce.toISOString().slice(0, 10)
    const bitisStr = bugun.toISOString().slice(0, 10)

    // Veli bağlantısı olan tüm sporcuları getir
    const { data: athletes, error: athErr } = await service
      .from('athletes')
      .select('id, name, surname, parent_user_id, parent_email, parent_name, tenant_id, branch')
      .not('parent_user_id', 'is', null)

    if (athErr) {
      console.error('[haftalik-rapor] Sporcu sorgu hatası:', athErr.message)
      return NextResponse.json({ error: athErr.message }, { status: 500 })
    }

    if (!athletes || athletes.length === 0) {
      return NextResponse.json({ ok: true, gonderilen: 0, mesaj: 'Veli bağlantılı sporcu yok' })
    }

    const typedAthletes = athletes as AthleteRow[]
    const athleteIds = typedAthletes.map((a) => a.id)

    // Son 7 gün yoklama verileri
    const { data: attendanceData } = await service
      .from('attendance')
      .select('athlete_id, status, date')
      .in('athlete_id', athleteIds)
      .gte('date', baslangicStr)
      .lte('date', bitisStr)

    const typedAttendance = (attendanceData ?? []) as AttendanceRow[]

    // Son 7 gün ödeme verileri
    const { data: paymentData } = await service
      .from('payments')
      .select('athlete_id, amount, status, due_date')
      .in('athlete_id', athleteIds)
      .gte('due_date', baslangicStr)
      .lte('due_date', bitisStr)

    const typedPayments = (paymentData ?? []) as PaymentRow[]

    // Sporcu bazında özet oluştur
    const raporlar: RaporOzet[] = typedAthletes.map((sporcu) => {
      const yoklamalar = typedAttendance.filter((y) => y.athlete_id === sporcu.id)
      const odemeler = typedPayments.filter((o) => o.athlete_id === sporcu.id)

      return {
        sporcu,
        yoklamaOzeti: {
          toplam: yoklamalar.length,
          katildi: yoklamalar.filter((y) => y.status === 'present').length,
          gelmedi: yoklamalar.filter((y) => y.status === 'absent').length,
          izinli: yoklamalar.filter((y) => y.status === 'excused').length,
        },
        odemeOzeti: {
          bekleyen: odemeler.filter((o) => o.status === 'pending').length,
          odenmis: odemeler.filter((o) => o.status === 'paid').length,
          toplamTutar: odemeler.reduce((t, o) => t + Number(o.amount), 0),
        },
      }
    })

    // Veli bazında gruplama (bir velinin birden fazla çocuğu olabilir)
    const veliRaporMap = new Map<string, RaporOzet[]>()
    for (const rapor of raporlar) {
      const veliId = rapor.sporcu.parent_user_id!
      const mevcut = veliRaporMap.get(veliId) ?? []
      mevcut.push(rapor)
      veliRaporMap.set(veliId, mevcut)
    }

    // Push subscription'larını al
    const veliIds = [...veliRaporMap.keys()]
    const { data: allSubs } = await service
      .from('push_subscriptions')
      .select('user_id, endpoint, keys_p256dh, keys_auth')
      .in('user_id', veliIds)
      .eq('is_active', true)

    const subsMap = new Map<string, SubscriptionRow[]>()
    for (const sub of (allSubs ?? []) as SubscriptionRow[]) {
      const list = subsMap.get(sub.user_id) ?? []
      list.push(sub)
      subsMap.set(sub.user_id, list)
    }

    // Tenant isimlerini al
    const tenantIds = [...new Set(typedAthletes.map((a) => a.tenant_id).filter(Boolean))]
    const tenantNameMap = new Map<string, string>()
    if (tenantIds.length > 0) {
      const { data: tenants } = await service
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds)
      for (const t of (tenants ?? []) as Array<{ id: string; name: string }>) {
        tenantNameMap.set(t.id, t.name)
      }
    }

    // Bildirim tercihlerini al (haftalik_rapor: false ise atla)
    const { data: allPrefs } = await service
      .from('notification_preferences')
      .select('user_id, haftalik_rapor')
      .in('user_id', veliIds)

    const prefsMap = new Map<string, boolean>()
    for (const pref of (allPrefs ?? []) as Array<{ user_id: string; haftalik_rapor: boolean | null }>) {
      prefsMap.set(pref.user_id, pref.haftalik_rapor ?? true)
    }

    const emailConfigured = !!process.env.RESEND_API_KEY
    let gonderilen = 0
    let atlanan = 0

    // Her veli için rapor gönder
    for (const [veliId, veliRaporlari] of veliRaporMap) {
      // Kullanıcı haftalık raporu kapattıysa atla
      if (prefsMap.get(veliId) === false) {
        atlanan++
        continue
      }
      const ilkSporcu = veliRaporlari[0].sporcu
      const veliEmail = ilkSporcu.parent_email
      const veliAd = ilkSporcu.parent_name ?? 'Sayın Veli'
      const tesisAdi = tenantNameMap.get(ilkSporcu.tenant_id) ?? 'YiSA-S Tesis'

      // Özet metin oluştur
      const ozetSatirlar = veliRaporlari.map((r) => {
        const ad = [r.sporcu.name, r.sporcu.surname].filter(Boolean).join(' ')
        const y = r.yoklamaOzeti
        const o = r.odemeOzeti
        return `${ad}: ${y.katildi}/${y.toplam} katılım, ${o.bekleyen} bekleyen ödeme`
      })

      const pushBody = `Haftalık Rapor (${baslangicStr} — ${bitisStr})\n${ozetSatirlar.join('\n')}`

      let anySent = false

      // Push bildirim
      const subs = subsMap.get(veliId)
      if (subs && subs.length > 0) {
        for (const sub of subs) {
          const pushSub: PushSubscriptionData = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          }
          const result = await sendPushNotification(pushSub, {
            title: `${tesisAdi} — Haftalık Rapor`,
            body: pushBody,
            notification_type: 'haftalik_rapor',
            url: '/veli/dashboard',
          })
          if (result.ok) anySent = true
        }
      }

      // Email
      if (veliEmail && emailConfigured) {
        try {
          const emailHtml = buildRaporEmailHtml(veliAd, tesisAdi, veliRaporlari, baslangicStr, bitisStr)
          const emailResult = await sendEmail(
            veliEmail,
            `${tesisAdi} — Haftalık Gelişim Raporu`,
            emailHtml,
          )
          if (emailResult.ok) anySent = true
        } catch (emailErr) {
          console.error('[haftalik-rapor] Email hatası:', emailErr)
        }
      }

      if (anySent) {
        gonderilen++
      } else {
        atlanan++
      }
    }

    return NextResponse.json({
      ok: true,
      gonderilen,
      atlanan,
      toplam_veli: veliRaporMap.size,
      toplam_sporcu: typedAthletes.length,
      donem: { baslangic: baslangicStr, bitis: bitisStr },
    })
  } catch (e) {
    console.error('[haftalik-rapor]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// ─── Yardımcı: Email HTML oluştur ───────────────────────────────────────────

function buildRaporEmailHtml(
  veliAd: string,
  tesisAdi: string,
  raporlar: RaporOzet[],
  baslangic: string,
  bitis: string,
): string {
  const rows = raporlar.map((r) => {
    const ad = [r.sporcu.name, r.sporcu.surname].filter(Boolean).join(' ')
    const brans = r.sporcu.branch ?? '—'
    const y = r.yoklamaOzeti
    const o = r.odemeOzeti
    const katilimYuzde = y.toplam > 0 ? Math.round((y.katildi / y.toplam) * 100) : 0
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${ad}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${brans}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${y.katildi}/${y.toplam} (%${katilimYuzde})</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${y.gelmedi}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${y.izinli}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${o.bekleyen}</td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
      <div style="background:#0f172a;color:white;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">${tesisAdi}</h1>
        <p style="margin:4px 0 0;opacity:0.8;font-size:14px">Haftalık Gelişim Raporu</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        <p>Merhaba ${veliAd},</p>
        <p><strong>${baslangic}</strong> — <strong>${bitis}</strong> tarih aralığındaki haftalık özet:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0">Sporcu</th>
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0">Branş</th>
              <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0">Katılım</th>
              <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0">Gelmedi</th>
              <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0">İzinli</th>
              <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0">Bekleyen Ödeme</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:13px;color:#64748b">
          Detaylı bilgi için veli panelinize giriş yapabilirsiniz.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
        <p style="font-size:12px;color:#94a3b8;margin:0">
          Bu email ${tesisAdi} tarafından otomatik olarak gönderilmiştir.
          Bildirim ayarlarınızı veli panelinizden değiştirebilirsiniz.
        </p>
      </div>
    </body>
    </html>
  `
}
