/**
 * Faz 4 — Veri Robotu: Gelişim Analiz Endpoint'i (Genişletilmiş)
 * POST: { athlete_id, tenant_id }
 * Sporcunun son ölçümlerini referans_degerler ile karşılaştırır.
 * Response: sporcu bilgileri, parametre bazlı analiz, branş önerisi,
 *           postür değerlendirme, sağlık uyarıları, PHV tahmini
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

type Durum = 'dusuk' | 'normal' | 'yuksek'

interface ParametreAnaliz {
  parametre: string
  deger: number
  referans_min: number
  referans_max: number
  optimal: number
  durum: Durum
  yuzdelik: number
}

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

interface AnalizResponse {
  athlete: {
    id: string
    ad: string
    yas: number | null
    cinsiyet: string
    vucut_tipi: string
  }
  olcum_tarihi: string | null
  analiz: ParametreAnaliz[]
  oneri: string
  brans_onerileri: string[]
  postur_degerlendirme: PosturDegerlendirme | null
  saglik_uyarilari: SaglikUyarisi[]
  phv_tahmini: PhvTahmini | null
}

/** Yaşı hesapla (tam yıl) */
function yasHesapla(birthDate: string | null): number | null {
  if (!birthDate) return null
  const diff = new Date().getTime() - new Date(birthDate).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

/** Vücut tipi tahmini (BMI + esneklik + BMI persentil + Beighton bazlı genişletilmiş) */
function vucutTipiTahmin(
  bmi: number | null,
  esneklik: number | null,
  bmiPersentil: number | null,
  beightonSkoru: number | null
): string {
  if (bmi == null) return 'belirsiz'

  // BMI persentil bazlı obezite riski kontrolü
  if (bmiPersentil != null) {
    if (bmiPersentil >= 95) return 'obez-risk'
    if (bmiPersentil >= 85) return 'fazla-kilolu'
    if (bmiPersentil < 5) return 'zayif-risk'
  }

  // Beighton bazlı hipermobilite tanımı
  if (beightonSkoru != null && beightonSkoru >= 4) {
    if (esneklik != null && esneklik > 25) return 'hipermobil-esnek'
    return 'hipermobil'
  }

  if (bmi < 15) return 'ince-uzun'
  if (bmi > 20) return 'guclu-kompakt'
  if (esneklik != null && esneklik > 25) return 'esnek'
  return 'dengeli'
}

/** Postür değerlendirmesi oluştur */
function posturDegerlendirmesiOlustur(
  olcumVerileri: Record<string, number>
): PosturDegerlendirme | null {
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

  if (!herhangiVar && olcumVerileri.postur_skoru != null) {
    return {
      toplam_skor: olcumVerileri.postur_skoru,
      noktalar: [],
      risk_seviyesi: olcumVerileri.postur_skoru <= 4 ? 'normal' : olcumVerileri.postur_skoru <= 9 ? 'dikkat' : 'risk',
      aciklama: olcumVerileri.postur_skoru <= 4
        ? 'Postür genel olarak normal sınırlarda.'
        : olcumVerileri.postur_skoru <= 9
          ? 'Bazı postür noktalarında düzeltme önerilir.'
          : 'Postür değerlendirmesinde önemli sapmalar tespit edildi. Uzman değerlendirmesi önerilir.',
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

  return {
    toplam_skor: toplamSkor,
    noktalar,
    risk_seviyesi: riskSeviyesi,
    aciklama: aciklamalar[riskSeviyesi],
  }
}

/** Sağlık uyarıları üret */
function saglikUyarilariUret(
  olcumVerileri: Record<string, number>,
  yas: number | null,
  cinsiyet: string,
  phvTahmini: PhvTahmini | null
): SaglikUyarisi[] {
  const uyarilar: SaglikUyarisi[] = []

  const duzTabanDerecesi = olcumVerileri.duz_taban_derecesi
  if (duzTabanDerecesi != null && duzTabanDerecesi >= 2) {
    uyarilar.push({
      tip: 'duz_taban',
      seviye: duzTabanDerecesi >= 3 ? 'uyari' : 'dikkat',
      mesaj: duzTabanDerecesi >= 3
        ? 'Belirgin düz taban tespit edildi. Ortopedik değerlendirme önerilir.'
        : 'Orta derecede düz taban tespit edildi. Ayak egzersizleri ve uygun ayakkabı önerilir.',
    })
  }

  const posturSirt = olcumVerileri.postur_sirt
  const posturOmuz = olcumVerileri.postur_omuz
  if ((posturSirt != null && posturSirt >= 2) || (posturOmuz != null && posturOmuz >= 2)) {
    uyarilar.push({
      tip: 'skolyoz_riski',
      seviye: 'dikkat',
      mesaj: 'Sırt ve/veya omuz bölgesinde postür sapması tespit edildi. Skolyoz taraması önerilir.',
    })
  }

  const asimetriSkoru = olcumVerileri.asimetri_skoru
  if (asimetriSkoru != null && asimetriSkoru > 3) {
    uyarilar.push({
      tip: 'asimetri',
      seviye: asimetriSkoru > 6 ? 'uyari' : 'dikkat',
      mesaj: asimetriSkoru > 6
        ? 'Ciddi sağ/sol güç dengesizliği tespit edildi. Dengeleme programı ve uzman değerlendirmesi önerilir.'
        : 'Sağ/sol güç farkı normal aralığın üzerinde. Dengeleme egzersizleri önerilir.',
    })
  }

  const bmiPersentil = olcumVerileri.bmi_persentil
  if (bmiPersentil != null) {
    if (bmiPersentil >= 95) {
      uyarilar.push({ tip: 'obezite', seviye: 'uyari', mesaj: 'BMI persentili obezite sınırının üzerinde (>=95. persentil). Beslenme danışmanlığı önerilir.' })
    } else if (bmiPersentil >= 85) {
      uyarilar.push({ tip: 'fazla_kilo', seviye: 'dikkat', mesaj: 'BMI persentili fazla kilo sınırında (85-95. persentil). Fiziksel aktivite artırılmalı.' })
    } else if (bmiPersentil < 5) {
      uyarilar.push({ tip: 'dusuk_kilo', seviye: 'dikkat', mesaj: 'BMI persentili düşük kilo sınırında (<5. persentil). Beslenme değerlendirmesi önerilir.' })
    }
  }

  const beightonSkoru = olcumVerileri.beighton_skoru
  if (beightonSkoru != null && beightonSkoru >= 6) {
    uyarilar.push({ tip: 'hipermobilite', seviye: 'dikkat', mesaj: 'Yüksek hipermobilite skoru tespit edildi (Beighton >=6). Eklem koruyucu egzersizler ve kuvvetlendirme önerilir.' })
  }

  if (phvTahmini && yas != null) {
    const tahminiPhvYasi = phvTahmini.tahmini_phv_yasi
    if (cinsiyet === 'E' && tahminiPhvYasi < 12) {
      uyarilar.push({ tip: 'erken_ergenlik', seviye: 'dikkat', mesaj: 'PHV tahmini erkek çocuklar için erken olabilir. Pediatrik endokrinoloji değerlendirmesi düşünülebilir.' })
    } else if (cinsiyet === 'K' && tahminiPhvYasi < 10) {
      uyarilar.push({ tip: 'erken_ergenlik', seviye: 'dikkat', mesaj: 'PHV tahmini kız çocuklar için erken olabilir. Pediatrik endokrinoloji değerlendirmesi düşünülebilir.' })
    }
  }

  return uyarilar
}

/**
 * PHV / Maturity Offset hesaplama (Mirwald 2002 formülü)
 * Erkek: MO = -9.236 + 0.0002708*Leg*Sit + (-0.001663*Age*Leg) + 0.007216*Age*Sit + 0.02292*(Weight/Height*100)
 * Kız:   MO = -9.376 + 0.0001882*Leg*Sit + 0.0022*Age*Leg + 0.005841*Age*Sit + (-0.002658*Age*Weight) + 0.07693*(Weight/Height*100)
 */
function phvHesapla(
  yas: number | null,
  cinsiyet: string,
  boy: number | null,
  kilo: number | null,
  oturmaYuksekligi: number | null
): PhvTahmini | null {
  if (yas == null || boy == null || kilo == null || oturmaYuksekligi == null) return null

  const leg = boy - oturmaYuksekligi
  const sit = oturmaYuksekligi
  const age = yas
  const weight = kilo
  const height = boy

  let maturityOffset: number

  if (cinsiyet === 'E') {
    maturityOffset =
      -9.236 +
      0.0002708 * leg * sit +
      -0.001663 * age * leg +
      0.007216 * age * sit +
      0.02292 * (weight / height) * 100
  } else {
    maturityOffset =
      -9.376 +
      0.0001882 * leg * sit +
      0.0022 * age * leg +
      0.005841 * age * sit +
      -0.002658 * age * weight +
      0.07693 * (weight / height) * 100
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
    aciklama = 'Sporcu PHV döneminde. Büyüme hızı en yüksek seviyede. Sakatlanma riski artmış olabilir. Antrenman yoğunluğu dikkatli ayarlanmalı.'
  } else {
    durum = 'post-PHV'
    aciklama = `Sporcu PHV'yi geçmiş (${maturityOffset.toFixed(1)} yıl). Kuvvet ve güç antrenmanları artırılabilir.`
  }

  return { maturity_offset: maturityOffset, tahmini_phv_yasi: tahminiPhvYasi, durum, aciklama }
}

/** Branş önerisi üret (analiz sonuçlarına göre — genişletilmiş) */
function bransOnerisiUret(
  analizler: ParametreAnaliz[],
  vucutTipi: string,
  posturDeg: PosturDegerlendirme | null,
  asimetriSkoru: number | null
): string[] {
  const onerileri: string[] = []
  const ustunParametreler = analizler.filter((a) => a.durum === 'yuksek').map((a) => a.parametre)

  if (ustunParametreler.includes('esneklik') || ustunParametreler.includes('denge')) {
    onerileri.push('cimnastik')
  }
  if (ustunParametreler.includes('surat') || ustunParametreler.includes('dayaniklilik')) {
    onerileri.push('atletizm')
  }
  if (ustunParametreler.includes('koordinasyon') || ustunParametreler.includes('denge')) {
    if (!onerileri.includes('cimnastik')) onerileri.push('cimnastik')
  }
  if (ustunParametreler.includes('kuvvet') || ustunParametreler.includes('dikey_sicrama')) {
    onerileri.push('jimnastik')
  }
  if (ustunParametreler.includes('patlayici_kuvvet')) {
    if (!onerileri.includes('atletizm')) onerileri.push('atletizm')
    onerileri.push('basketbol')
  }
  if (ustunParametreler.includes('psikomotor_puan')) {
    onerileri.push('cok-branşlı gelişim')
  }

  if (vucutTipi === 'esnek' && !onerileri.includes('cimnastik')) {
    onerileri.push('cimnastik')
  }
  if (vucutTipi === 'hipermobil-esnek' && !onerileri.includes('cimnastik')) {
    onerileri.push('cimnastik')
  }
  if (vucutTipi === 'ince-uzun') {
    onerileri.push('yuzme')
  }

  // Postür sorunu varsa düzeltici egzersiz önerisi
  if (posturDeg && posturDeg.risk_seviyesi !== 'normal') {
    onerileri.push('düzeltici egzersiz programı')
  }

  // Asimetri varsa dengeleme programı
  if (asimetriSkoru != null && asimetriSkoru > 3) {
    onerileri.push('dengeleme programı')
  }

  if (onerileri.length === 0) onerileri.push('genel')
  return onerileri
}

/** Öneri metni üret (genişletilmiş) */
function oneriMetniUret(
  analizler: ParametreAnaliz[],
  vucutTipi: string,
  branslar: string[],
  posturDeg: PosturDegerlendirme | null,
  saglikUyarilari: SaglikUyarisi[],
  phvTahmini: PhvTahmini | null
): string {
  const ustun = analizler.filter((a) => a.durum === 'yuksek').map((a) => a.parametre)
  const dusuk = analizler.filter((a) => a.durum === 'dusuk').map((a) => a.parametre)

  const parcalar: string[] = []

  if (vucutTipi !== 'belirsiz') {
    const vucutTipiAciklama: Record<string, string> = {
      'ince-uzun': 'ince-uzun', 'guclu-kompakt': 'güçlü-kompakt', 'esnek': 'esnek',
      'dengeli': 'dengeli', 'hipermobil': 'hipermobil', 'hipermobil-esnek': 'hipermobil-esnek',
      'obez-risk': 'obezite riski taşıyan', 'fazla-kilolu': 'fazla kilolu', 'zayif-risk': 'düşük kilolu',
    }
    parcalar.push(`Sporcu ${vucutTipiAciklama[vucutTipi] ?? vucutTipi} vücut tipinde.`)
  }

  if (ustun.length > 0) {
    parcalar.push(`Üstün parametreler: ${ustun.join(', ')}.`)
  }
  if (dusuk.length > 0) {
    parcalar.push(`Geliştirilmesi gereken: ${dusuk.join(', ')}.`)
  }

  if (posturDeg && posturDeg.risk_seviyesi !== 'normal') {
    parcalar.push(`Postür: ${posturDeg.aciklama}`)
  }
  if (phvTahmini) {
    parcalar.push(`PHV Durumu: ${phvTahmini.aciklama}`)
  }
  if (saglikUyarilari.length > 0) {
    const uyariSayisi = saglikUyarilari.filter((u) => u.seviye === 'uyari').length
    const dikkatSayisi = saglikUyarilari.filter((u) => u.seviye === 'dikkat').length
    if (uyariSayisi > 0 || dikkatSayisi > 0) {
      parcalar.push(`Sağlık: ${uyariSayisi} uyarı, ${dikkatSayisi} dikkat notu mevcut.`)
    }
  }

  if (branslar.length > 0 && branslar[0] !== 'genel') {
    const sporBranslari = branslar.filter((b) => !['düzeltici egzersiz programı', 'dengeleme programı'].includes(b))
    const programlar = branslar.filter((b) => ['düzeltici egzersiz programı', 'dengeleme programı'].includes(b))
    if (sporBranslari.length > 0) parcalar.push(`Önerilen branşlar: ${sporBranslari.join(', ')}.`)
    if (programlar.length > 0) parcalar.push(`Ek programlar: ${programlar.join(', ')}.`)
  }

  if (parcalar.length === 0) {
    return 'Yeterli ölçüm verisi bulunamadı. Daha fazla parametre girilmesi önerilir.'
  }

  return parcalar.join(' ')
}

function getService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const body = await req.json()
    const athleteId = typeof body.athlete_id === 'string' ? body.athlete_id.trim() : ''
    if (!athleteId) return NextResponse.json({ error: 'athlete_id zorunludur' }, { status: 400 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    // 1) Sporcu bilgilerini al
    const { data: athlete } = await service
      .from('athletes')
      .select('id, name, surname, birth_date, gender')
      .eq('id', athleteId)
      .eq('tenant_id', tenantId)
      .single()

    if (!athlete) return NextResponse.json({ error: 'Sporcu bulunamadı' }, { status: 404 })

    const yas = yasHesapla(athlete.birth_date)
    const cinsiyet = (athlete.gender === 'E' || athlete.gender === 'K') ? athlete.gender : 'E'

    // 2) Son ölçümü al (gelisim_olcumleri tablosundan)
    const { data: sonOlcum } = await service
      .from('gelisim_olcumleri')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('athlete_id', athleteId)
      .order('olcum_tarihi', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Fallback: athlete_measurements tablosundan da bak
    const olcumVerileri: Record<string, number> = {}
    let olcumTarihi: string | null = null

    if (sonOlcum?.olcum_verileri && typeof sonOlcum.olcum_verileri === 'object') {
      const raw = sonOlcum.olcum_verileri as Record<string, unknown>
      for (const [k, v] of Object.entries(raw)) {
        if (v != null && !isNaN(Number(v))) {
          olcumVerileri[k] = Number(v)
        }
      }
      olcumTarihi = sonOlcum.olcum_tarihi as string
    } else {
      // Fallback: athlete_measurements
      const { data: legacyOlcum } = await service
        .from('athlete_measurements')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('athlete_id', athleteId)
        .order('olcum_tarihi', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (legacyOlcum) {
        const params = ['boy', 'kilo', 'esneklik', 'dikey_sicrama', 'sure_20m', 'denge', 'koordinasyon', 'kuvvet', 'dayaniklilik'] as const
        for (const p of params) {
          const val = legacyOlcum[p]
          if (val != null && !isNaN(Number(val))) {
            olcumVerileri[p === 'sure_20m' ? 'surat' : p] = Number(val)
          }
        }
        olcumTarihi = legacyOlcum.olcum_tarihi as string
      }
    }

    // 3) BMI hesapla (eğer boy + kilo varsa)
    if (olcumVerileri.boy && olcumVerileri.kilo && !olcumVerileri.bmi) {
      const boyMetre = olcumVerileri.boy / 100
      olcumVerileri.bmi = Math.round((olcumVerileri.kilo / (boyMetre * boyMetre)) * 10) / 10
    }

    // 3b) Patlayıcı kuvvet hesapla (Lewis formülü)
    if (olcumVerileri.dikey_sicrama && olcumVerileri.kilo && !olcumVerileri.patlayici_kuvvet) {
      const sicramaMetre = olcumVerileri.dikey_sicrama / 100
      olcumVerileri.patlayici_kuvvet = Math.round(
        Math.sqrt(4.9) * olcumVerileri.kilo * Math.sqrt(sicramaMetre) * 9.81
      )
    }

    // 4) Referans değerlerle karşılaştır
    const analizler: ParametreAnaliz[] = []

    if (yas != null) {
      const { data: refs } = await service
        .from('referans_degerler')
        .select('*')
        .eq('yas', yas)
        .eq('cinsiyet', cinsiyet)

      for (const [parametre, deger] of Object.entries(olcumVerileri)) {
        const ref = (refs ?? []).find((r: { parametre: string }) => r.parametre === parametre)
        if (!ref) continue

        const minDeger = Number(ref.min_deger)
        const maxDeger = Number(ref.max_deger)
        const optimal = Number(ref.optimal_deger)
        const range = maxDeger - minDeger

        let durum: Durum = 'normal'
        // Ters mantık parametreleri (düşük = iyi)
        const tersMantikParametreler = ['surat', 'postur_skoru', 'asimetri_skoru', 'duz_taban_derecesi']
        if (tersMantikParametreler.includes(parametre)) {
          if (deger > maxDeger) durum = 'dusuk'
          else if (deger < minDeger) durum = 'yuksek'
        } else {
          if (deger < minDeger) durum = 'dusuk'
          else if (deger > maxDeger) durum = 'yuksek'
        }

        // Yüzdelik hesapla
        let yuzdelik = range > 0 ? Math.round(((deger - minDeger) / range) * 100) : 50
        if (tersMantikParametreler.includes(parametre)) {
          yuzdelik = range > 0 ? Math.round(((maxDeger - deger) / range) * 100) : 50
        }
        yuzdelik = Math.max(0, Math.min(100, yuzdelik))

        analizler.push({
          parametre,
          deger,
          referans_min: minDeger,
          referans_max: maxDeger,
          optimal,
          durum,
          yuzdelik,
        })
      }
    }

    // 5) Postür değerlendirmesi
    const posturDegerlendirme = posturDegerlendirmesiOlustur(olcumVerileri)

    // 6) PHV tahmini (Mirwald formülü)
    const phvTahmini = phvHesapla(
      yas,
      cinsiyet,
      olcumVerileri.boy ?? null,
      olcumVerileri.kilo ?? null,
      olcumVerileri.oturma_yuksekligi ?? null
    )

    // 7) Sağlık uyarıları
    const saglikUyarilari = saglikUyarilariUret(olcumVerileri, yas, cinsiyet, phvTahmini)

    // 8) Vücut tipi + branş önerisi (genişletilmiş)
    const vucutTipi = vucutTipiTahmin(
      olcumVerileri.bmi ?? null,
      olcumVerileri.esneklik ?? null,
      olcumVerileri.bmi_persentil ?? null,
      olcumVerileri.beighton_skoru ?? null
    )
    const bransOnerileri = bransOnerisiUret(analizler, vucutTipi, posturDegerlendirme, olcumVerileri.asimetri_skoru ?? null)
    const oneri = oneriMetniUret(analizler, vucutTipi, bransOnerileri, posturDegerlendirme, saglikUyarilari, phvTahmini)

    const response: AnalizResponse = {
      athlete: {
        id: athlete.id as string,
        ad: `${athlete.name ?? ''} ${athlete.surname ?? ''}`.trim(),
        yas,
        cinsiyet,
        vucut_tipi: vucutTipi,
      },
      olcum_tarihi: olcumTarihi,
      analiz: analizler,
      oneri,
      brans_onerileri: bransOnerileri,
      postur_degerlendirme: posturDegerlendirme,
      saglik_uyarilari: saglikUyarilari,
      phv_tahmini: phvTahmini,
    }

    return NextResponse.json(response)
  } catch (e) {
    console.error('[gelisim-analiz POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
