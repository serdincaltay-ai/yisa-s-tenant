/**
 * CELF Uçtan Uca Test Akışı API
 * POST: Patron komutu → Güvenlik (3 Duvar) → Yönlendirme → CELF → Arşivleme → Onay Kuyruğu
 * Her adımın durumunu ve sonucunu döner.
 * 
 * Bu endpoint gerçek AI çağrısı yapmaz — sadece akışın tüm adımlarını doğrular.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ucDuvarKontrol } from '@/lib/security/uc-duvar'
import { routeToDirector } from '@/lib/robots/ceo-robot'
import { CELF_DIRECTORATES, type DirectorKey } from '@/lib/robots/celf-center'
import { createTaskResult } from '@/lib/db/task-results'
import { createSecurityLog } from '@/lib/db/security-logs'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

interface TestAdim {
  adim: number
  ad: string
  durum: 'basarili' | 'basarisiz' | 'atlanmis'
  detay: string
  sure_ms?: number
}

export async function POST(req: NextRequest) {
  const baslangic = Date.now()
  const adimlar: TestAdim[] = []

  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const command = typeof body.command === 'string' ? body.command.trim() : ''
    const dryRun = body.dry_run !== false // varsayılan: true (gerçek DB yazma yapma)

    if (!command) {
      return NextResponse.json({ error: 'command alanı gerekli.' }, { status: 400 })
    }

    // ─── Adım 1: Güvenlik Kontrolü (3 Duvar) ────────────────────────────
    const t1 = Date.now()
    const guvenlik = ucDuvarKontrol({ message: command })
    adimlar.push({
      adim: 1,
      ad: 'Güvenlik Kontrolü (3 Duvar)',
      durum: guvenlik.sonuc === 'engellendi' ? 'basarisiz' : 'basarili',
      detay: guvenlik.sonuc === 'engellendi'
        ? `Engellendi: ${guvenlik.engel_sebebi}`
        : `Geçti (${guvenlik.uyarilar.length} uyarı)`,
      sure_ms: Date.now() - t1,
    })

    if (guvenlik.sonuc === 'engellendi') {
      return NextResponse.json({
        ok: false,
        test_suresi_ms: Date.now() - baslangic,
        adimlar,
        sonuc: 'Güvenlik engeli — akış durdu.',
        guvenlik_detay: guvenlik,
      })
    }

    // ─── Adım 2: CIO Yönlendirme ───────────────────────────────────────
    const t2 = Date.now()
    const directorKey = routeToDirector(command)
    adimlar.push({
      adim: 2,
      ad: 'CIO Yönlendirme (routeToDirector)',
      durum: directorKey ? 'basarili' : 'basarisiz',
      detay: directorKey
        ? `Direktörlük: ${directorKey} (${CELF_DIRECTORATES[directorKey]?.name ?? '?'})`
        : 'Direktörlük belirlenemedi.',
      sure_ms: Date.now() - t2,
    })

    if (!directorKey) {
      return NextResponse.json({
        ok: false,
        test_suresi_ms: Date.now() - baslangic,
        adimlar,
        sonuc: 'Direktörlük belirlenemedi — akış durdu.',
      })
    }

    // ─── Adım 3: CELF Denetim (Veri erişim + koruma + onay) ────────────
    const t3 = Date.now()
    const director = CELF_DIRECTORATES[directorKey]
    const guvenlikCelf = ucDuvarKontrol({
      message: command,
      directorKey,
      requiredData: director.dataAccess ?? [],
    })
    adimlar.push({
      adim: 3,
      ad: 'CELF Denetim (3. Duvar)',
      durum: guvenlikCelf.duvarlar.celf_denetim.gecti ? 'basarili' : 'basarisiz',
      detay: guvenlikCelf.duvarlar.celf_denetim.detay,
      sure_ms: Date.now() - t3,
    })

    // ─── Adım 4: CELF Çalıştırma (simülasyon — gerçek AI çağrısı yok) ──
    const t4 = Date.now()
    const simulasyonSonuc = `[TEST] ${directorKey} direktörlüğü "${command}" komutunu başarıyla işledi. AI: ${director.aiProviders.join(', ')}. Araçlar: ${(director.tools ?? []).join(', ') || 'yok'}.`
    adimlar.push({
      adim: 4,
      ad: 'CELF Direktörlük Çalıştırma (simülasyon)',
      durum: 'basarili',
      detay: `Simüle: ${directorKey} — ${director.name}. Gerçek AI çağrısı yapılmadı.`,
      sure_ms: Date.now() - t4,
    })

    // ─── Adım 5: Veri Arşivleme (task_results) ─────────────────────────
    const t5 = Date.now()
    if (!dryRun) {
      const arsiv = await createTaskResult({
        director_key: directorKey,
        ai_providers: director.aiProviders,
        input_command: `[TEST] ${command}`,
        output_result: simulasyonSonuc,
        status: 'completed',
      })
      adimlar.push({
        adim: 5,
        ad: 'Veri Arşivleme (task_results)',
        durum: arsiv.error ? 'basarisiz' : 'basarili',
        detay: arsiv.error ? `Arşivleme hatası: ${arsiv.error}` : `Arşivlendi: ${arsiv.id}`,
        sure_ms: Date.now() - t5,
      })
    } else {
      adimlar.push({
        adim: 5,
        ad: 'Veri Arşivleme (task_results)',
        durum: 'atlanmis',
        detay: 'dry_run=true — gerçek kayıt yapılmadı.',
        sure_ms: Date.now() - t5,
      })
    }

    // ─── Adım 6: Güvenlik Logu ──────────────────────────────────────────
    const t6 = Date.now()
    if (!dryRun) {
      const log = await createSecurityLog({
        event_type: 'celf_test_akis',
        severity: 'sari',
        description: `Test akışı tamamlandı: ${directorKey} — ${command.substring(0, 100)}`,
        blocked: false,
      })
      adimlar.push({
        adim: 6,
        ad: 'Güvenlik Logu',
        durum: log.error ? 'basarisiz' : 'basarili',
        detay: log.error ? `Log hatası: ${log.error}` : `Loglandı: ${log.id}`,
        sure_ms: Date.now() - t6,
      })
    } else {
      adimlar.push({
        adim: 6,
        ad: 'Güvenlik Logu',
        durum: 'atlanmis',
        detay: 'dry_run=true — log yazılmadı.',
        sure_ms: Date.now() - t6,
      })
    }

    // ─── Adım 7: Patron Onay Kuyruğu (simülasyon) ──────────────────────
    const t7 = Date.now()
    const patronOnayi = guvenlik.patron_onayi_gerekli
    adimlar.push({
      adim: 7,
      ad: 'Patron Onay Kuyruğu',
      durum: 'basarili',
      detay: patronOnayi
        ? 'Patron onayı gerekiyor — onay kuyruğuna eklenir.'
        : 'Patron onayı gerekmiyor — otomatik onay.',
      sure_ms: Date.now() - t7,
    })

    const toplamSure = Date.now() - baslangic
    const basariliAdimlar = adimlar.filter((a) => a.durum === 'basarili').length
    const toplamAdim = adimlar.length

    return NextResponse.json({
      ok: true,
      test_suresi_ms: toplamSure,
      basarili_adim: basariliAdimlar,
      toplam_adim: toplamAdim,
      sonuc: `Uçtan uca test tamamlandı: ${basariliAdimlar}/${toplamAdim} adım başarılı.`,
      adimlar,
      akis: {
        komut: command,
        directorluk: directorKey,
        directorluk_adi: director.name,
        ai_providers: director.aiProviders,
        tools: director.tools ?? [],
        patron_onayi_gerekli: patronOnayi,
        dry_run: dryRun,
      },
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({
      ok: false,
      test_suresi_ms: Date.now() - baslangic,
      adimlar,
      error: 'Test akışı hatası',
      detail: err,
    }, { status: 500 })
  }
}
