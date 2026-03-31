/**
 * POST /api/onboarding/logo-generate
 * Fal AI ile logo onerisi uretir.
 * Body: { tesis_adi, style: 'minimalist' | 'colorful' | 'text-based' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const FAL_BASE = 'https://fal.run'

function getFalKey(): string | undefined {
  const k = process.env.FAL_KEY ?? process.env.FAL_API_KEY
  return typeof k === 'string' ? k.trim() || undefined : undefined
}

const STYLE_PROMPTS: Record<string, string> = {
  minimalist: 'Clean minimalist logo design, simple geometric shapes, single color, modern, flat design, professional sports facility branding',
  colorful: 'Vibrant colorful logo design, dynamic shapes, multiple bright colors, energetic, youth sports center logo, gradient effects',
  'text-based': 'Typography-based logo design, bold modern font, clean lettering, professional text logo, sports facility management branding',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })
    }

    const body = await req.json()
    const { tesis_adi, style } = body as { tesis_adi?: string; style?: string }

    const tesisAdi = tesis_adi?.trim() || 'Örnek Spor Tesisi'
    const logoStyle = style && STYLE_PROMPTS[style] ? style : 'minimalist'
    const stylePrompt = STYLE_PROMPTS[logoStyle]

    const falKey = getFalKey()
    if (!falKey) {
      // Fal key yoksa placeholder logo URL dondur
      return NextResponse.json({
        ok: true,
        logo_url: null,
        placeholder: true,
        message: 'Fal AI yapilandirilmamis. Logo daha sonra yuklenebilir.',
      })
    }

    const prompt = `${stylePrompt}. Logo for "${tesisAdi}". White background, centered, high quality, vector style, no text unless text-based style. Square format, suitable for web and mobile.`

    const res = await fetch(`${FAL_BASE}/fal-ai/flux/schnell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square',
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 500)
      console.error('[onboarding/logo-generate] Fal error:', errText)
      return NextResponse.json({
        ok: false,
        error: `Logo uretilemedi (${res.status})`,
        placeholder: true,
      }, { status: 502 })
    }

    const data = await res.json() as { images?: Array<{ url?: string }> }
    const imageUrl = data?.images?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({
        ok: false,
        error: 'Logo URL donmedi',
        placeholder: true,
      }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      logo_url: imageUrl,
      style: logoStyle,
      placeholder: false,
    })
  } catch (e) {
    console.error('[onboarding/logo-generate] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
