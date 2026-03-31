/**
 * Stripe istemci yapılandırması
 * Server-side Stripe SDK başlatma ve yardımcı fonksiyonlar
 */

import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ''

let stripeInstance: Stripe | null = null

/**
 * Stripe SDK instance döndürür (singleton)
 * STRIPE_SECRET_KEY tanımlanmamışsa null döner
 */
export function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) {
    console.warn('[Stripe] STRIPE_SECRET_KEY tanımlanmamış.')
    return null
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return stripeInstance
}

/**
 * Stripe Checkout Session oluştur
 */
export async function createCheckoutSession(params: {
  paymentId: string
  athleteName: string
  amount: number
  currency?: string
  tenantId: string
  userId: string
  originalStatus: string
  successUrl: string
  cancelUrl: string
}): Promise<{ sessionId?: string; url?: string | null; error?: string }> {
  const stripe = getStripe()
  if (!stripe) {
    return { error: 'Stripe yapılandırılmamış. STRIPE_SECRET_KEY gerekli.' }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency ?? 'try',
            product_data: {
              name: `Aidat Ödemesi — ${params.athleteName}`,
              description: `Ödeme #${params.paymentId.substring(0, 8)}`,
            },
            unit_amount: Math.round(params.amount * 100), // kuruş cinsinden
          },
          quantity: 1,
        },
      ],
      metadata: {
        payment_id: params.paymentId,
        tenant_id: params.tenantId,
        user_id: params.userId,
        original_status: params.originalStatus,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    })

    return { sessionId: session.id, url: session.url }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('[Stripe] Checkout session hatası:', err)
    return { error: err }
  }
}

/**
 * Stripe webhook imzasını doğrula
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!stripe || !webhookSecret) {
    console.warn('[Stripe] Webhook doğrulama yapılamıyor: Stripe veya webhook secret eksik.')
    return null
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (e) {
    console.error('[Stripe] Webhook imza doğrulama hatası:', e instanceof Error ? e.message : e)
    return null
  }
}
