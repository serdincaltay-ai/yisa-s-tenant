/**
 * CELF Direktörleri — Bugünkü iş sayıları
 * Hangi direktör çalıştı, kaç iş geldi/gitti
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CELF_DIRECTORATE_KEYS, type DirectorKey } from '@/lib/robots/celf-center'
import { requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET() {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ directors: [], error: 'Supabase yok' })
    }

    const today = new Date().toISOString().slice(0, 10)
    const directors: Record<string, { name: string; gelen: number; giden: number; durum: 'idle' | 'active' }> = {}

    for (const key of CELF_DIRECTORATE_KEYS) {
      const d = (await import('@/lib/robots/celf-center')).CELF_DIRECTORATES[key as DirectorKey]
      directors[key] = { name: d?.name ?? key, gelen: 0, giden: 0, durum: 'idle' }
    }

    // patron_commands veya celf_tasks'dan bugünkü işleri say
    try {
      const { data: rows } = await supabase
        .from('patron_commands')
        .select('id, output_payload, status, created_at')
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59.999')

      if (Array.isArray(rows)) {
        for (const row of rows) {
          const payload = row.output_payload as { director_key?: string } | null
          const dk = payload?.director_key ?? 'CCO'
          if (directors[dk]) {
            directors[dk].gelen++
            if (row.status === 'approved') directors[dk].giden++
            if (directors[dk].gelen > 0) directors[dk].durum = 'active'
          }
        }
      }
    } catch (_) {
      // tablo yoksa sessiz geç
    }

    try {
      const { data: celfRows } = await supabase
        .from('celf_tasks')
        .select('id, directorate, status, created_at')
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59.999')

      if (Array.isArray(celfRows)) {
        for (const row of celfRows) {
          const dk = (row.directorate ?? 'CCO') as string
          if (directors[dk]) {
            directors[dk].gelen++
            if (row.status === 'completed') directors[dk].giden++
            if (directors[dk].gelen > 0) directors[dk].durum = 'active'
          }
        }
      }
    } catch (_) {}

    return NextResponse.json({
      directors: Object.entries(directors).map(([key, v]) => ({ key, ...v })),
      today,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ directors: [], error: err })
  }
}
