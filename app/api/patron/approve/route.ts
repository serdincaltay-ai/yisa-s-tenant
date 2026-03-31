import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePatron } from '@/lib/auth/api-auth'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const command_id = body.command_id
    const decision = body.decision

    if (!command_id || !decision) {
      return NextResponse.json({ error: 'command_id ve decision gerekli' }, { status: 400 })
    }

    const validDecisions = ['approved', 'rejected', 'cancelled']
    if (!validDecisions.includes(decision)) {
      return NextResponse.json({ error: 'decision: approved, rejected veya cancelled olmalı' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase bağlantısı yok' }, { status: 503 })
    }

    const { error } = await supabase
      .from('patron_commands')
      .update({
        status: decision,
        decision,
        decision_at: new Date().toISOString(),
      })
      .eq('id', command_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, command_id, decision })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
