/**
 * GET /api/stripe/health
 * Stripe bağlantısını test eder (Patron yetkisi gerekir).
 * stripe.customers.list({ limit: 1 }) çağrılır.
 * Başarılı: { ok: true, mode: 'test' | 'live' }
 * Hata: { ok: false, error: message }
 */

import { NextResponse } from 'next/server'
import { requirePatron } from '@/lib/auth/api-auth'
import { getStripe } from '@/lib/stripe/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requirePatron()
  if (auth instanceof NextResponse) return auth

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: 'STRIPE_SECRET_KEY tanımlı değil veya geçersiz.' },
      { status: 503 }
    )
  }

  try {
    await stripe.customers.list({ limit: 1 })
    const secretKey = process.env.STRIPE_SECRET_KEY ?? ''
    const mode = secretKey.startsWith('sk_live_') ? 'live' : 'test'
    return NextResponse.json({ ok: true, mode })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[stripe/health] Stripe bağlantı hatası:', message)
    return NextResponse.json(
      { ok: false, error: message },
      { status: 503 }
    )
  }
}
