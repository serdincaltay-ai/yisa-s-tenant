/**
 * YİSA-S CELF Maliyet Raporları API
 * GET: Patron paneli için liste (report_type, product_key filtreli)
 * POST: CELF/CFO maliyet raporu ekler
 * Tarih: 30 Ocak 2026
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  insertCostReport,
  getCostReports,
  type CostReportType,
} from '@/lib/db/cost-reports'
import { requirePatron, requireInternalOrPatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const report_type = searchParams.get('report_type') as CostReportType | null
    const product_key = searchParams.get('product_key')
    const limit = searchParams.get('limit')
    const { data, error } = await getCostReports({
      report_type: report_type ?? undefined,
      product_key: product_key ?? undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data: data ?? [] })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Liste alınamadı' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireInternalOrPatron(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const {
      report_type,
      period,
      description,
      product_key,
      cost_breakdown,
      director_key,
      created_by,
    } = body
    if (!report_type || !description || !cost_breakdown) {
      return NextResponse.json(
        { error: 'report_type, description ve cost_breakdown zorunludur' },
        { status: 400 }
      )
    }
    if (typeof cost_breakdown !== 'object' || typeof cost_breakdown.total_cost !== 'number') {
      return NextResponse.json(
        { error: 'cost_breakdown.total_cost sayı olmalıdır' },
        { status: 400 }
      )
    }
    const { id, error } = await insertCostReport({
      report_type,
      period: period ?? undefined,
      description,
      product_key: product_key ?? undefined,
      cost_breakdown,
      director_key: director_key ?? undefined,
      created_by: created_by ?? undefined,
    })
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ id })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Rapor eklenemedi' },
      { status: 500 }
    )
  }
}
