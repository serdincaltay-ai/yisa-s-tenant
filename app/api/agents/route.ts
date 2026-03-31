import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { requirePatron } from '@/lib/auth/api-auth'

export async function GET() {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabaseServer()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase bağlantısı kurulamadı' },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('agent_states')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Agent verileri alınamadı', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ agents: data })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: 'Beklenmeyen hata', detail: errorMessage },
      { status: 500 }
    )
  }
}
