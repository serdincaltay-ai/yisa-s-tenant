/**
 * CEO Kural Havuzu API (ceo_rules)
 * GET: Kuralları listele
 * POST: Yeni kural ekle
 */

import { NextRequest, NextResponse } from 'next/server'
import { addCeoRule, getCeoRules, type CreateCeoRuleParams, type CeoRuleType } from '@/lib/db/ceo-rules-db'
import { requireInternalOrPatron } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireInternalOrPatron(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active_only') !== 'false'
    const { data, error } = await getCeoRules(activeOnly)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO kural listesi hatası', detail: err }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth2 = await requireInternalOrPatron(req)
    if (auth2 instanceof NextResponse) return auth2

    const body = await req.json()
    const params: CreateCeoRuleParams = {
      rule_name: body.rule_name ?? 'Kural',
      rule_type: (body.rule_type ?? 'validation') as CeoRuleType,
      applies_to: body.applies_to ?? [],
      condition: body.condition ?? {},
      action: body.action ?? {},
      priority: body.priority ?? 5,
      created_by: body.created_by ?? body.user_id ?? undefined,
    }
    const { id, error } = await addCeoRule(params)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'CEO kural ekleme hatası', detail: err }, { status: 500 })
  }
}
