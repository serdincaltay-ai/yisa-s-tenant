/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 *
 * Desteklenen event'ler:
 *   - checkout.session.completed: Odeme tamamlandi → DB guncelle
 *   - checkout.session.expired: Checkout suresi doldu → log kaydi
 *
 * Guclendirmeler:
 *   - Idempotency guard: Ayni event_id tekrar islenmez
 *   - Event loglama: Audit trail icin stripe_webhook_events tablosu
 *   - Hata yonetimi: Gecici hatalar → 500 (retry), kalici hatalar → 200 (no retry)
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeServer, getSupabaseService } from '@/lib/stripe/server'
import {
  isEventAlreadyProcessed,
  logWebhookEvent,
  isTransientError,
} from '@/lib/stripe/webhook-utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const stripe = getStripeServer()
  if (!stripe) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY eksik')
    return NextResponse.json({ error: 'Stripe yapilandirilmamis' }, { status: 500 })
  }

  // ── 1. Imza dogrulama ──────────────────────────────────────────────
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()

  let event: Stripe.Event

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.error('[stripe-webhook] Imza dogrulanamadi:', err)
      return NextResponse.json({ error: 'Webhook imza hatasi' }, { status: 400 })
    }
  } else if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET ayarlanmamis — guvenlik riski, istek reddedildi')
    return NextResponse.json({ error: 'Webhook yapilandirma hatasi' }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'stripe-signature header eksik' }, { status: 400 })
  }

  // ── 2. Supabase service client ─────────────────────────────────────
  const service = getSupabaseService()
  if (!service) {
    console.error('[stripe-webhook] Supabase baglantisi yapilandirilmamis')
    return NextResponse.json({ error: 'Sunucu yapilandirma hatasi' }, { status: 500 })
  }

  // ── 3. Idempotency guard ───────────────────────────────────────────
  const alreadyProcessed = await isEventAlreadyProcessed(service, event.id)
  if (alreadyProcessed) {
    console.log(`[stripe-webhook] Event zaten islendi, atlaniyor: ${event.id}`)
    return NextResponse.json({ received: true, status: 'already_processed', event_id: event.id })
  }

  // ── 4. Event routing ───────────────────────────────────────────────
  try {
    if (event.type === 'checkout.session.completed') {
      return await handleCheckoutCompleted(event, service)
    }

    if (event.type === 'checkout.session.expired') {
      return await handleCheckoutExpired(event, service)
    }

    // Diger event tipleri icin sadece onay don
    return NextResponse.json({ received: true, status: 'event_ignored', type: event.type })
  } catch (e) {
    console.error('[stripe-webhook] Beklenmeyen hata:', e)

    await logWebhookEvent(service, {
      stripe_event_id: event.id,
      event_type: event.type,
      stripe_session_id: null,
      status: 'error',
      metadata: { error: e instanceof Error ? e.message : String(e) },
      error_message: e instanceof Error ? e.message : String(e),
    })

    // Gecici hata → 500 (Stripe retry yapabilir)
    // Kalici hata → 200 (retry dongusunu onle)
    if (isTransientError(e)) {
      return NextResponse.json({ error: 'Gecici hata, tekrar denenebilir' }, { status: 500 })
    }
    return NextResponse.json({ received: true, status: 'permanent_error' })
  }
}

// ── checkout.session.completed handler ─────────────────────────────────
async function handleCheckoutCompleted(
  event: Stripe.Event,
  service: ReturnType<typeof getSupabaseService> & object
) {
  const session = event.data.object as Stripe.Checkout.Session

  await logWebhookEvent(service, {
    stripe_event_id: event.id,
    event_type: event.type,
    stripe_session_id: session.id,
    status: 'processing',
    metadata: { payment_status: session.payment_status, metadata: session.metadata },
  })

  if (session.payment_status !== 'paid') {
    await logWebhookEvent(service, {
      stripe_event_id: event.id,
      event_type: event.type,
      stripe_session_id: session.id,
      status: 'skipped',
      metadata: { reason: 'payment_not_completed', payment_status: session.payment_status },
    })
    return NextResponse.json({ received: true, status: 'payment_not_completed' })
  }

  const metadata = session.metadata ?? {}
  const tenantId = metadata.tenant_id
  const paymentIdsStr = metadata.payment_ids
  const paymentTable = metadata.payment_table || 'franchise_payments'

  if (!tenantId || !paymentIdsStr) {
    console.error('[stripe-webhook] metadata eksik:', metadata)
    await logWebhookEvent(service, {
      stripe_event_id: event.id,
      event_type: event.type,
      stripe_session_id: session.id,
      status: 'skipped',
      metadata: { reason: 'missing_metadata', received_metadata: metadata },
    })
    return NextResponse.json({ received: true, status: 'missing_metadata' })
  }

  const paymentIds = paymentIdsStr.split(',').map((id: string) => id.trim()).filter(Boolean)
  if (paymentIds.length === 0) {
    return NextResponse.json({ received: true, status: 'no_payment_ids' })
  }

  const now = new Date().toISOString().slice(0, 10)
  const stripePaymentIntent = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : null

  let updatedCount = 0

  if (paymentTable === 'package_payments') {
    const { data: updatedRows, error } = await service
      .from('package_payments')
      .update({
        status: 'odendi',
        payment_date: now,
        payment_method: 'kredi_karti',
        description: stripePaymentIntent
          ? `Stripe odeme: ${stripePaymentIntent}`
          : 'Stripe online odeme',
      })
      .eq('tenant_id', tenantId)
      .in('id', paymentIds)
      .in('status', ['bekliyor', 'pending', 'overdue', 'gecikmis'])
      .select('id')

    if (error) {
      console.error('[stripe-webhook] package_payments guncelleme hatasi:', error)
      if (isTransientError(error)) {
        await logWebhookEvent(service, {
          stripe_event_id: event.id,
          event_type: event.type,
          stripe_session_id: session.id,
          status: 'error',
          metadata: { table: 'package_payments', error: error.message, retryable: true },
          error_message: error.message,
        })
        return NextResponse.json({ error: 'Odeme guncelleme hatasi' }, { status: 500 })
      }
      await logWebhookEvent(service, {
        stripe_event_id: event.id,
        event_type: event.type,
        stripe_session_id: session.id,
        status: 'error',
        metadata: { table: 'package_payments', error: error.message },
        error_message: error.message,
      })
      return NextResponse.json({ received: true, status: 'db_error_permanent' })
    }
    updatedCount = updatedRows?.length ?? 0
  } else {
    const { data: updatedRows, error } = await service
      .from('franchise_payments')
      .update({
        status: 'paid',
        paid_date: now,
        payment_method: 'stripe',
        notes: stripePaymentIntent
          ? `Stripe odeme: ${stripePaymentIntent}`
          : 'Stripe online odeme',
      })
      .eq('tenant_id', tenantId)
      .in('id', paymentIds)
      .in('status', ['pending', 'overdue'])
      .select('id')

    if (error) {
      console.error('[stripe-webhook] franchise_payments guncelleme hatasi:', error)
      if (isTransientError(error)) {
        await logWebhookEvent(service, {
          stripe_event_id: event.id,
          event_type: event.type,
          stripe_session_id: session.id,
          status: 'error',
          metadata: { table: 'franchise_payments', error: error.message, retryable: true },
          error_message: error.message,
        })
        return NextResponse.json({ error: 'Odeme guncelleme hatasi' }, { status: 500 })
      }
      await logWebhookEvent(service, {
        stripe_event_id: event.id,
        event_type: event.type,
        stripe_session_id: session.id,
        status: 'error',
        metadata: { table: 'franchise_payments', error: error.message },
        error_message: error.message,
      })
      return NextResponse.json({ received: true, status: 'db_error_permanent' })
    }
    updatedCount = updatedRows?.length ?? 0
  }

  console.log(`[stripe-webhook] ${updatedCount} odeme guncellendi (${paymentTable}), tenant: ${tenantId}`)

  // ders_kredisi guncelleme: athlete_id varsa ve odeme gercekten guncellendiyse
  const athleteId = metadata.athlete_id
  if (athleteId && updatedCount > 0) {
    const paketMiktari = parseInt(metadata.paket_miktari ?? '10', 10)
    const { data: ath, error: athFetchErr } = await service
      .from('athletes')
      .select('ders_kredisi, toplam_kredi')
      .eq('id', athleteId)
      .single()

    if (athFetchErr) {
      console.error('[stripe-webhook] athletes fetch hatasi:', athFetchErr)
    } else if (ath) {
      const yeniDersKredisi = (ath.ders_kredisi ?? 0) + paketMiktari
      const yeniToplamKredi = (ath.toplam_kredi ?? 0) + paketMiktari
      const { error: athUpdateErr } = await service
        .from('athletes')
        .update({ ders_kredisi: yeniDersKredisi, toplam_kredi: yeniToplamKredi })
        .eq('id', athleteId)

      if (athUpdateErr) {
        console.error('[stripe-webhook] ders_kredisi guncelleme hatasi:', athUpdateErr)
      } else {
        console.log(`[stripe-webhook] athlete ${athleteId} ders_kredisi: ${ath.ders_kredisi ?? 0} -> ${yeniDersKredisi}`)
      }
    }
  }

  await logWebhookEvent(service, {
    stripe_event_id: event.id,
    event_type: event.type,
    stripe_session_id: session.id,
    status: 'processed',
    metadata: {
      payment_table: paymentTable,
      tenant_id: tenantId,
      updated_count: updatedCount,
      payment_ids: paymentIds,
      stripe_payment_intent: stripePaymentIntent,
    },
  })

  return NextResponse.json({ received: true, status: 'payments_updated', count: updatedCount })
}

// ── checkout.session.expired handler ───────────────────────────────────
async function handleCheckoutExpired(
  event: Stripe.Event,
  service: ReturnType<typeof getSupabaseService> & object
) {
  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata ?? {}

  console.log(`[stripe-webhook] Checkout expired: session=${session.id}, tenant=${metadata.tenant_id ?? 'unknown'}`)

  await logWebhookEvent(service, {
    stripe_event_id: event.id,
    event_type: event.type,
    stripe_session_id: session.id,
    status: 'processed',
    metadata: {
      tenant_id: metadata.tenant_id,
      payment_ids: metadata.payment_ids,
      reason: 'checkout_expired',
    },
  })

  return NextResponse.json({ received: true, status: 'checkout_expired' })
}
