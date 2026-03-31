/**
 * YİSA-S Son Görevler API (Veri Arşivleme tüketimi)
 * task_results tablosundan son görevleri döner — Patron Dashboard, raporlama
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRecentTaskResults } from '@/lib/db/task-results'
import { requireDashboard } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireDashboard()
    if (auth instanceof NextResponse) return auth

    const limitParam = req.nextUrl?.searchParams?.get('limit')
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50
    const statusParam = req.nextUrl?.searchParams?.get('status') as 'completed' | 'failed' | 'cancelled' | null
    const status = statusParam && ['completed', 'failed', 'cancelled'].includes(statusParam) ? statusParam : undefined

    const { data, error } = await getRecentTaskResults(limit, status)
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      results: data ?? [],
      count: (data ?? []).length,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
