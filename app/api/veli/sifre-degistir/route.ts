/**
 * POST /api/veli/sifre-degistir
 * Veli ilk giris sifre degisimi
 * Body: { new_password: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    const body = await req.json()
    const newPassword = typeof body.new_password === 'string' ? body.new_password.trim() : ''

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Sifre en az 6 karakter olmalidir' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
    const service = createServiceClient(url, key)

    // Sifreyi guncelle
    const { error: updateErr } = await service.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...((user.user_metadata ?? {}) as Record<string, unknown>),
      },
      app_metadata: {
        ...((user.app_metadata ?? {}) as Record<string, unknown>),
        password_changed_at: new Date().toISOString(),
      },
    })

    if (updateErr) {
      console.error('[veli/sifre-degistir] Update error:', updateErr)
      return NextResponse.json({ error: 'Sifre degistirilemedi: ' + updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Sifre basariyla degistirildi' })
  } catch (e) {
    console.error('[veli/sifre-degistir] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
