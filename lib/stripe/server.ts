/**
 * Stripe server-side shared utilities
 * DRY: getStripe() ve getSupabaseService() tek yerde tanımlanır.
 * Webhook handler ve create-checkout route'ları bu modülü kullanır.
 */

import Stripe from 'stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const STRIPE_API_VERSION = '2026-02-25.clover' as const

let _stripe: Stripe | null = null

/**
 * Stripe SDK instance döndürür (singleton, apiVersion sabitlenmiş).
 * STRIPE_SECRET_KEY yoksa null döner.
 */
export function getStripeServer(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION })
  }
  return _stripe
}

/**
 * Supabase service-role client döndürür.
 * URL veya service key eksikse null döner.
 */
export function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

/**
 * Test ortamlarında singleton cache'i sıfırlamak için.
 * Sadece test dosyalarından çağrılmalıdır.
 */
export function _resetStripeInstance(): void {
  _stripe = null
}
