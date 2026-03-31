import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePatron } from '@/lib/auth/api-auth'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}
export async function GET() {
  const auth = await requirePatron()
  if (auth instanceof NextResponse) return auth

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ items: [] })
  try {
    const { data, error } = await supabase.from('patron_commands').select('id, command, title, status, priority, director_key, output_payload, created_at').in('status', ['pending', 'review', 'processing']).order('created_at', { ascending: false }).limit(50)
    if (error) return NextResponse.json({ items: [], error: error.message })
    return NextResponse.json({ items: data || [] })
  } catch (e) {
    return NextResponse.json({ items: [], error: e instanceof Error ? e.message : String(e) })
  }
}
