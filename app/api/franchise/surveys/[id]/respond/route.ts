import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export const dynamic = 'force-dynamic'

function getService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

/** POST — veli anket yanıtı gönderir */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ error: 'Tenant atanmamış' }, { status: 403 })

    const body = await req.json()
    const answers = Array.isArray(body.answers) ? body.answers : []
    if (answers.length === 0) {
      return NextResponse.json({ error: 'En az bir yanıt gerekli' }, { status: 400 })
    }

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    // Anketin aktif olduğunu kontrol et
    const { data: survey, error: surveyErr } = await service
      .from('tenant_surveys')
      .select('id, status, tenant_id')
      .eq('id', surveyId)
      .eq('tenant_id', tenantId)
      .single()

    if (surveyErr || !survey) {
      return NextResponse.json({ error: 'Anket bulunamadı' }, { status: 404 })
    }
    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'Bu anket şu an aktif değil' }, { status: 400 })
    }

    // Yanıt kaydet (upsert — aynı kullanıcı tekrar yanıtlarsa güncelle)
    const { data, error } = await service
      .from('survey_responses')
      .upsert(
        {
          survey_id: surveyId,
          user_id: user.id,
          tenant_id: tenantId,
          answers,
        },
        { onConflict: 'survey_id,user_id' }
      )
      .select('id, survey_id, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item: data })
  } catch (e) {
    console.error('[franchise/surveys/respond POST]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
