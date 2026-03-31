import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireDashboard } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireDashboard()
  if (auth instanceof NextResponse) return auth

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ athletes: 0, pendingApprovals: 0, newApplications: 0, activeFranchises: 0 })

  const service = createServiceClient(url, key)
  const [athletes, demoRequests, franchises, pendingCommands] = await Promise.all([
    service.from('athletes').select('id', { count: 'exact', head: true }),
    service.from('demo_requests').select('id', { count: 'exact', head: true }),
    service.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    service.from('patron_commands').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return NextResponse.json({
    athletes: athletes.count ?? 0,
    pendingApprovals: pendingCommands.count ?? 0,
    newApplications: demoRequests.count ?? 0,
    activeFranchises: franchises.count ?? 0,
  })
}
