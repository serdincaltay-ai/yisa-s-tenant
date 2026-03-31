/**
 * YİSA-S Fal Intro Video API
 * Fuar/tanıtım için 8 sn intro — logo, slogan, Serdinç Altay, çocuklara yönelik
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateIntroVideo, YISA_SLOGANS } from '@/lib/api/fal-client'
import { requireAuth } from '@/lib/auth/api-auth'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = await req.json().catch(() => ({}))
    const sloganIndex = typeof body.slogan_index === 'number' ? body.slogan_index : undefined
    const result = await generateIntroVideo(sloganIndex)
    if (result.ok) {
      return NextResponse.json({
        ok: true,
        video_url: result.video_url,
        request_id: result.request_id,
      })
    }
    return NextResponse.json({ ok: false, error: 'error' in result ? result.error : 'Bilinmeyen hata' }, { status: 400 })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ slogans: YISA_SLOGANS })
}
