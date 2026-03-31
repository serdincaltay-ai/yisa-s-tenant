/**
 * Franchise paneli: Şablon kullanımı kaydet
 * Giriş yapan kullanıcının tenant'ı için template kullanımını tenant_templates'e yazar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const body = await req.json()
    const templateId = body.template_id as string | undefined
    const templateSource = (body.template_source as 'templates' | 'ceo_templates') ?? 'ceo_templates'

    if (!templateId) return NextResponse.json({ error: 'template_id gerekli' }, { status: 400 })
    if (!['templates', 'ceo_templates'].includes(templateSource)) {
      return NextResponse.json({ error: 'template_source: templates veya ceo_templates' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    let tenantId: string | null = null
    const { data: ut } = await service.from('user_tenants').select('tenant_id').eq('user_id', user.id).limit(1).maybeSingle()
    tenantId = ut?.tenant_id ?? null
    if (!tenantId) {
      const { data: t } = await service.from('tenants').select('id').eq('owner_id', user.id).limit(1).maybeSingle()
      tenantId = t?.id ?? null
    }
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const { data, error } = await service
      .from('tenant_templates')
      .upsert(
        {
          tenant_id: tenantId,
          template_id: templateId,
          template_source: templateSource,
          used_by_user_id: user.id,
          used_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,template_id,template_source' }
      )
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('[franchise/template-use]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
