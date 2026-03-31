import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Veli paneli: Giriş yapan kullanıcının çocuklarını (parent_user_id = auth.uid) döner.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ items: [] })

    const service = createServiceClient(url, key)

    // Veli ilk girişinde: parent_email = user.email olan kayıtları parent_user_id ile bağla
    const userEmail = (user.email ?? '').trim().toLowerCase()
    if (userEmail) {
      const { data: candidates } = await service.from('athletes').select('id, parent_email').is('parent_user_id', null).not('parent_email', 'is', null).limit(500)
      const toLink = (candidates ?? []).filter((r: { parent_email?: string }) => (r.parent_email ?? '').toLowerCase() === userEmail)
      for (const row of toLink) {
        await service.from('athletes').update({ parent_user_id: user.id }).eq('id', row.id)
      }
    }

    const { data, error } = await service
      .from('athletes')
      .select('id, name, surname, birth_date, gender, branch, level, status, tenant_id, created_at, ders_kredisi, toplam_kredi')
      .eq('parent_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    console.error('[veli/children]', e)
    return NextResponse.json({ items: [] })
  }
}
