/**
 * POST /api/onboarding/step
 * Onboarding adimini ilerletir ve veriyi kaydeder.
 * Body: { session_id, step, data }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })
    }

    const body = await req.json()
    const { session_id, step, data } = body as {
      session_id: string
      step: number
      data: Record<string, unknown>
    }

    if (!session_id || typeof step !== 'number') {
      return NextResponse.json({ error: 'session_id ve step gerekli' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapilandirma hatasi' }, { status: 500 })
    }
    const service = createServiceClient(url, key)

    // Mevcut session'i getir
    const { data: session, error: fetchErr } = await service
      .from('onboarding_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !session) {
      return NextResponse.json({ error: 'Oturum bulunamadi' }, { status: 404 })
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Oturum zaten tamamlanmis' }, { status: 400 })
    }

    // Mevcut data ile yeni data'yi birlestir
    const mergedData = { ...(session.data as Record<string, unknown>), ...data }

    // Sonraki adim: step + 1, max 7 (onizleme adimi)
    const nextStep = Math.min(step + 1, 7)

    const { error: updateErr } = await service
      .from('onboarding_sessions')
      .update({
        current_step: nextStep,
        data: mergedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id)

    if (updateErr) {
      console.error('[onboarding/step] Update error:', updateErr)
      return NextResponse.json({ error: 'Adim guncellenemedi' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      current_step: nextStep,
      data: mergedData,
    })
  } catch (e) {
    console.error('[onboarding/step] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
