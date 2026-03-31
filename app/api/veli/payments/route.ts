import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    const { data: children } = await service
      .from('athletes')
      .select('id')
      .eq('parent_user_id', user.id)

    if (!children?.length) return NextResponse.json({ items: [], totalDebt: 0 })

    const ids = children.map((c: { id: string }) => c.id)
    const { data, error } = await service
      .from('payments')
      .select('id, athlete_id, amount, payment_type, period_month, period_year, due_date, paid_date, status, created_at, athletes(name, surname)')
      .in('athlete_id', ids)
      .in('status', ['pending', 'paid', 'overdue'])
      .order('due_date', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ items: [], totalDebt: 0, error: error.message })

    const items = (data ?? []).map((row: Record<string, unknown>) => {
      const a = row.athletes as Record<string, unknown> | null
      return {
        id: row.id,
        athlete_id: row.athlete_id,
        athlete_name: a ? `${a.name ?? ''} ${a.surname ?? ''}`.trim() : '—',
        amount: Number(row.amount),
        payment_type: row.payment_type,
        period_month: row.period_month,
        period_year: row.period_year,
        due_date: row.due_date,
        paid_date: row.paid_date,
        status: row.status,
        created_at: row.created_at,
      }
    })

    const totalDebt = items
      .filter((i) => ['pending', 'overdue'].includes(String(i.status)))
      .reduce((s, i) => s + Number(i.amount), 0)

    return NextResponse.json({ items, totalDebt })
  } catch (e) {
    console.error('[veli/payments GET]', e)
    return NextResponse.json({ items: [], totalDebt: 0 })
  }
}
