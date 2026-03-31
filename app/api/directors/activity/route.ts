/**
 * Direktör aktivitesi — Ne üretiyor, ne çıkartıyor, ne çalışıyor
 * patron_commands + celf_logs son kayıtlar
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CELF_DIRECTORATE_KEYS, CELF_DIRECTORATES, type DirectorKey } from '@/lib/robots/celf-center'
import { requirePatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export type DirectorActivity = {
  director_key: string
  director_name: string
  gelen: number
  giden: number
  durum: 'idle' | 'active'
  son_isler: {
    id: string
    title: string
    displayText?: string
    status: string
    created_at: string
  }[]
}

export async function GET() {
  try {
    const auth = await requirePatron()
    if (auth instanceof NextResponse) return auth

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ directors: [], error: 'Supabase yok' })

    const today = new Date().toISOString().slice(0, 10)
    const directors: Record<string, DirectorActivity> = {}

    for (const key of CELF_DIRECTORATE_KEYS) {
      const d = CELF_DIRECTORATES[key as DirectorKey]
      directors[key] = {
        director_key: key,
        director_name: d?.name ?? key,
        gelen: 0,
        giden: 0,
        durum: 'idle',
        son_isler: [],
      }
    }

    const { data: rows } = await supabase
      .from('patron_commands')
      .select('id, command, title, output_payload, status, created_at')
      .order('created_at', { ascending: false })
      .limit(80)

    if (Array.isArray(rows)) {
      for (const row of rows) {
        const payload = row.output_payload as { director_key?: string; displayText?: string } | null
        const dk = (payload?.director_key ?? 'CCO') as string
        if (!directors[dk]) continue

        const created = String(row.created_at ?? '')
        if (created.startsWith(today)) {
          directors[dk].gelen++
          if (row.status === 'approved' || row.status === 'completed') directors[dk].giden++
          directors[dk].durum = 'active'
        }

        if (directors[dk].son_isler.length < 3) {
          directors[dk].son_isler.push({
            id: row.id,
            title: String(row.title ?? row.command ?? '-').slice(0, 80),
            displayText: payload?.displayText ? String(payload.displayText).slice(0, 200) : undefined,
            status: String(row.status ?? 'pending'),
            created_at: created,
          })
        }
      }
    }

    return NextResponse.json({
      directors: Object.values(directors),
      today,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ directors: [], error: err })
  }
}
