/**
 * POST /api/email/send
 * Admin-only email gonderim endpoint'i.
 * Body: { to, subject, html, template?, templateData?, from?, replyTo? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import { sendEmail } from '@/lib/email/resend'
import { render } from '@react-email/components'
import { Hosgeldiniz, type HosgeldinizProps } from '@/lib/email/templates/hosgeldiniz'
import { YoklamaHatirlatma, type YoklamaHatirlatmaProps } from '@/lib/email/templates/yoklama-hatirlatma'
import { AidatHatirlatma, type AidatHatirlatmaProps } from '@/lib/email/templates/aidat-hatirlatma'
import { Duyuru, type DuyuruProps } from '@/lib/email/templates/duyuru'

export const dynamic = 'force-dynamic'

type TemplateName = 'hosgeldiniz' | 'yoklama-hatirlatma' | 'aidat-hatirlatma' | 'duyuru'

async function renderTemplate(template: TemplateName, data: Record<string, unknown>): Promise<string> {
  switch (template) {
    case 'hosgeldiniz':
      return await render(Hosgeldiniz(data as unknown as HosgeldinizProps))
    case 'yoklama-hatirlatma':
      return await render(YoklamaHatirlatma(data as unknown as YoklamaHatirlatmaProps))
    case 'aidat-hatirlatma':
      return await render(AidatHatirlatma(data as unknown as AidatHatirlatmaProps))
    case 'duyuru':
      return await render(Duyuru(data as unknown as DuyuruProps))
    default:
      throw new Error(`Bilinmeyen template: ${template}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    // Admin yetki kontrolu
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()

    const to = body.to as string | string[] | undefined
    const subject = body.subject as string | undefined
    const from = body.from as string | undefined
    const replyTo = body.replyTo as string | undefined

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'to ve subject alanları zorunludur.' },
        { status: 400 }
      )
    }

    let html: string

    // Template kullaniliyorsa renderla, yoksa direkt html al
    const templateName = body.template as TemplateName | undefined
    if (templateName) {
      const templateData = (body.templateData ?? {}) as Record<string, unknown>
      const validTemplates: TemplateName[] = ['hosgeldiniz', 'yoklama-hatirlatma', 'aidat-hatirlatma', 'duyuru']
      if (!validTemplates.includes(templateName)) {
        return NextResponse.json(
          { error: `Geçersiz template. Geçerli değerler: ${validTemplates.join(', ')}` },
          { status: 400 }
        )
      }
      html = await renderTemplate(templateName, templateData)
    } else {
      html = body.html as string | undefined ?? ''
      if (!html) {
        return NextResponse.json(
          { error: 'html veya template alanı gerekli.' },
          { status: 400 }
        )
      }
    }

    const result = await sendEmail(to, subject, html, { from, replyTo })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Email gönderilemedi.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, id: result.id })
  } catch (e) {
    console.error('[api/email/send] Error:', e)
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Sunucu hatası: ${msg}` }, { status: 500 })
  }
}
