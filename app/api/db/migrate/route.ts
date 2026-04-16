import { NextResponse } from 'next/server'
import { requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requirePatron()
  if (auth instanceof NextResponse) return auth

  return NextResponse.json(
    {
      ok: false,
      error: 'Bu endpoint devre dışı bırakıldı.',
      message:
        'DDL migration işlemleri yalnızca supabase/migrations altındaki SQL dosyaları ile yürütülmelidir (SSOT).',
      migration_source: 'supabase/migrations',
    },
    { status: 410 }
  )
}
