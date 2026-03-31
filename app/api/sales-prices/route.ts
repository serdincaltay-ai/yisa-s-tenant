/**
 * YİSA-S Patron Satış Fiyatları API
 * GET: Liste (Patron paneli + demo fiyat gösterme); product_key filtreli
 * PATCH: Patron satış fiyatı belirler/günceller (Patron onayı ile kullanılmalı)
 * Tarih: 30 Ocak 2026
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getSalesPrices,
  getSalesPriceByProduct,
  setSalesPrice,
} from '@/lib/db/sales-prices'
import { requireAuth, requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const product_key = searchParams.get('product_key')
    const limit = searchParams.get('limit')
    if (product_key) {
      const { data, error } = await getSalesPriceByProduct(product_key)
      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }
      return NextResponse.json({ data: data ?? null })
    }
    const { data, error } = await getSalesPrices({
      limit: limit ? parseInt(limit, 10) : undefined,
    })
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data: data ?? [] })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fiyatlar alınamadı' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const {
      product_key,
      display_name,
      description,
      cost_report_id,
      sales_price_amount,
      currency,
      approved_by,
    } = body
    if (!product_key || !display_name || typeof sales_price_amount !== 'number') {
      return NextResponse.json(
        { error: 'product_key, display_name ve sales_price_amount (sayı) zorunludur' },
        { status: 400 }
      )
    }
    const { id, error } = await setSalesPrice({
      product_key,
      display_name,
      description: description ?? undefined,
      cost_report_id: cost_report_id ?? undefined,
      sales_price_amount,
      currency: currency ?? undefined,
      approved_by: approved_by ?? undefined,
    })
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ id })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Satış fiyatı güncellenemedi' },
      { status: 500 }
    )
  }
}
