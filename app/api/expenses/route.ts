import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireDashboard } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export interface ExpenseItem {
  id: string
  title: string
  amount: number
  type: string
  due_date?: string
  paid_at?: string
  created_at: string
}

export interface KasaGelirItem {
  id: string
  aciklama: string
  tutar: number
  hareket_tipi: string
  created_at: string
  odeme_onaylandi?: boolean
  tenant_id?: string
}

export interface PaymentScheduleItem {
  id: string
  franchise_name: string
  amount: number
  due_date: string
  status: string
}

export async function GET() {
  try {
    const auth = await requireDashboard()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabase()
    const expenseTables = ['expenses', 'kasa_defteri', 'outgoing_payments', 'payments']
    let expenses: ExpenseItem[] = []
    let schedule: PaymentScheduleItem[] = []
    let gelirler: KasaGelirItem[] = []

    if (supabase) {
      // CELF Kasa gelirleri (satış)
      try {
        const { data: kasaData } = await supabase
          .from('celf_kasa')
          .select('*')
          .eq('hareket_tipi', 'gelir')
          .order('created_at', { ascending: false })
          .limit(100)
        if (Array.isArray(kasaData) && kasaData.length > 0) {
          gelirler = kasaData.map((row: Record<string, unknown>) => ({
            id: String(row.id ?? ''),
            aciklama: String(row.aciklama ?? '—'),
            tutar: Number(row.tutar ?? 0),
            hareket_tipi: 'gelir',
            created_at: String(row.created_at ?? ''),
            odeme_onaylandi: row.odeme_onaylandi === true,
            tenant_id: row.tenant_id != null ? String(row.tenant_id) : undefined,
          }))
        }
      } catch (_) {
        // celf_kasa yoksa devam
      }

      for (const table of expenseTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        if (error) continue
        if (Array.isArray(data) && data.length > 0) {
          expenses = data.map((row: Record<string, unknown>) => ({
            id: String(row.id ?? row.uuid ?? ''),
            title: String(row.title ?? row.description ?? row.name ?? '—'),
            amount: Number(row.amount ?? row.total ?? row.price ?? 0),
            type: String(row.type ?? row.category ?? 'gider'),
            due_date: row.due_date != null ? String(row.due_date) : undefined,
            paid_at: row.paid_at != null ? String(row.paid_at) : undefined,
            created_at: String(row.created_at ?? ''),
          }))
          break
        }
      }

      const scheduleTables = ['payment_schedule', 'franchise_payments', 'subscriptions']
      for (const table of scheduleTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('due_date', { ascending: true })
          .limit(50)
        if (error) continue
        if (Array.isArray(data) && data.length > 0) {
          schedule = data.map((row: Record<string, unknown>) => ({
            id: String(row.id ?? row.uuid ?? ''),
            franchise_name: String(row.franchise_name ?? row.organization_name ?? row.name ?? '—'),
            amount: Number(row.amount ?? row.total ?? row.price ?? 0),
            due_date: String(row.due_date ?? row.next_payment ?? row.created_at ?? ''),
            status: String(row.status ?? 'pending'),
          }))
          break
        }
      }
    }

    return NextResponse.json({ expenses, schedule, gelirler })
  } catch {
    return NextResponse.json({ expenses: [], schedule: [], gelirler: [] })
  }
}
