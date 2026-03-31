/**
 * ManyChat Webhook — Lead'leri crm_contacts + crm_activities + demo_requests'e yazar
 * ManyChat → External Request veya Webhook → POST /api/webhooks/manychat
 * HMAC-SHA256 imza doğrulama (MANYCHAT_WEBHOOK_SECRET varsa zorunlu)
 * Kaynak: source = 'manychat'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/** HMAC-SHA256 imza doğrulama */
function verifySignature(payload: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret) return true // Secret yoksa doğrulama atla (dev ortam)
  if (!signature) return false // Secret var ama imza yok → reddet
  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

/** ManyChat payload'tan lead bilgisi çıkar */
function parseLead(body: unknown): {
  name: string
  email: string
  phone?: string
  city?: string
  notes?: string
  raw: Record<string, unknown>
} | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const first = typeof o.first_name === 'string' ? o.first_name.trim() : ''
  const last = typeof o.last_name === 'string' ? o.last_name.trim() : ''
  const name = [first, last].filter(Boolean).join(' ') || (typeof o.name === 'string' ? o.name.trim() : '')
  const email = typeof o.email === 'string' ? o.email.trim() : ''
  const phone = typeof o.phone === 'string' ? o.phone.trim() : undefined
  const city = typeof o.city === 'string' ? o.city.trim() : undefined
  const notes = typeof o.notes === 'string' ? o.notes.trim() : undefined
  if (!name && !email) return null
  return {
    name: name || 'ManyChat Lead',
    email: email || 'manychat@lead.local',
    phone,
    city,
    notes,
    raw: o,
  }
}

/** GET — Webhook sağlık kontrolü (PII göstermez, sadece sayı döner) */
export async function GET() {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ status: 'error', message: 'Supabase bağlantısı yapılandırılmamış.' }, { status: 500 })
  }

  const [demoCount, crmCount] = await Promise.all([
    supabase.from('demo_requests').select('id', { count: 'exact', head: true }).eq('source', 'manychat'),
    supabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('source', 'manychat'),
  ])

  if (demoCount.error || crmCount.error) {
    return NextResponse.json({ status: 'error', message: 'Veri alınamadı.' }, { status: 500 })
  }

  return NextResponse.json({
    status: 'ok',
    webhook: '/api/webhooks/manychat',
    method: 'POST',
    description: 'ManyChat lead webhook — crm_contacts + crm_activities + demo_requests tablosuna yazar',
    requiredFields: ['first_name veya name', 'email'],
    optionalFields: ['last_name', 'phone', 'city', 'notes'],
    totalLeads: demoCount.count ?? 0,
    totalCrmContacts: crmCount.count ?? 0,
  })
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-manychat-signature') ?? req.headers.get('x-signature')
    const secret = process.env.MANYCHAT_WEBHOOK_SECRET?.trim()

    let body: unknown
    try {
      body = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      body = {}
    }

    // ── HMAC-SHA256 doğrulama ──────────────────────────────────────────────
    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const lead = parseLead(body)
    if (!lead || !lead.email) {
      return NextResponse.json({ ok: false, error: 'Ad veya e-posta eksik.' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası.' }, { status: 500 })
    }

    // ── 1. crm_contacts tablosuna INSERT ───────────────────────────────────
    const { data: contact, error: contactErr } = await supabase
      .from('crm_contacts')
      .insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? null,
        city: lead.city ?? null,
        source: 'manychat',
        status: 'new',
        notes: lead.notes ?? null,
        meta: lead.raw,
      })
      .select('id')
      .single()

    if (contactErr) {
      console.error('[manychat] crm_contacts insert error:', contactErr)
      // crm_contacts hata verirse yine de demo_requests'e yazmayı dene
    }

    // ── 2. crm_activities tablosuna "manychat_lead" activity kaydı ─────────
    if (contact?.id) {
      const { error: activityErr } = await supabase.from('crm_activities').insert({
        contact_id: contact.id,
        activity_type: 'manychat_lead',
        description: `ManyChat lead: ${lead.name} (${lead.email})`,
        meta: {
          phone: lead.phone ?? null,
          city: lead.city ?? null,
          source_payload: lead.raw,
        },
      })

      if (activityErr) {
        console.error('[manychat] crm_activities insert error:', activityErr)
      }
    }

    // ── 3. demo_requests tablosuna INSERT ──────────────────────────────────
    const { data: demoData, error: demoErr } = await supabase
      .from('demo_requests')
      .insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? null,
        city: lead.city ?? null,
        notes: lead.notes ?? null,
        facility_type: null,
        source: 'manychat',
      })
      .select('id')
      .single()

    if (demoErr) {
      if (demoErr.code === '23514') {
        return NextResponse.json(
          { ok: false, error: "demo_requests source 'manychat' henüz tanımlı değil. Migration çalıştırın." },
          { status: 400 }
        )
      }
      console.error('[manychat] demo_requests insert error:', demoErr)
      // crm_contacts başarılıysa kısmi başarı döndür
      if (contact?.id) {
        return NextResponse.json({
          ok: true,
          partial: true,
          crm_contact_id: contact.id,
          demo_request_id: null,
          message: 'CRM kaydı oluşturuldu, demo_requests yazılamadı.',
        })
      }
      return NextResponse.json({ error: 'Kayıt sırasında hata oluştu.' }, { status: 500 })
    }

    // ── 4. crm_activities: demo_created kaydı ──────────────────────────────
    if (contact?.id && demoData?.id) {
      const { error: demoActivityErr } = await supabase.from('crm_activities').insert({
        contact_id: contact.id,
        activity_type: 'demo_created',
        description: `Demo talebi otomatik oluşturuldu: ${demoData.id}`,
        meta: { demo_request_id: demoData.id },
      })

      if (demoActivityErr) {
        console.error('[manychat] crm_activities demo_created insert error:', demoActivityErr)
      }
    }

    return NextResponse.json({
      ok: true,
      crm_contact_id: contact?.id ?? null,
      demo_request_id: demoData?.id ?? null,
    })
  } catch (e) {
    console.error('[manychat] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
