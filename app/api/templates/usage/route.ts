/**
 * Tenant-şablon kullanımı API
 * GET: Tüm kullanımları listele (tenant, şablon, kim kullandı)
 * POST: Kullanım kaydet (tenant_id, template_id, template_source, used_by_user_id)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ items: [] })

    const { data: rows, error } = await supabase
      .from('tenant_templates')
      .select('id, tenant_id, template_id, template_source, used_by_user_id, used_at, notes, created_at')
      .order('used_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ items: [], error: error.message })

    const tenantIds = [...new Set((rows ?? []).map((r: Record<string, unknown>) => r.tenant_id).filter(Boolean))]
    const tenantMap: Record<string, { name?: string; slug?: string }> = {}
    if (tenantIds.length > 0) {
      const { data: tenantRows } = await supabase
        .from('tenants')
        .select('id, name, ad, slug')
        .in('id', tenantIds)
      for (const t of tenantRows ?? []) {
        const r = t as Record<string, unknown>
        tenantMap[String(r.id)] = { name: String(r.name ?? r.ad ?? r.slug ?? '—'), slug: String(r.slug ?? '') }
      }
    }

    const items = (rows ?? []).map((row: Record<string, unknown>) => {
      const tid = String(row.tenant_id ?? '')
      const t = tenantMap[tid]
      return {
        id: row.id,
        tenant_id: row.tenant_id,
        tenant_name: t?.name ?? '—',
        template_id: row.template_id,
        template_source: row.template_source,
        used_by_user_id: row.used_by_user_id,
        used_at: row.used_at,
        notes: row.notes,
        created_at: row.created_at,
      }
    })

    return NextResponse.json({ items })
  } catch (e) {
    console.error('[templates/usage]', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const tenantId = body.tenant_id as string | undefined
    const templateId = body.template_id as string | undefined
    const templateSource = body.template_source as 'templates' | 'ceo_templates' | undefined
    const usedByUserId = body.used_by_user_id as string | undefined
    const notes = body.notes as string | undefined

    if (!tenantId || !templateId || !templateSource) {
      return NextResponse.json(
        { error: 'tenant_id, template_id, template_source gerekli' },
        { status: 400 }
      )
    }
    if (!['templates', 'ceo_templates'].includes(templateSource)) {
      return NextResponse.json(
        { error: 'template_source: templates veya ceo_templates olmalı' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase yok' }, { status: 500 })

    const { data, error } = await supabase
      .from('tenant_templates')
      .upsert(
        {
          tenant_id: tenantId,
          template_id: templateId,
          template_source: templateSource,
          used_by_user_id: usedByUserId ?? null,
          notes: notes ?? null,
          used_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,template_id,template_source' }
      )
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('[templates/usage] POST', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
