/**
 * v0 Tasarım API — Tasarım promptu alır, v0'a gönderir, sonucu döner
 * Ham komut gösterilmez; sadece tasarım çıktısı
 */

import { NextRequest, NextResponse } from 'next/server'
import { v0Generate } from '@/lib/api/v0-client'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof Response) return auth

    const body = await req.json().catch(() => ({}))
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) {
      return NextResponse.json({ error: 'Tasarım açıklaması gerekli.', ok: false }, { status: 400 })
    }

    const result = await v0Generate(prompt)
    if ('error' in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      text: result.text,
      model: result.model,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
