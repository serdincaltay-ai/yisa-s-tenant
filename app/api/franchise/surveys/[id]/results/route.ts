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

interface SurveyQuestion {
  id: string
  text: string
  type: 'multiple_choice' | 'open_ended' | 'rating'
  options?: string[]
}

interface SurveyAnswer {
  questionId: string
  value: string | number
}

interface ResponseRow {
  id: string
  answers: SurveyAnswer[]
  created_at: string
}

/** GET — anket sonuçları (franchise admin) */
export async function GET(
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

    const service = getService()
    if (!service) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    // Anketi getir
    const { data: survey, error: surveyErr } = await service
      .from('tenant_surveys')
      .select('id, title, description, questions, status, created_at')
      .eq('id', surveyId)
      .eq('tenant_id', tenantId)
      .single()

    if (surveyErr || !survey) {
      return NextResponse.json({ error: 'Anket bulunamadı' }, { status: 404 })
    }

    // Yanıtları getir
    const { data: responses, error: respErr } = await service
      .from('survey_responses')
      .select('id, answers, created_at')
      .eq('survey_id', surveyId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (respErr) {
      return NextResponse.json({ error: respErr.message }, { status: 500 })
    }

    const questions = (survey.questions ?? []) as SurveyQuestion[]
    const allResponses = (responses ?? []) as ResponseRow[]
    const totalResponses = allResponses.length

    // Her soru için özet istatistik hesapla
    const summary = questions.map((q) => {
      const questionAnswers = allResponses
        .map((r) => r.answers.find((a) => a.questionId === q.id))
        .filter(Boolean) as SurveyAnswer[]

      if (q.type === 'multiple_choice') {
        const distribution: Record<string, number> = {}
        for (const opt of q.options ?? []) {
          distribution[opt] = 0
        }
        for (const a of questionAnswers) {
          const val = String(a.value)
          distribution[val] = (distribution[val] ?? 0) + 1
        }
        return { questionId: q.id, text: q.text, type: q.type, distribution, count: questionAnswers.length }
      }

      if (q.type === 'rating') {
        const values = questionAnswers.map((a) => Number(a.value)).filter((v) => !isNaN(v))
        const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
        const distribution: Record<string, number> = {}
        for (let i = 1; i <= 5; i++) distribution[String(i)] = 0
        for (const v of values) distribution[String(v)] = (distribution[String(v)] ?? 0) + 1
        return { questionId: q.id, text: q.text, type: q.type, average: Math.round(avg * 100) / 100, distribution, count: values.length }
      }

      // open_ended
      const texts = questionAnswers.map((a) => String(a.value)).filter((t) => t.trim())
      return { questionId: q.id, text: q.text, type: q.type, answers: texts.slice(0, 50), count: texts.length }
    })

    return NextResponse.json({
      survey: { id: survey.id, title: survey.title, description: survey.description, status: survey.status },
      totalResponses,
      summary,
    })
  } catch (e) {
    console.error('[franchise/surveys/results GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
