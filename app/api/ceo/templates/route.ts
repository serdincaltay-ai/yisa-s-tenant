/**
 * CEO Şablon Havuzu API (ceo_templates)
 * GET: Şablon listesi veya tek şablon (?id=)
 * POST: Şablon kaydet
 * PATCH: Şablon onayla
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { saveCeoTemplate, getCeoTemplate, approveCeoTemplate, type SaveCeoTemplateParams, type TemplateType } from '@/lib/db/ceo-templates'
import { requireInternalOrPatron } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireInternalOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (id) {
      const { data, error } = await getCeoTemplate(id)
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }
    const db = getSupabaseServer()
    if (!db) return NextResponse.json({ error: 'Supabase bağlantısı yok' }, { status: 500 })
    const { data, error } = await db.from('ceo_templates').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO şablon listesi hatası', detail: err }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth2 = await requireInternalOrPatron(req)
    if (auth2 instanceof NextResponse) return auth2

    const body = await req.json()
    const params: SaveCeoTemplateParams = {
      template_name: body.template_name ?? 'Şablon',
      template_type: (body.template_type ?? 'rapor') as TemplateType,
      director_key: body.director_key,
      content: body.content ?? {},
      variables: body.variables ?? [],
      data_sources: body.data_sources ?? [],
      is_approved: body.is_approved ?? false,
      approved_by: body.approved_by ?? body.user_id,
    }
    const { id, error } = await saveCeoTemplate(params)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO şablon kaydetme hatası', detail: err }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth3 = await requireInternalOrPatron(req)
    if (auth3 instanceof NextResponse) return auth3

    const body = await req.json()
    const id = body.id as string | undefined
    const approved_by = body.approved_by ?? body.user_id as string | undefined
    if (!id || !approved_by) return NextResponse.json({ error: 'id ve approved_by gerekli' }, { status: 400 })
    const { error } = await approveCeoTemplate(id, approved_by)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO şablon onay hatası', detail: err }, { status: 500 })
  }
}
