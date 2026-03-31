/**
 * YİSA-S Sistem Health API
 * Robot durumları: GPT, Claude, Gemini, Together, GitHub, Supabase, Vercel
 * Her 60 saniyede bir fetch ile kullanılır.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ROBOTS = [
  { id: 'GPT', name: 'GPT', key: 'OPENAI_API_KEY' },
  { id: 'Claude', name: 'Claude', key: 'ANTHROPIC_API_KEY' },
  { id: 'Gemini', name: 'Gemini', key: 'GOOGLE_API_KEY' },
  { id: 'Together', name: 'Together', key: 'TOGETHER_API_KEY' },
  { id: 'GitHub', name: 'GitHub', key: 'GITHUB_TOKEN' },
  { id: 'Supabase', name: 'Supabase', key: 'SUPABASE_SERVICE_ROLE_KEY' },
  { id: 'Vercel', name: 'Vercel', key: 'VERCEL_TOKEN' },
] as const

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET() {
  try {
    const robots: { id: string; name: string; status: 'ok' | 'no_key' | 'error'; latency?: number }[] = []

    for (const robot of ROBOTS) {
      const hasKey = !!process.env[robot.key]?.trim()
      if (!hasKey) {
        robots.push({ id: robot.id, name: robot.name, status: 'no_key' })
        continue
      }

      if (robot.id === 'Supabase') {
        const start = Date.now()
        try {
          const supabase = getSupabase()
          if (!supabase) {
            robots.push({ id: robot.id, name: robot.name, status: 'error' })
            continue
          }
          const { error } = await supabase.from('patron_commands').select('id').limit(1)
          const latency = Date.now() - start
          robots.push({
            id: robot.id,
            name: robot.name,
            status: error ? 'error' : 'ok',
            latency,
          })
        } catch {
          robots.push({ id: robot.id, name: robot.name, status: 'error' })
        }
      } else {
        robots.push({ id: robot.id, name: robot.name, status: 'ok' })
      }
    }

    const activeCount = robots.filter((r) => r.status === 'ok').length
    const totalCount = robots.length

    return NextResponse.json({
      ok: activeCount > 0,
      robots,
      summary: `${activeCount}/${totalCount} aktif`,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, error: err, robots: [], timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
