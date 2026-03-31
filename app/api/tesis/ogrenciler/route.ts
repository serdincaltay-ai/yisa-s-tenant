import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { checkTesisRole } from '@/lib/auth/tesis-role'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })

    // Rol dogrulama
    const roleCheck = await checkTesisRole(user.id)
    if (!roleCheck.allowed) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })

    const tenantId = await getTenantIdWithFallback(user.id, req)
    if (!tenantId) return NextResponse.json({ items: [], message: 'Tenant atanmamis' })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    const status = searchParams.get('status')?.trim()
    const branch = searchParams.get('branch')?.trim()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)
    let query = service
      .from('athletes')
      .select('id, name, surname, birth_date, gender, branch, level, "group", status, parent_name, parent_phone, parent_email, notes, trainer_id, created_at')
      .eq('tenant_id', tenantId)

    if (status && ['active', 'inactive', 'trial'].includes(status)) query = query.eq('status', status)
    if (branch) query = query.eq('branch', branch)
    if (q) query = query.or(`name.ilike.%${q}%,surname.ilike.%${q}%`)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[tesis/ogrenciler GET]', e)
    return NextResponse.json({ items: [] })
  }
}
