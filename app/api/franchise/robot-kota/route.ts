import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { getQuotaSummary } from '@/lib/robots/quota'

export const dynamic = 'force-dynamic'

/**
 * GET /api/franchise/robot-kota
 * Franchise panelinde robot kota özeti gösterir.
 * Kullanıcı kimlik doğrulaması + tenant çözümlemesi yapar.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })
    }

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })
    }

    // Tenant paket tipini bul
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    }

    const service = createServiceClient(url, key)
    const { data: tenant } = await service
      .from('tenants')
      .select('package_type')
      .eq('id', tenantId)
      .maybeSingle()

    const paketTipi = (tenant?.package_type as string) ?? 'starter'

    const ozet = await getQuotaSummary(tenantId, paketTipi)

    return NextResponse.json({ ok: true, paketTipi, kotalar: ozet })
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: mesaj }, { status: 500 })
  }
}
