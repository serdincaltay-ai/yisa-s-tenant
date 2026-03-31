/**
 * POST /api/onboarding/start
 * Robot onboarding oturumunu baslatir.
 * Kimlik dogrulamasi yapilir, tenant yoksa yeni bir onboarding session olusturulur.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapilandirma hatasi' }, { status: 500 })
    }
    const service = createServiceClient(url, key)

    // Kullanicinin mevcut tenant'i var mi kontrol et
    const { data: existingTenant } = await service
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    // Mevcut onboarding session var mi kontrol et
    const { data: existingSession } = await service
      .from('onboarding_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSession) {
      return NextResponse.json({
        ok: true,
        session_id: existingSession.id,
        current_step: existingSession.current_step,
        data: existingSession.data,
        has_tenant: !!existingTenant?.tenant_id,
        resumed: true,
      })
    }

    // Yeni session olustur
    const { data: newSession, error: insertErr } = await service
      .from('onboarding_sessions')
      .insert({
        user_id: user.id,
        current_step: 1,
        status: 'in_progress',
        data: {},
      })
      .select('id, current_step, data')
      .single()

    if (insertErr) {
      console.error('[onboarding/start] Insert error:', insertErr)
      return NextResponse.json({ error: 'Oturum olusturulamadi: ' + insertErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      session_id: newSession.id,
      current_step: newSession.current_step,
      data: newSession.data,
      has_tenant: !!existingTenant?.tenant_id,
      resumed: false,
    })
  } catch (e) {
    console.error('[onboarding/start] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
