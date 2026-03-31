/**
 * Tenant Public — Sporcu Kayıt API
 * POST: Veli tarafından doldurulan kayıt formunu athletes tablosuna kaydeder.
 * Auth gerekmez (veli henüz giriş yapmamış olabilir).
 * Spam koruması: basit in-memory rate limiting (IP bazlı).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/* ─── Basit rate limiter (IP bazlı, bellek içi) ─── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 dakika
const RATE_LIMIT_MAX = 5 // Pencere başına max istek

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen bir dakika bekleyin.' },
        { status: 429 },
      )
    }

    const body = await req.json()

    // tenant_id zorunlu (subdomain middleware'den veya body'den)
    const tenantId =
      req.headers.get('x-tenant-id')?.trim() ??
      (typeof body.tenant_id === 'string' ? body.tenant_id.trim() : '')
    if (!tenantId || !/^[0-9a-f-]{36}$/i.test(tenantId)) {
      return NextResponse.json({ error: 'Geçersiz tenant' }, { status: 400 })
    }

    // Zorunlu alanlar
    const ad = typeof body.ad === 'string' ? body.ad.trim() : ''
    if (!ad) {
      return NextResponse.json({ error: 'Ad zorunludur' }, { status: 400 })
    }

    const cinsiyet = body.cinsiyet === 'E' || body.cinsiyet === 'K' ? body.cinsiyet : null
    const yas = typeof body.yas === 'number' && body.yas >= 1 && body.yas <= 99 ? body.yas : null

    // Opsiyonel alanlar
    const boy = typeof body.boy === 'number' ? body.boy : null
    const kilo = typeof body.kilo === 'number' ? body.kilo : null
    const saglikSorunu = typeof body.saglik_sorunu === 'string' ? body.saglik_sorunu.trim() : null
    const oncekiSpor = typeof body.onceki_spor === 'boolean' ? body.onceki_spor : null
    const oncekiBrans = typeof body.onceki_brans === 'string' ? body.onceki_brans.trim() : null
    const uygunGunler = Array.isArray(body.uygun_gunler) ? body.uygun_gunler : []
    const veliAd = typeof body.veli_ad === 'string' ? body.veli_ad.trim() : null
    const veliTelefon = typeof body.veli_telefon === 'string' ? body.veli_telefon.trim() : null

    // Doğum tarihi hesapla (yaştan)
    let birthDate: string | null = null
    if (yas) {
      const now = new Date()
      birthDate = `${now.getFullYear() - yas}-01-01`
    }

    // Service client ile kaydet (service role zorunlu — anon key'e düşmez)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 })
    }
    const service = createClient(url, key)

    // Athletes tablosuna ekle
    const notes = [
      saglikSorunu ? `Sağlık: ${saglikSorunu}` : null,
      oncekiSpor != null
        ? `Önceki spor: ${oncekiSpor ? 'Evet' : 'Hayır'}${oncekiBrans ? ` (${oncekiBrans})` : ''}`
        : null,
      boy ? `Boy: ${boy} cm` : null,
      kilo ? `Kilo: ${kilo} kg` : null,
      uygunGunler.length > 0 ? `Uygun günler: ${uygunGunler.join(', ')}` : null,
      veliAd ? `Veli: ${veliAd}` : null,
      veliTelefon ? `Tel: ${veliTelefon}` : null,
    ]
      .filter(Boolean)
      .join(' | ')

    const { data, error } = await service
      .from('athletes')
      .insert({
        tenant_id: tenantId,
        name: ad,
        gender: cinsiyet,
        birth_date: birthDate,
        branch: null,
        status: 'trial',
        parent_name: veliAd,
        parent_phone: veliTelefon,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[tenant-public/kayit]', error)
      return NextResponse.json({ error: 'Kayıt başarısız' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, athlete_id: data?.id })
  } catch (e) {
    console.error('[tenant-public/kayit]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
