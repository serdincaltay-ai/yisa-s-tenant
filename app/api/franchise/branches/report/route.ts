import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/franchise/branches/report
 * Şube bazlı karşılaştırma raporu döner.
 * Her şube için: personel sayısı, öğrenci sayısı, aktif öğrenci, ödeme toplamları
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ subeler: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ subeler: [] })

    const service = createServiceClient(url, key)

    // Şubeleri al
    const { data: branches } = await service
      .from('tenant_branches')
      .select('id, ad, slug, renk, ikon, aktif')
      .eq('tenant_id', tenantId)
      .eq('aktif', true)
      .order('ad')

    if (!branches || branches.length === 0) {
      return NextResponse.json({ subeler: [] })
    }

    // Personel sayıları
    const { data: staffCounts } = await service
      .from('staff')
      .select('branch_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    // Öğrenci sayıları
    const { data: athleteCounts } = await service
      .from('athletes')
      .select('branch_id, status')
      .eq('tenant_id', tenantId)

    // Rapor oluştur
    const report = branches.map((branch) => {
      const staffCount = (staffCounts ?? []).filter((s) => s.branch_id === branch.id).length
      const allAthletes = (athleteCounts ?? []).filter((a) => a.branch_id === branch.id)
      const activeAthletes = allAthletes.filter((a) => a.status === 'active').length
      const totalAthletes = allAthletes.length

      return {
        id: branch.id,
        ad: branch.ad,
        slug: branch.slug,
        renk: branch.renk,
        ikon: branch.ikon,
        personel_sayisi: staffCount,
        ogrenci_sayisi: totalAthletes,
        aktif_ogrenci: activeAthletes,
      }
    })

    // Atanmamış kayıtlar
    const unassignedStaff = (staffCounts ?? []).filter((s) => !s.branch_id).length
    const unassignedAthletes = (athleteCounts ?? []).filter((a) => !a.branch_id).length

    // En iyi/en kötü şube
    const sorted = [...report].sort((a, b) => b.aktif_ogrenci - a.aktif_ogrenci)
    const enIyi = sorted[0] ?? null
    const enKotu = sorted[sorted.length - 1] ?? null

    return NextResponse.json({
      subeler: report,
      ozet: {
        toplam_sube: report.length,
        toplam_personel: (staffCounts ?? []).length,
        toplam_ogrenci: (athleteCounts ?? []).length,
        atanmamis_personel: unassignedStaff,
        atanmamis_ogrenci: unassignedAthletes,
        en_iyi_sube: enIyi ? { ad: enIyi.ad, ogrenci: enIyi.aktif_ogrenci } : null,
        en_kotu_sube: enKotu ? { ad: enKotu.ad, ogrenci: enKotu.aktif_ogrenci } : null,
      },
    })
  } catch (e) {
    console.error('[branches/report GET]', e)
    return NextResponse.json({ subeler: [], error: 'Sunucu hatası' }, { status: 500 })
  }
}
