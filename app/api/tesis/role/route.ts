/**
 * GET /api/tesis/role
 * Tesis paneli rol dogrulama endpoint'i.
 * Kullanicinin tesis paneline erisim yetkisi olup olmadigini dondurur.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkTesisRole } from '@/lib/auth/tesis-role'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ allowed: false, role: null }, { status: 401 })

    const result = await checkTesisRole(user.id)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ allowed: false, role: null }, { status: 500 })
  }
}
