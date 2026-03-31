/**
 * Stripe Checkout Session olusturma
 * POST /api/payments/create-checkout
 * Body: { payment_ids: string[] }
 *
 * Secilen bekleyen odemeler icin Stripe Checkout Session olusturur
 * ve checkout URL'i doner.
 * Not: success_url ve cancel_url sunucu tarafinda belirlenir (open redirect onlemi).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import Stripe from 'stripe'
import { getStripeServer, getSupabaseService } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeServer()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe yapilandirilmamis. STRIPE_SECRET_KEY eksik.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })
    }

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant bulunamadi' }, { status: 403 })
    }

    const body = await req.json()
    const paymentIds: string[] = Array.isArray(body.payment_ids) ? body.payment_ids : []

    if (paymentIds.length === 0) {
      return NextResponse.json({ error: 'Odeme secilmedi (payment_ids bos)' }, { status: 400 })
    }

    // Stripe metadata 500 karakter limiti: UUID (36 char) + virgul = ~37 char, max ~13 odeme
    const MAX_PAYMENTS_PER_CHECKOUT = 13
    if (paymentIds.length > MAX_PAYMENTS_PER_CHECKOUT) {
      return NextResponse.json(
        { error: `Tek seferde en fazla ${MAX_PAYMENTS_PER_CHECKOUT} odeme secebilirsiniz.` },
        { status: 400 }
      )
    }

    const service = getSupabaseService()
    if (!service) {
      return NextResponse.json({ error: 'Sunucu yapilandirma hatasi' }, { status: 500 })
    }

    // Secilen odemeleri getir — sadece bu tenant'a ait ve bekleyen/gecikmis olanlar
    const { data: payments, error: fetchErr } = await service
      .from('franchise_payments')
      .select('id, athlete_id, amount, period_month, period_year, status, athletes(name, surname)')
      .eq('tenant_id', tenantId)
      .in('id', paymentIds)
      .in('status', ['pending', 'overdue'])

    if (fetchErr) {
      // Sadece tablo bulunamadi hatasinda package_payments'a gec
      // Diger hatalar (RLS, network, timeout) icin 500 don
      const isTableNotFound = fetchErr.code === '42P01' || fetchErr.message?.includes('relation')
      if (!isTableNotFound) {
        console.error('[create-checkout] franchise_payments sorgu hatasi:', fetchErr)
        return NextResponse.json({ error: 'Veritabani hatasi' }, { status: 500 })
      }

      const { data: altPayments, error: altErr } = await service
        .from('package_payments')
        .select('id, athlete_id, amount, taksit_no, status, athletes(name, surname)')
        .eq('tenant_id', tenantId)
        .in('id', paymentIds)
        .in('status', ['bekliyor', 'pending', 'overdue', 'gecikmis'])

      if (altErr || !altPayments || altPayments.length === 0) {
        return NextResponse.json(
          { error: 'Odeme kaydi bulunamadi veya zaten odenmis' },
          { status: 404 }
        )
      }

      // package_payments icin checkout session olustur
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = altPayments.map((p) => {
        const ath = p.athletes as { name?: string; surname?: string } | null
        const athleteName = ath ? [ath.name, ath.surname].filter(Boolean).join(' ') : 'Sporcu'
        const desc = `Aidat - ${athleteName}`
        return {
          price_data: {
            currency: 'try',
            product_data: { name: desc },
            unit_amount: Math.round(Number(p.amount) * 100),
          },
          quantity: 1,
        }
      })

      const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL, 'https://app.yisa-s.com', 'https://yisa-s.com'].filter(Boolean)
      const rawOrigin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '')
      const origin = (rawOrigin && allowedOrigins.includes(rawOrigin)) ? rawOrigin : 'https://app.yisa-s.com'
      const successUrl = `${origin}/veli/odeme?status=success`
      const cancelUrl = `${origin}/veli/odeme?status=cancel`

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tenant_id: tenantId,
          payment_ids: altPayments.map((p) => p.id).join(','),
          payment_table: 'package_payments',
          athlete_id: altPayments.length === 1 ? String(altPayments[0].athlete_id ?? '') : '',
          paket_miktari: '10',
        },
      })

      return NextResponse.json({ url: session.url, session_id: session.id })
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        { error: 'Odeme kaydi bulunamadi veya zaten odenmis' },
        { status: 404 }
      )
    }

    // franchise_payments icin checkout session olustur
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = payments.map((p) => {
      const ath = p.athletes as { name?: string; surname?: string } | null
      const athleteName = ath ? [ath.name, ath.surname].filter(Boolean).join(' ') : 'Sporcu'
      const periodLabel = p.period_month && p.period_year
        ? ` (${p.period_month}/${p.period_year})`
        : ''
      const desc = `Aidat - ${athleteName}${periodLabel}`
      return {
        price_data: {
          currency: 'try',
          product_data: { name: desc },
          unit_amount: Math.round(Number(p.amount) * 100),
        },
        quantity: 1,
      }
    })

    const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL, 'https://app.yisa-s.com', 'https://yisa-s.com'].filter(Boolean)
    const rawOrigin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '')
    const origin = (rawOrigin && allowedOrigins.includes(rawOrigin)) ? rawOrigin : 'https://app.yisa-s.com'
    const successUrl = `${origin}/veli/odeme?status=success`
    const cancelUrl = `${origin}/veli/odeme?status=cancel`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenant_id: tenantId,
        payment_ids: payments.map((p) => p.id).join(','),
        payment_table: 'franchise_payments',
        athlete_id: '',
        paket_miktari: '0',
      },
    })

    return NextResponse.json({ url: session.url, session_id: session.id })
  } catch (e) {
    console.error('[create-checkout]', e)
    return NextResponse.json({ error: 'Stripe checkout olusturulamadi' }, { status: 500 })
  }
}
