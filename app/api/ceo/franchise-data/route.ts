/**
 * CEO Franchise Veri Havuzu API (ceo_franchise_data)
 * GET: Franchise verilerini al (?franchise_id=, ?data_type=, ?period=)
 * GET: Tüm franchise özeti (?summary=true&data_type=)
 * POST: Veri ekle / senkronize et
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getCeoFranchiseData,
  getAllFranchisesSummary,
  upsertCeoFranchiseData,
  type UpsertFranchiseDataParams,
} from '@/lib/db/ceo-franchise-data'
import { requireInternalOrPatron } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireInternalOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const franchiseId = searchParams.get('franchise_id') ?? undefined
    const dataType = searchParams.get('data_type') ?? undefined
    const period = searchParams.get('period') ?? undefined
    const summary = searchParams.get('summary') === 'true'
    if (summary && dataType) {
      const { data, error } = await getAllFranchisesSummary(dataType, period)
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ ok: true, data: data ?? [], summary: true })
    }
    if (!franchiseId) {
      return NextResponse.json({ error: 'franchise_id veya summary=true&data_type= gerekli' }, { status: 400 })
    }
    const { data, error } = await getCeoFranchiseData(franchiseId, dataType, period)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO franchise veri hatası', detail: err }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireInternalOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const params: UpsertFranchiseDataParams = {
      franchise_id: body.franchise_id ?? '',
      data_type: body.data_type ?? 'unknown',
      data_value: body.data_value ?? {},
      period: body.period,
    }
    if (!params.franchise_id) return NextResponse.json({ error: 'franchise_id gerekli' }, { status: 400 })
    const { id, error } = await upsertCeoFranchiseData(params)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO franchise veri ekleme hatası', detail: err }, { status: 500 })
  }
}
