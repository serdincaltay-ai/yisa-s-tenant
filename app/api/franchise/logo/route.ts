/**
 * POST /api/franchise/logo
 * Logo yükleme — Supabase Storage bucket: tenant-logos
 * Dosya FormData ile gönderilir (field: "file")
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

async function getTenantId(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const service = createServiceClient(url, key)
  const { data: ut } = await service.from('user_tenants').select('tenant_id').eq('user_id', userId).limit(1).maybeSingle()
  if (ut?.tenant_id) return ut.tenant_id
  const { data: t } = await service.from('tenants').select('id').eq('owner_id', userId).limit(1).maybeSingle()
  return t?.id ?? null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'Tesis atanmamış' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli. FormData field: "file"' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Desteklenmeyen dosya türü: ${file.type}. İzin verilen: PNG, JPEG, WebP` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu çok büyük. Maksimum 2 MB.' },
        { status: 400 }
      )
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    const service = createServiceClient(url, key)

    // Sabit dosya adı: tenant_id/logo (upsert ile üzerine yazar)
    const filePath = `${tenantId}/logo`

    const buffer = Buffer.from(await file.arrayBuffer())

    // Önce yükle (upsert: true) — eski dosya korunur, hata olursa bozulmaz
    const { error: uploadError } = await service.storage
      .from('tenant-logos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[franchise/logo] Upload error:', uploadError)
      return NextResponse.json({ error: 'Logo yüklenemedi: ' + uploadError.message }, { status: 500 })
    }

    // Yükleme başarılı — eski farklı adlı dosyaları temizle (orphan cleanup)
    const { data: existingFiles } = await service.storage.from('tenant-logos').list(tenantId)
    if (existingFiles?.length) {
      const staleFiles = existingFiles
        .filter((f: { name: string }) => f.name !== 'logo')
        .map((f: { name: string }) => `${tenantId}/${f.name}`)
      if (staleFiles.length > 0) {
        await service.storage.from('tenant-logos').remove(staleFiles)
      }
    }

    // Public URL oluştur
    const { data: publicUrlData } = service.storage
      .from('tenant-logos')
      .getPublicUrl(filePath)

    const logoUrl = publicUrlData.publicUrl

    // tenants tablosunu güncelle
    const { error: updateError } = await service
      .from('tenants')
      .update({ logo_url: logoUrl })
      .eq('id', tenantId)

    if (updateError) {
      console.error('[franchise/logo] DB update error:', updateError)
      return NextResponse.json({ error: 'Logo URL kaydedilemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, logo_url: logoUrl })
  } catch (e) {
    console.error('[franchise/logo] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
