import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const { searchParams } = new URL(req.url)
    const athleteId = searchParams.get('athlete_id')

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    let query = service
      .from('student_packages')
      .select(`
        id,
        athlete_id,
        package_id,
        toplam_seans,
        kalan_seans,
        baslangic_tarihi,
        bitis_tarihi,
        status,
        created_at,
        athletes(name, surname),
        seans_packages(name, seans_count, price)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'aktif')
      .order('created_at', { ascending: false })
      .not('athlete_id', 'is', null)

    if (athleteId) query = query.eq('athlete_id', athleteId)

    const { data, error } = await query

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[student-packages GET]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const athleteId = body.athlete_id ?? body.student_id
    const packageId = body.package_id
    const taksitSayisi = Math.min(12, Math.max(1, parseInt(String(body.taksit_sayisi ?? 1), 10)))
    const baslangicTarihi = typeof body.baslangic_tarihi === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.baslangic_tarihi)
      ? body.baslangic_tarihi
      : new Date().toISOString().slice(0, 10)

    if (!athleteId || !packageId) {
      return NextResponse.json({ error: 'athlete_id ve package_id zorunludur' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    const { data: pkg } = await service
      .from('seans_packages')
      .select('seans_count, price')
      .eq('id', packageId)
      .eq('tenant_id', tenantId)
      .single()

    if (!pkg) return NextResponse.json({ error: 'Paket bulunamadı' }, { status: 404 })

    const toplamSeans = pkg.seans_count
    const toplamTutar = Number(pkg.price)
    const taksitTutari = Number((toplamTutar / taksitSayisi).toFixed(2))

    const { data: sp, error: spError } = await service
      .from('student_packages')
      .insert({
        tenant_id: tenantId,
        athlete_id: athleteId,
        package_id: packageId,
        toplam_seans: toplamSeans,
        kalan_seans: toplamSeans,
        baslangic_tarihi: baslangicTarihi,
        status: 'aktif',
      })
      .select()
      .single()

    if (spError) return NextResponse.json({ error: spError.message }, { status: 500 })
    const studentPackageId = sp?.id

    const payments: Array<{
      tenant_id: string
      athlete_id: string
      student_package_id: string
      amount: number
      due_date: string
      taksit_no: number
      toplam_taksit: number
      status: string
    }> = []
    const baslangic = new Date(baslangicTarihi)
    for (let i = 0; i < taksitSayisi; i++) {
      const due = new Date(baslangic)
      due.setMonth(due.getMonth() + i)
      const dueStr = due.toISOString().slice(0, 10)
      payments.push({
        tenant_id: tenantId,
        athlete_id: athleteId,
        student_package_id: studentPackageId,
        amount: i === taksitSayisi - 1 ? toplamTutar - taksitTutari * (taksitSayisi - 1) : taksitTutari,
        due_date: dueStr,
        taksit_no: i + 1,
        toplam_taksit: taksitSayisi,
        status: 'bekliyor',
      })
    }

    const { error: payError } = await service.from('package_payments').insert(payments)
    if (payError) {
      await service.from('student_packages').delete().eq('id', studentPackageId)
      return NextResponse.json({ error: payError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, student_package: sp, taksit_sayisi: taksitSayisi })
  } catch (e) {
    console.error('[student-packages POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
