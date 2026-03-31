import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/** Public: slug ile tenant, yarışmacı antrenörler ve federasyon bilgisi. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    if (!slug) return NextResponse.json({ error: 'Slug gerekli' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createClient(url, key)
    const { data: tenant, error: tenantErr } = await service
      .from('tenants')
      .select('id, name, ad, slug, description, phone, address, primary_color, logo_url')
      .eq('slug', slug)
      .maybeSingle()
    if (tenantErr || !tenant) return NextResponse.json({ error: 'Tesis bulunamadı' }, { status: 404 })

    const [coachesRes, fedRes] = await Promise.all([
      service
        .from('staff')
        .select('id, name, surname, branch, license_type, bio, photo_url')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .eq('is_competitive_coach', true)
        .order('name'),
      service
        .from('federation_info')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      tenant,
      coaches: coachesRes.data ?? [],
      federationInfo: fedRes.data ?? [],
    })
  } catch (e) {
    console.error('[tesis/[slug] GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
