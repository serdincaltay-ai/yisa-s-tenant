import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { FRANCHISE_SEED } from '@/lib/data/franchises-seed'
import { requireDashboard } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export interface StatsPayload {
  /** Patron paneli: franchise satışlarından bu ay gelen gelir */
  franchiseRevenueMonth: number
  /** Patron paneli: bu ay toplam gider (kasa defteri) */
  expensesMonth: number
  /** Patron paneli: aktif franchise sayısı */
  activeFranchises: number
  /** Patron paneli: onay bekleyen iş sayısı */
  pendingApprovals: number
  /** Patron paneli: yeni franchise başvurusu / demo talebi */
  newFranchiseApplications: number
  /** Eski uyumluluk (franchise panelinde kullanılabilir) */
  athletes: number
  coaches: number
  revenueMonth: number
  demoRequests: number
}

const DEFAULT: StatsPayload = {
  franchiseRevenueMonth: 0,
  expensesMonth: 0,
  activeFranchises: 0,
  pendingApprovals: 0,
  newFranchiseApplications: 0,
  athletes: 0,
  coaches: 0,
  revenueMonth: 0,
  demoRequests: 0,
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function count(
  table: string,
  supabase: SupabaseClient
): Promise<{ n: number; ok: boolean }> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) return { n: 0, ok: false }
  return { n: count ?? 0, ok: true }
}

async function revenueThisMonth(supabase: SupabaseClient): Promise<number> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const startStr = start.toISOString().slice(0, 10)

  const tables = ['payments', 'transactions', 'subscriptions']
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('amount, total, price, created_at')
      if (error) continue
      if (!Array.isArray(data)) continue
      const numKey = data[0] && typeof data[0] === 'object' && data[0] !== null
        ? ['amount', 'total', 'price'].find((k) => k in (data[0] as object))
        : null
      if (!numKey) continue
      let sum = 0
      for (const row of data) {
        const r = row as Record<string, unknown>
        const d = r.created_at ?? r.createdAt
        const dateStr = typeof d === 'string' ? d.slice(0, 10) : ''
        if (dateStr >= startStr) {
          const v = Number(r[numKey])
          if (!Number.isNaN(v)) sum += v
        }
      }
      return sum
    } catch {
      continue
    }
  }
  return 0
}

export async function GET() {
  try {
    const auth = await requireDashboard()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({
        ...DEFAULT,
        activeFranchises: FRANCHISE_SEED.length,
      })
    }

    const athletesTables = ['athletes', 'athlete', 'sporcular', 'profiles'] // athletes = AŞAMA 2
    const coachesTables = ['staff', 'coaches', 'coach', 'antrenorler', 'trainers'] // staff = AŞAMA 2
    const demoTables = ['demo_requests', 'demo_talepleri', 'leads']

    let athletes = 0
    let coaches = 0
    let demoRequests = 0

    for (const t of athletesTables) {
      const { n, ok } = await count(t, supabase)
      athletes = n
      if (ok) break
    }
    for (const t of coachesTables) {
      const { n, ok } = await count(t, supabase)
      coaches = n
      if (ok) break
    }
    for (const t of demoTables) {
      const { n, ok } = await count(t, supabase)
      demoRequests = n
      if (ok) break
    }

    const revenueMonth = await revenueThisMonth(supabase)

    // Patron paneli: franchise gelir = aynı gelir tablolarından (franchise satışları)
    const franchiseRevenueMonth = revenueMonth
    // Aktif franchise: franchises / organizations tablosu
    const franchiseTables = ['franchises', 'organizations', 'tenants']
    let activeFranchises = 0
    for (const t of franchiseTables) {
      const { n, ok } = await count(t, supabase)
      if (ok) {
        activeFranchises = n
        break
      }
    }
    if (activeFranchises === 0) activeFranchises = FRANCHISE_SEED.length
    // Onay kuyruğu: patron_commands (status=pending) veya approval_queue
    let pendingApprovals = 0
    try {
      const { count: pcCount, error: pcErr } = await supabase
        .from('patron_commands')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (!pcErr && pcCount != null) pendingApprovals = pcCount
    } catch { /* ignore */ }
    if (pendingApprovals === 0) {
      const approvalTables = ['approval_queue', 'pending_approvals', 'workflow_tasks']
      for (const t of approvalTables) {
        const { n, ok } = await count(t, supabase)
        if (ok && n > 0) {
          pendingApprovals = n
          break
        }
      }
    }
    // Gider: expenses / kasa_defteri / payments (type=expense)
    const expenseTables = ['expenses', 'kasa_defteri', 'outgoing_payments']
    let expensesMonth = 0
    for (const t of expenseTables) {
      try {
        const { data, error } = await supabase.from(t).select('amount, total, created_at')
        if (error) continue
        if (!Array.isArray(data)) continue
        const now = new Date()
        const startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
        let sum = 0
        for (const row of data) {
          const r = row as Record<string, unknown>
          const d = r.created_at ?? r.createdAt
          const dateStr = typeof d === 'string' ? d.slice(0, 10) : ''
          if (dateStr >= startStr) {
            const v = Number(r.amount ?? r.total ?? 0)
            if (!Number.isNaN(v)) sum += v
          }
        }
        expensesMonth = sum
        break
      } catch {
        continue
      }
    }

    return NextResponse.json({
      franchiseRevenueMonth: Math.round(franchiseRevenueMonth),
      expensesMonth: Math.round(expensesMonth),
      activeFranchises,
      pendingApprovals,
      newFranchiseApplications: demoRequests,
      athletes,
      coaches,
      revenueMonth: Math.round(revenueMonth),
      demoRequests,
    } satisfies StatsPayload)
  } catch {
    return NextResponse.json({
      ...DEFAULT,
      activeFranchises: FRANCHISE_SEED.length,
    })
  }
}
