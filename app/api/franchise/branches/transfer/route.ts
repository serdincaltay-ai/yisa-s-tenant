import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

/**
 * POST /api/franchise/branches/transfer
 * Personel veya öğrenciyi bir şubeden diğerine transfer eder.
 * Body: { entity_type: 'staff'|'athlete', entity_id, hedef_branch_id, neden? }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const entityType = body.entity_type as string
    const entityId = body.entity_id as string
    const hedefBranchId = body.hedef_branch_id as string
    const neden = typeof body.neden === 'string' ? body.neden.trim() : null

    if (!entityType || !['staff', 'athlete'].includes(entityType)) {
      return NextResponse.json({ error: 'Geçersiz entity_type (staff veya athlete olmalı)' }, { status: 400 })
    }
    if (!entityId || !hedefBranchId) {
      return NextResponse.json({ error: 'entity_id ve hedef_branch_id zorunludur' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Hedef şubenin bu tenant'a ait olduğunu doğrula
    const { data: hedefBranch } = await service
      .from('tenant_branches')
      .select('id')
      .eq('id', hedefBranchId)
      .eq('tenant_id', tenantId)
      .single()

    if (!hedefBranch) {
      return NextResponse.json({ error: 'Hedef şube bulunamadı' }, { status: 404 })
    }

    const table = entityType === 'staff' ? 'staff' : 'athletes'

    // Mevcut kayıdı bul ve kaynak branch_id'yi al
    const { data: entity } = await service
      .from(table)
      .select('id, branch_id')
      .eq('id', entityId)
      .eq('tenant_id', tenantId)
      .single()

    if (!entity) {
      return NextResponse.json({ error: `${entityType === 'staff' ? 'Personel' : 'Öğrenci'} bulunamadı` }, { status: 404 })
    }

    const kaynakBranchId = (entity as { id: string; branch_id: string | null }).branch_id

    // Transfer et
    const { error: updateError } = await service
      .from(table)
      .update({ branch_id: hedefBranchId })
      .eq('id', entityId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Transfer log kaydı
    await service.from('branch_transfers').insert({
      tenant_id: tenantId,
      kaynak_branch_id: kaynakBranchId,
      hedef_branch_id: hedefBranchId,
      entity_type: entityType,
      entity_id: entityId,
      transfer_eden_user_id: user.id,
      neden,
    })

    return NextResponse.json({ ok: true, message: 'Transfer başarılı' })
  } catch (e) {
    console.error('[branches/transfer POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * GET /api/franchise/branches/transfer
 * Transfer geçmişini listeler.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    const { data, error } = await service
      .from('branch_transfers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[branches/transfer GET]', e)
    return NextResponse.json({ items: [] })
  }
}
