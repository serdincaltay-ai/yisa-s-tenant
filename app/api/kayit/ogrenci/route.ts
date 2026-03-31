import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

/**
 * POST /api/kayit/ogrenci
 * Kayit gorevlisi: yeni ogrenci kaydi
 * 1) athletes tablosuna sporcu ekle
 * 2) package_payments tablosuna ilk aidat ekle
 * 3) veli email varsa user_tenants ile iliskilendir (veya yeni auth user olustur)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanamadı' }, { status: 403 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    // --- Rol yetki kontrolü ---
    const { data: userTenant } = await service
      .from('user_tenants')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    const allowedRoles = ['kayit_gorevlisi', 'patron', 'franchise', 'firma_sahibi', 'tesis_sahibi', 'isletme_muduru', 'admin', 'manager']
    if (!userTenant || !allowedRoles.includes(userTenant.role)) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await req.json()

    // --- Öğrenci bilgileri ---
    const ad = typeof body.ad === 'string' ? body.ad.trim() : ''
    const soyad = typeof body.soyad === 'string' ? body.soyad.trim() : ''
    const dogumTarihi = typeof body.dogum_tarihi === 'string' && body.dogum_tarihi ? body.dogum_tarihi : null
    const cinsiyet = typeof body.cinsiyet === 'string' && ['E', 'K'].includes(body.cinsiyet) ? body.cinsiyet : null
    const brans = typeof body.brans === 'string' ? body.brans.trim() : null

    // --- Veli bilgileri ---
    const veliAd = typeof body.veli_ad === 'string' ? body.veli_ad.trim() : ''
    const veliTelefon = typeof body.veli_telefon === 'string' ? body.veli_telefon.trim() : ''
    const veliEmail = typeof body.veli_email === 'string' ? body.veli_email.trim() : ''

    // --- İlk aidat ---
    const aidatTutar = typeof body.aidat_tutar === 'number' ? body.aidat_tutar : (parseFloat(String(body.aidat_tutar ?? 0)) || 0)

    if (!ad) return NextResponse.json({ error: 'Öğrenci adı zorunludur' }, { status: 400 })
    if (!veliAd) return NextResponse.json({ error: 'Veli adı zorunludur' }, { status: 400 })

    // --- 1) Veli user_tenants iliskilendirme ---
    let parentUserId: string | null = null
    let veliGeciciSifre: string | null = null
    if (veliEmail) {
      // Mevcut kullanici var mi kontrol et (sayfalanmis arama)
      try {
        let existingUser = null as { id: string; email?: string } | null
        let page = 1
        while (!existingUser) {
          const { data: listData } = await service.auth.admin.listUsers({ page, perPage: 500 })
          const users = (listData?.users as unknown as Array<{ id: string; email?: string }>) ?? []
          const found = users.find(
            (u) => (u.email ?? '').toLowerCase() === veliEmail.toLowerCase()
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
          // Yeni auth kullanici olustur (gecici sifre ile)
          const tempPassword = `Yisa${crypto.randomUUID().slice(0, 8)}`
          const { data: authData, error: authError } = await service.auth.admin.createUser({
            email: veliEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: veliAd, name: veliAd.split(' ')[0] },
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
              // user_tenants insert başarısız — orphan önlemek için auth user sil
              await service.auth.admin.deleteUser(parentUserId).catch(() => {})
              parentUserId = null
            }
          }
        }
      } catch {
        // Veli iliskilendirme basarisiz olsa bile sporcu kaydina devam et
      }
    }

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
        parent_phone: veliTelefon || null,
        parent_email: veliEmail || null,
        parent_user_id: parentUserId,
      } as Record<string, unknown>)
      .select('id, name, surname, created_at')
      .single()

    if (athleteError) {
      console.error('[kayit/ogrenci] athleteError:', athleteError.message)
      // Yeni oluşturulan veli auth user'ı geri al (orphan önleme)
      if (veliGeciciSifre && parentUserId) {
        try {
          await service.from('user_tenants').delete().eq('user_id', parentUserId).eq('tenant_id', tenantId)
          await service.auth.admin.deleteUser(parentUserId)
        } catch {
          console.error('[kayit/ogrenci] veli rollback başarısız, user_id:', parentUserId)
        }
      }
      return NextResponse.json({ error: 'Sporcu kaydı oluşturulamadı' }, { status: 500 })
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
          description: 'İlk aidat - kayıt',
        })
        .select('id, amount, status')
        .single()

      if (!paymentError) payment = paymentData
    }

    return NextResponse.json({
      ok: true,
      athlete,
      payment,
      veli_user_id: parentUserId,
      veli_gecici_sifre: veliGeciciSifre,
    })
  } catch (e) {
    console.error('[kayit/ogrenci POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
