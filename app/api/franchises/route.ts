import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FRANCHISE_SEED } from '@/lib/data/franchises-seed'
import { requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export interface FranchiseItem {
  id: string
  name: string
  slug?: string
  region?: string
  package?: string
  members_count?: number
  athletes_count?: number
  status: string
  created_at: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}

function seedToItems() {
  return FRANCHISE_SEED.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    region: s.region,
    package: s.package,
    members_count: s.members_count,
    athletes_count: s.athletes_count,
    status: s.status,
    created_at: s.created_at,
    contact_name: s.contact_name,
    contact_email: s.contact_email,
    contact_phone: s.contact_phone,
    notes: s.notes,
  }))
}

export async function GET() {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabase()
    const tables = [
      { name: 'franchises', nameCol: 'name', slugCol: 'slug' },
      { name: 'organizations', nameCol: 'name', slugCol: 'slug' },
      { name: 'tenants', nameCol: 'name', slugCol: 'slug' },
    ]

    for (const { name: table, nameCol, slugCol } of tables) {
      if (!supabase) break
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) continue
      if (!Array.isArray(data)) continue

      const dbItems: FranchiseItem[] = data.map((row: Record<string, unknown>) => ({
        id: String(row.id ?? row.uuid ?? ''),
        name: String(row[nameCol] ?? row.title ?? row.company_name ?? '—'),
        slug: row[slugCol] != null ? String(row[slugCol]) : undefined,
        region: row.region != null ? String(row.region) : undefined,
        package: row.package != null ? String(row.package) : undefined,
        members_count: typeof row.members_count === 'number' ? row.members_count : undefined,
        athletes_count: typeof row.athletes_count === 'number' ? row.athletes_count : undefined,
        status: String(row.status ?? 'active'),
        created_at: String(row.created_at ?? ''),
        contact_name: row.contact_name != null ? String(row.contact_name) : undefined,
        contact_email: row.contact_email != null ? String(row.contact_email) : undefined,
        contact_phone: row.contact_phone != null ? String(row.contact_phone) : undefined,
        notes: row.notes != null ? String(row.notes) : undefined,
      }))

      const fromDbIds = new Set(dbItems.map((i) => i.id))
      const seedOnly = seedToItems().filter((s) => !fromDbIds.has(s.id))
      const merged = [...dbItems, ...seedOnly].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      return NextResponse.json({ items: merged, table })
    }

    return NextResponse.json({ items: seedToItems(), table: 'seed' })
  } catch {
    return NextResponse.json({ items: seedToItems(), table: 'seed' })
  }
}
