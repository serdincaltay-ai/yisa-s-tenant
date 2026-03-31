/**
 * Antrenör: ölçüm girişi, analiz (genişletilmiş)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

type Durum = 'dusuk' | 'normal' | 'yuksek'

interface PosturDegerlendirme {
  toplam_skor: number
  noktalar: { bolge: string; skor: number }[]
  risk_seviyesi: 'normal' | 'dikkat' | 'risk'
  aciklama: string
}

interface SaglikUyarisi {
  tip: string
  seviye: 'bilgi' | 'dikkat' | 'uyari'
  mesaj: string
}

interface PhvTahmini {
  maturity_offset: number
  tahmini_phv_yasi: number
  durum: string
  aciklama: string
}

function yasHesapla(birthDate: string | null): number | null {
  if (!birthDate) return null
  const diff = new Date().getTime() - new Date(birthDate).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

/** Postür değerlendirmesi */
function posturDegerlendirmesiOlustur(olcumVerileri: Record<string, number>): PosturDegerlendirme | null {
  const noktaAnahtarlari = ['postur_omuz', 'postur_sirt', 'postur_kalca', 'postur_diz', 'postur_ayak', 'postur_bas']
  const noktaAdlari = ['Omuz', 'Sırt', 'Kalça', 'Diz', 'Ayak', 'Baş']
  const noktalar: { bolge: string; skor: number }[] = []
  let toplamSkor = 0
  let herhangiVar = false
  for (let i = 0; i < noktaAnahtarlari.length; i++) {
    const val = olcumVerileri[noktaAnahtarlari[i]]
    if (val != null) {
      herhangiVar = true
      noktalar.push({ bolge: noktaAdlari[i], skor: val })
      toplamSkor += val
    }
  }
  if (!herhangiVar) return null
  const riskSeviyesi: 'normal' | 'dikkat' | 'risk' =
    toplamSkor <= 4 ? 'normal' : toplamSkor <= 9 ? 'dikkat' : 'risk'
  const aciklamalar: Record<string, string> = {
    normal: 'Postür genel olarak normal sınırlarda.',
    dikkat: 'Bazı postür noktalarında düzeltme önerilir. Düzeltici egzersiz programı planlanmalı.',
    risk: 'Postür değerlendirmesinde önemli sapmalar tespit edildi. Uzman değerlendirmesi önerilir.',
  }
  return { toplam_skor: toplamSkor, noktalar, risk_seviyesi: riskSeviyesi, aciklama: aciklamalar[riskSeviyesi] }
}

/** PHV / Maturity Offset hesaplama (Mirwald 2002) */
function phvHesapla(yas: number | null, cinsiyet: string, boy: number | null, kilo: number | null, oturmaYuksekligi: number | null): PhvTahmini | null {
  if (yas == null || boy == null || kilo == null || oturmaYuksekligi == null) return null
  const leg = boy - oturmaYuksekligi
  const sit = oturmaYuksekligi
  const age = yas
  const weight = kilo
  const height = boy
  let maturityOffset: number
  if (cinsiyet === 'E') {
    maturityOffset = -9.236 + 0.0002708 * leg * sit + -0.001663 * age * leg + 0.007216 * age * sit + 0.02292 * (weight / height) * 100
  } else {
    maturityOffset = -9.376 + 0.0001882 * leg * sit + 0.0022 * age * leg + 0.005841 * age * sit + -0.002658 * age * weight + 0.07693 * (weight / height) * 100
  }
  maturityOffset = Math.round(maturityOffset * 10) / 10
  const tahminiPhvYasi = Math.round((age - maturityOffset) * 10) / 10
  let durum: string
  let aciklama: string
  if (maturityOffset < -2) {
    durum = 'pre-PHV'
    aciklama = `Sporcu PHV'ye yaklaşık ${Math.abs(maturityOffset).toFixed(1)} yıl uzaklıkta. Temel motor beceriler ve koordinasyon ağırlıklı antrenman önerilir.`
  } else if (maturityOffset < 0) {
    durum = 'yaklasan-PHV'
    aciklama = `Sporcu PHV'ye yaklaşıyor (${Math.abs(maturityOffset).toFixed(1)} yıl). Esneklik ve teknik çalışmalara ağırlık verilmeli.`
  } else if (maturityOffset < 1) {
    durum = 'PHV-civari'
    aciklama = 'Sporcu PHV döneminde. Büyüme hızı en yüksek seviyede. Sakatlanma riski artmış olabilir.'
  } else {
    durum = 'post-PHV'
    aciklama = `Sporcu PHV'yi geçmiş (${maturityOffset.toFixed(1)} yıl). Kuvvet ve güç antrenmanları artırılabilir.`
  }
  return { maturity_offset: maturityOffset, tahmini_phv_yasi: tahminiPhvYasi, durum, aciklama }
}

/** Sağlık uyarıları üret */
function saglikUyarilariUret(olcumVerileri: Record<string, number>, yas: number | null, cinsiyet: string, phv: PhvTahmini | null): SaglikUyarisi[] {
  const uyarilar: SaglikUyarisi[] = []
  const dt = olcumVerileri.duz_taban_derecesi
  if (dt != null && dt >= 2) {
    uyarilar.push({ tip: 'duz_taban', seviye: dt >= 3 ? 'uyari' : 'dikkat', mesaj: dt >= 3 ? 'Belirgin düz taban tespit edildi. Ortopedik değerlendirme önerilir.' : 'Orta derecede düz taban tespit edildi. Ayak egzersizleri önerilir.' })
  }
  const ps = olcumVerileri.postur_sirt
  const po = olcumVerileri.postur_omuz
  if ((ps != null && ps >= 2) || (po != null && po >= 2)) {
    uyarilar.push({ tip: 'skolyoz_riski', seviye: 'dikkat', mesaj: 'Sırt ve/veya omuz bölgesinde postür sapması tespit edildi. Skolyoz taraması önerilir.' })
  }
  const as2 = olcumVerileri.asimetri_skoru
  if (as2 != null && as2 > 3) {
    uyarilar.push({ tip: 'asimetri', seviye: as2 > 6 ? 'uyari' : 'dikkat', mesaj: as2 > 6 ? 'Ciddi sağ/sol güç dengesizliği tespit edildi. Dengeleme programı önerilir.' : 'Sağ/sol güç farkı normal aralığın üzerinde. Dengeleme egzersizleri önerilir.' })
  }
  const bs = olcumVerileri.beighton_skoru
  if (bs != null && bs >= 6) {
    uyarilar.push({ tip: 'hipermobilite', seviye: 'dikkat', mesaj: 'Yüksek hipermobilite skoru tespit edildi. Eklem koruyucu egzersizler önerilir.' })
  }
  if (phv && yas != null) {
    if (cinsiyet === 'E' && phv.tahmini_phv_yasi < 12) {
      uyarilar.push({ tip: 'erken_ergenlik', seviye: 'dikkat', mesaj: 'PHV tahmini erkek çocuklar için erken olabilir.' })
    } else if (cinsiyet === 'K' && phv.tahmini_phv_yasi < 10) {
      uyarilar.push({ tip: 'erken_ergenlik', seviye: 'dikkat', mesaj: 'PHV tahmini kız çocuklar için erken olabilir.' })
    }
  }
  return uyarilar
}

/** Yüzdelik hesapla */
function yuzdelikHesapla(deger: number, min: number, max: number): number {
  if (max === min) return 50
  const raw = ((deger - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, Math.round(raw)))
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ sporcular: [] })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ sporcular: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ sporcular: [] })

    const service = createServiceClient(url, key)
    const { data: sporcular } = await service
      .from('athletes')
      .select('id, name, surname, birth_date, gender')
      .eq('tenant_id', tenantId)
      .eq('coach_user_id', user.id)
      .order('name')

    return NextResponse.json({ sporcular: sporcular ?? [] })
  } catch (e) {
    console.error('[antrenor/olcum GET]', e)
    return NextResponse.json({ sporcular: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const body = await req.json()
    const athleteId = body.athlete_id
    const olcumTarihi = body.olcum_tarihi || new Date().toISOString().slice(0, 10)
    if (!athleteId) return NextResponse.json({ error: 'athlete_id gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' })

    const service = createServiceClient(url, key)

    const { data: athlete } = await service.from('athletes').select('id, birth_date, gender').eq('id', athleteId).eq('tenant_id', tenantId).single()
    if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

    const row = {
      tenant_id: tenantId,
      athlete_id: athleteId,
      olcum_tarihi: olcumTarihi,
      boy: body.boy != null ? Number(body.boy) : null,
      kilo: body.kilo != null ? Number(body.kilo) : null,
      esneklik: body.esneklik != null ? Number(body.esneklik) : null,
      dikey_sicrama: body.dikey_sicrama != null ? Number(body.dikey_sicrama) : null,
      sure_20m: body.sure_20m != null ? Number(body.sure_20m) : null,
      denge: body.denge != null ? Number(body.denge) : null,
      koordinasyon: body.koordinasyon != null ? parseInt(String(body.koordinasyon), 10) : null,
      kuvvet: body.kuvvet != null ? parseInt(String(body.kuvvet), 10) : null,
      dayaniklilik: body.dayaniklilik != null ? parseInt(String(body.dayaniklilik), 10) : null,
      postur_notu: body.postur_notu || null,
      genel_degerlendirme: body.genel_degerlendirme || null,
      olcen_id: user.id,
      // Genişletilmiş ölçüm alanları
      postur_omuz: body.postur_omuz != null ? Number(body.postur_omuz) : null,
      postur_sirt: body.postur_sirt != null ? Number(body.postur_sirt) : null,
      postur_kalca: body.postur_kalca != null ? Number(body.postur_kalca) : null,
      postur_diz: body.postur_diz != null ? Number(body.postur_diz) : null,
      postur_ayak: body.postur_ayak != null ? Number(body.postur_ayak) : null,
      postur_bas: body.postur_bas != null ? Number(body.postur_bas) : null,
      beighton_skoru: body.beighton_skoru != null ? Number(body.beighton_skoru) : null,
      asimetri_skoru: body.asimetri_skoru != null ? Number(body.asimetri_skoru) : null,
      baskin_taraf: body.baskin_taraf || null,
      duz_taban_derecesi: body.duz_taban_derecesi != null ? Number(body.duz_taban_derecesi) : null,
      oturma_yuksekligi: body.oturma_yuksekligi != null ? Number(body.oturma_yuksekligi) : null,
    }

    const { data: inserted, error } = await service.from('athlete_measurements').insert(row).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // GOREV #26: Ilk olcum yapildi flag'ini guncelle
    await service
      .from('athletes')
      .update({ ilk_olcum_yapildi: true, ilk_olcum_tarihi: new Date().toISOString() })
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .is('ilk_olcum_yapildi', false)

    // Bekleyen ilk olcum randevusunu tamamla
    await service
      .from('measurement_appointments')
      .update({ durum: 'tamamlandi', updated_at: new Date().toISOString() })
      .eq('athlete_id', athleteId)
      .eq('tenant_id', tenantId)
      .eq('durum', 'bekliyor')

    const yas = yasHesapla(athlete.birth_date)
    const cinsiyet = (athlete.gender === 'E' || athlete.gender === 'K') ? athlete.gender : 'E'
    const analiz: Array<{ parametre: string; deger: number; durum: Durum; yuzdelik: number }> = []
    const bransOnerileri = new Set<string>()

    const params = ['boy', 'kilo', 'esneklik', 'dikey_sicrama', 'sure_20m', 'denge', 'koordinasyon', 'kuvvet', 'dayaniklilik'] as const
    const colMap: Record<string, keyof typeof row> = { boy: 'boy', kilo: 'kilo', esneklik: 'esneklik', dikey_sicrama: 'dikey_sicrama', sure_20m: 'sure_20m', denge: 'denge', koordinasyon: 'koordinasyon', kuvvet: 'kuvvet', dayaniklilik: 'dayaniklilik' }

    if (yas != null) {
      const { data: refs } = await service.from('reference_values').select('*').in('parametre', params).eq('cinsiyet', cinsiyet).lte('yas_max', yas).gte('yas_min', yas)
      for (const p of params) {
        const val = row[colMap[p]]
        if (val == null) continue
        const v = Number(val)
        const r = (refs ?? []).find((x: { parametre: string }) => x.parametre === p)
        if (r) {
          const min = Number(r.deger_min)
          const max = Number(r.deger_max)
          let durum: Durum = 'normal'
          if (v < min) durum = 'dusuk'
          else if (v > max) durum = 'yuksek'
          const yuzdelik = yuzdelikHesapla(v, min, max)
          analiz.push({ parametre: p, deger: v, durum, yuzdelik })
          if (r.brans_uygunluk) bransOnerileri.add(r.brans_uygunluk)
        }
      }
    }

    // Genişletilmiş analiz: postür, PHV, sağlık uyarıları
    const olcumVerileri: Record<string, number> = {}
    const detayliAlanlar = ['postur_omuz', 'postur_sirt', 'postur_kalca', 'postur_diz', 'postur_ayak', 'postur_bas', 'beighton_skoru', 'asimetri_skoru', 'duz_taban_derecesi', 'oturma_yuksekligi'] as const
    for (const k of detayliAlanlar) {
      const v = row[k]
      if (v != null) olcumVerileri[k] = Number(v)
    }

    const posturDeg = posturDegerlendirmesiOlustur(olcumVerileri)
    const phvTahmini = phvHesapla(yas, cinsiyet, row.boy ? Number(row.boy) : null, row.kilo ? Number(row.kilo) : null, row.oturma_yuksekligi ? Number(row.oturma_yuksekligi) : null)
    const saglikUyarilari = saglikUyarilariUret(olcumVerileri, yas, cinsiyet, phvTahmini)

    // Öneri metni oluştur
    const parcalar: string[] = []
    const ustun = analiz.filter((a) => a.durum === 'yuksek').map((a) => a.parametre)
    const dusuk = analiz.filter((a) => a.durum === 'dusuk').map((a) => a.parametre)
    if (ustun.length > 0) parcalar.push(`Üstün parametreler: ${ustun.join(', ')}.`)
    if (dusuk.length > 0) parcalar.push(`Geliştirilmesi gereken: ${dusuk.join(', ')}.`)
    if (posturDeg && posturDeg.risk_seviyesi !== 'normal') parcalar.push(`Postür: ${posturDeg.aciklama}`)
    if (phvTahmini) parcalar.push(`PHV Durumu: ${phvTahmini.aciklama}`)
    if (saglikUyarilari.length > 0) {
      const uyariSayisi = saglikUyarilari.filter((u) => u.seviye === 'uyari').length
      const dikkatSayisi = saglikUyarilari.filter((u) => u.seviye === 'dikkat').length
      if (uyariSayisi > 0 || dikkatSayisi > 0) parcalar.push(`Sağlık: ${uyariSayisi} uyarı, ${dikkatSayisi} dikkat notu mevcut.`)
    }
    const oneri = parcalar.length > 0 ? parcalar.join(' ') : 'Yeterli ölçüm verisi bulunamadı. Daha fazla parametre girilmesi önerilir.'

    return NextResponse.json({
      ok: true,
      id: inserted?.id,
      analiz,
      bransOnerileri: Array.from(bransOnerileri),
      oneri,
      postur_degerlendirme: posturDeg,
      saglik_uyarilari: saglikUyarilari,
      phv_tahmini: phvTahmini,
    })
  } catch (e) {
    console.error('[antrenor/olcum POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' })
  }
}
