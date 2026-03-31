import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * GET /api/veli/profil
 * Giriş yapan velinin profil bilgilerini ve bildirim tercihlerini döner.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)

    // Kullanıcı meta verisinden profil bilgileri
    const meta = user.user_metadata ?? {}
    const profile = {
      id: user.id,
      email: user.email ?? '',
      name: (meta.name as string) ?? (meta.full_name as string) ?? '',
      surname: (meta.surname as string) ?? '',
      phone: (meta.phone as string) ?? (user.phone ?? ''),
    }

    // push_preferences tablosundan bildirim tercihleri
    const { data: prefs } = await service
      .from('push_preferences')
      .select('yoklama_notify, odeme_notify, duyuru_notify')
      .eq('user_id', user.id)
      .maybeSingle()

    const preferences = prefs ?? {
      yoklama_notify: true,
      odeme_notify: true,
      duyuru_notify: true,
    }

    return NextResponse.json({ profile, preferences })
  } catch (e) {
    console.error('[veli/profil GET]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * PATCH /api/veli/profil
 * Velinin profil bilgilerini ve/veya bildirim tercihlerini günceller.
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })

    const service = createServiceClient(url, key)
    const body = await req.json()

    // Profil güncelleme (user_metadata)
    if (body.name !== undefined || body.surname !== undefined || body.phone !== undefined) {
      const metaUpdate: Record<string, string> = {}
      if (typeof body.name === 'string') metaUpdate.name = body.name.trim()
      if (typeof body.surname === 'string') metaUpdate.surname = body.surname.trim()
      if (typeof body.phone === 'string') metaUpdate.phone = body.phone.trim()

      const { error: authErr } = await service.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, ...metaUpdate },
      })
      if (authErr) {
        return NextResponse.json({ error: 'Profil güncellenemedi: ' + authErr.message }, { status: 500 })
      }
    }

    // Bildirim tercihleri güncelleme
    if (
      body.yoklama_notify !== undefined ||
      body.odeme_notify !== undefined ||
      body.duyuru_notify !== undefined
    ) {
      // Mevcut tercihleri al
      const { data: existing } = await service
        .from('push_preferences')
        .select('yoklama_notify, odeme_notify, duyuru_notify')
        .eq('user_id', user.id)
        .maybeSingle()

      const prefPayload = {
        user_id: user.id,
        yoklama_notify: body.yoklama_notify ?? existing?.yoklama_notify ?? true,
        odeme_notify: body.odeme_notify ?? existing?.odeme_notify ?? true,
        duyuru_notify: body.duyuru_notify ?? existing?.duyuru_notify ?? true,
        updated_at: new Date().toISOString(),
      }

      const { error: prefErr } = await service
        .from('push_preferences')
        .upsert(prefPayload, { onConflict: 'user_id' })

      if (prefErr) {
        return NextResponse.json({ error: 'Tercih güncellenemedi: ' + prefErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[veli/profil PATCH]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
