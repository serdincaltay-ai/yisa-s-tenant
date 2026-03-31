/**
 * POST /api/onboarding/logo-upload
 * Onboarding sirasinda logo yukleme — henuz tenant olmadan gecici storage'a yukler.
 * Dosya FormData ile gonderilir (field: "file")
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli. FormData field: "file"' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Desteklenmeyen dosya turu: ${file.type}. Izin verilen: PNG, JPEG, WebP` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu cok buyuk. Maksimum 2 MB.' },
        { status: 400 }
      )
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapilandirma hatasi' }, { status: 500 })
    }
    const service = createServiceClient(url, key)

    // Gecici klasore yukle: onboarding/{user_id}/logo
    const filePath = `onboarding/${user.id}/logo`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await service.storage
      .from('tenant-logos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[onboarding/logo-upload] Upload error:', uploadError)
      return NextResponse.json({ error: 'Logo yuklenemedi: ' + uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = service.storage
      .from('tenant-logos')
      .getPublicUrl(filePath)

    return NextResponse.json({
      ok: true,
      logo_url: publicUrlData.publicUrl,
    })
  } catch (e) {
    console.error('[onboarding/logo-upload] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
