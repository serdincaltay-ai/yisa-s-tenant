import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { sendSMS, isSmsConfigured } from '@/lib/sms/provider'

export const dynamic = 'force-dynamic'

/** Telefon numarasini normalize et: basindaki 0 kaldir, sadece rakam */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('0') ? digits.slice(1) : digits
}

/**
 * POST /api/kayit/ogrenci
 * Kayit gorevlisi: yeni ogrenci kaydi
 * 1) athletes tablosuna sporcu ekle
 * 2) package_payments tablosuna ilk aidat ekle
 * 3) veli telefon varsa auth user olustur (telefon@veli.yisa-s.com, son 4 hane sifre)
 * 4) tenant_leads tablosuna kayit ekle
 * 5) SMS gonder (Twilio yapilandirilmissa)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanamadi' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })

    const service = createServiceClient(url, key)

    // --- Rol yetki kontrolu ---
    const { data: userTenant } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    const allowedRoles = ['kayit_gorevlisi', 'patron', 'franchise', 'firma_sahibi', 'tesis_sahibi', 'isletme_muduru', 'admin', 'manager', 'owner']
    if (!userTenant || !allowedRoles.includes(userTenant.role)) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await req.json()

    // --- Ogrenci bilgileri ---
    const ad = typeof body.ad === 'string' ? body.ad.trim() : ''
    const soyad = typeof body.soyad === 'string' ? body.soyad.trim() : ''
    const dogumTarihi = typeof body.dogum_tarihi === 'string' && body.dogum_tarihi ? body.dogum_tarihi : null
    const cinsiyet = typeof body.cinsiyet === 'string' && ['E', 'K'].includes(body.cinsiyet) ? body.cinsiyet : null
    const brans = typeof body.brans === 'string' ? body.brans.trim() : null

    // --- Veli bilgileri ---
    const veliAd = typeof body.veli_ad === 'string' ? body.veli_ad.trim() : ''
    const rawTelefon = typeof body.veli_telefon === 'string' ? body.veli_telefon.trim() : ''
    const veliTelefon = normalizePhone(rawTelefon)
    const veliEmail = typeof body.veli_email === 'string' ? body.veli_email.trim() : ''

    // --- Ilk aidat ---
    const aidatTutar = typeof body.aidat_tutar === 'number' ? body.aidat_tutar : (parseFloat(String(body.aidat_tutar ?? 0)) || 0)

    if (!ad) return NextResponse.json({ error: 'Ogrenci adi zorunludur' }, { status: 400 })
    if (!veliAd) return NextResponse.json({ error: 'Veli adi zorunludur' }, { status: 400 })

    // --- 1) Veli auth user olustur (telefon bazli) ---
    let parentUserId: string | null = null
    let veliGeciciSifre: string | null = null
    let smsGonderildi = false

    if (veliTelefon.length === 10) {
      // Telefon bazli auth: telefon@veli.yisa-s.com, sifre: son 4 hane
      const fakeEmail = `${veliTelefon}@veli.yisa-s.com`
      const tempPassword = veliTelefon.slice(-4)

      try {
        // Mevcut kullanici var mi kontrol et
        let existingUser = null as { id: string; email?: string } | null
        let page = 1
        while (!existingUser) {
          const { data: listData } = await service.auth.admin.listUsers({ page, perPage: 500 })
          const users = (listData?.users as unknown as Array<{ id: string; email?: string }>) ?? []
          const found = users.find(
            (u) => (u.email ?? '').toLowerCase() === fakeEmail.toLowerCase()
          )
          if (found) { existingUser = found; break }
          if (users.length < 500) break
          page++
        }

        if (existingUser) {
          parentUserId = existingUser.id
          // user_tenants'ta kaydi yoksa ekle
          const { data: existingUt } = await service
            .from('user_tenants')
            .select('id')
            .eq('user_id', parentUserId)
            .eq('tenant_id', tenantId)
            .maybeSingle()
          if (!existingUt) {
            await service.from('user_tenants').insert({
              user_id: parentUserId,
              tenant_id: tenantId,
              role: 'veli',
            })
          }
        } else {
          // Yeni auth kullanici olustur
          const { data: authData, error: authError } = await service.auth.admin.createUser({
            email: fakeEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: veliAd,
              name: veliAd.split(' ')[0],
              phone: veliTelefon,
              real_email: veliEmail || null,
            },
          })
          if (!authError && authData?.user?.id) {
            parentUserId = authData.user.id
            const { error: utError } = await service.from('user_tenants').insert({
              user_id: parentUserId,
              tenant_id: tenantId,
              role: 'veli',
            })
            if (!utError) {
              veliGeciciSifre = tempPassword
            } else {
              await service.auth.admin.deleteUser(parentUserId).catch(() => {})
              parentUserId = null
            }
          }
        }
      } catch {
        // Veli iliskilendirme basarisiz olsa bile sporcu kaydina devam et
      }

      // SMS gonder (sadece yeni veli ve Twilio yapilandirilmissa)
      if (veliGeciciSifre && isSmsConfigured()) {
        try {
          // Tenant subdomain'ini bul
          const { data: subdomainRow } = await service
            .from('franchise_subdomains')
            .select('subdomain')
            .eq('tenant_id', tenantId)
            .maybeSingle()
          const subdomain = subdomainRow?.subdomain ?? 'tesis'
          const loginUrl = `https://${subdomain}.yisa-s.com/veli/giris`

          const smsMessage = `YiSA-S Spor\nKullanici adiniz: ${veliTelefon}\nSifreniz: ${veliGeciciSifre}\nGiris: ${loginUrl}`
          const smsResult = await sendSMS(`+90${veliTelefon}`, smsMessage, {
            tenant_id: tenantId,
            trigger_type: 'kayit_veli_sms',
          })
          smsGonderildi = smsResult.ok
        } catch {
          // SMS gonderilemese bile kayit devam etsin
        }
      }
    }
    // Email-only fallback: auth user olusturulmaz (telefon-bazli giris ile uyumsuz)
    // veliEmail bilgisi athlete kaydinda parent_email olarak saklanir

    // --- 2) Sporcu kaydi (athletes) ---
    const { data: athlete, error: athleteError } = await service
      .from('athletes')
      .insert({
        tenant_id: tenantId,
        name: ad,
        surname: soyad || null,
        birth_date: dogumTarihi,
        gender: cinsiyet,
        branch: brans,
        status: 'active',
        parent_name: veliAd || null,
        parent_phone: veliTelefon || rawTelefon || null,
        parent_email: veliEmail || null,
        parent_user_id: parentUserId,
      } as Record<string, unknown>)
      .select('id, name, surname, created_at')
      .single()

    if (athleteError) {
      console.error('[kayit/ogrenci] athleteError:', athleteError.message)
      if (veliGeciciSifre && parentUserId) {
        try {
          await service.from('user_tenants').delete().eq('user_id', parentUserId).eq('tenant_id', tenantId)
          await service.auth.admin.deleteUser(parentUserId)
        } catch {
          console.error('[kayit/ogrenci] veli rollback basarisiz, user_id:', parentUserId)
        }
      }
      return NextResponse.json({ error: 'Sporcu kaydi olusturulamadi' }, { status: 500 })
    }

    // --- 3) Ilk aidat kaydi (package_payments) ---
    let payment = null
    if (aidatTutar > 0 && athlete?.id) {
      const now = new Date().toISOString().slice(0, 10)
      const { data: paymentData, error: paymentError } = await service
        .from('package_payments')
        .insert({
          tenant_id: tenantId,
          athlete_id: athlete.id,
          amount: Number(aidatTutar.toFixed(2)),
          currency: 'TRY',
          payment_date: now,
          due_date: now,
          taksit_no: 1,
          toplam_taksit: 1,
          status: 'bekliyor',
          description: 'Ilk aidat - kayit',
        })
        .select('id, amount, status')
        .single()

      if (!paymentError) payment = paymentData
    }

    // --- 4) tenant_leads tablosuna kayit ekle ---
    try {
      await service.from('tenant_leads').insert({
        tenant_id: tenantId,
        ad_soyad: veliAd,
        telefon: veliTelefon || rawTelefon || null,
        email: veliEmail || null,
        kaynak: 'kayit_gorevlisi',
        durum: 'kazanildi',
        notlar: `Cocuk: ${ad} ${soyad}, Brans: ${brans ?? '-'}`,
      })
    } catch {
      // tenant_leads insert basarisiz olsa bile devam et (non-fatal)
    }

    return NextResponse.json({
      ok: true,
      athlete,
      payment,
      veli_user_id: parentUserId,
      veli_gecici_sifre: veliGeciciSifre,
      sms_gonderildi: smsGonderildi,
    })
  } catch (e) {
    console.error('[kayit/ogrenci POST]', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
