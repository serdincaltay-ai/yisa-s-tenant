/**
 * YiSA-S Backup Kontrol API
 * GET: Supabase baglantisini ve kritik tablolarin veri butunlugunu kontrol eder.
 * Son kayit tarihlerini raporlar.
 * Vercel Cron ile haftalik otomatik calistirilir (her Pazartesi 03:00 UTC).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCronOrPatron } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** Kontrol edilecek kritik tablolar ve tarih kolonu */
const CRITICAL_TABLES: { table: string; dateColumn: string; label: string }[] = [
  { table: 'tenants', dateColumn: 'created_at', label: 'Tenants (Tesisler)' },
  { table: 'athletes', dateColumn: 'created_at', label: 'Athletes (Sporcular)' },
  { table: 'attendance', dateColumn: 'created_at', label: 'Attendance (Yoklama)' },
  { table: 'payments', dateColumn: 'created_at', label: 'Payments (Ödemeler)' },
  { table: 'demo_requests', dateColumn: 'created_at', label: 'Demo Requests (Demo Talepleri)' },
]

interface TableCheckResult {
  table: string
  label: string
  status: 'ok' | 'empty' | 'error'
  rowCount: number | null
  lastRecord: string | null
  error?: string
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireCronOrPatron(req)
    if (auth instanceof NextResponse) return auth

    // Service role key zorunlu — anon key ile RLS nedeniyle yanlis sonuc doner
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Supabase bağlantısı kurulamadı. SUPABASE_SERVICE_ROLE_KEY veya NEXT_PUBLIC_SUPABASE_URL eksik.',
          checkedAt: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    const supabase = createClient(url, key)

    // Supabase baglanti testi
    const { error: pingError } = await supabase.from('tenants').select('id').limit(1)
    if (pingError) {
      return NextResponse.json(
        {
          ok: false,
          error: `Supabase baglanti hatasi: ${pingError.message}`,
          checkedAt: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // Kritik tablolari kontrol et
    const tableResults: TableCheckResult[] = []

    for (const { table, dateColumn, label } of CRITICAL_TABLES) {
      try {
        // Kayit sayisi
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (countError) {
          tableResults.push({
            table,
            label,
            status: 'error',
            rowCount: null,
            lastRecord: null,
            error: countError.message,
          })
          continue
        }

        // Son kayit tarihi
        const { data: lastRow, error: lastError } = await supabase
          .from(table)
          .select(dateColumn)
          .order(dateColumn, { ascending: false })
          .limit(1)
          .single()

        const row = lastRow as unknown as Record<string, unknown> | null
        const lastRecord = lastError ? null : (row?.[dateColumn] as string | null) ?? null

        tableResults.push({
          table,
          label,
          status: (count ?? 0) > 0 ? 'ok' : 'empty',
          rowCount: count ?? 0,
          lastRecord,
        })
      } catch {
        tableResults.push({
          table,
          label,
          status: 'error',
          rowCount: null,
          lastRecord: null,
          error: 'Beklenmeyen hata',
        })
      }
    }

    const allOk = tableResults.every((r) => r.status === 'ok')
    const errorTables = tableResults.filter((r) => r.status === 'error')
    const emptyTables = tableResults.filter((r) => r.status === 'empty')

    return NextResponse.json({
      ok: allOk,
      checkedAt: new Date().toISOString(),
      supabaseConnection: 'ok',
      summary: {
        totalTablesChecked: tableResults.length,
        okCount: tableResults.filter((r) => r.status === 'ok').length,
        emptyCount: emptyTables.length,
        errorCount: errorTables.length,
      },
      tables: tableResults,
      warnings: [
        ...emptyTables.map((t) => `${t.label} tablosu bos.`),
        ...errorTables.map((t) => `${t.label} kontrol edilemedi: ${t.error}`),
      ],
      backupInfo: {
        supabaseAutoBackup: 'Gunluk otomatik backup (Supabase Pro plan)',
        pgDumpSchedule: 'Haftalik pg_dump (Pazar 02:00 UTC)',
        retentionDays: 90,
        documentation: '/docs/BACKUP-STRATEJISI.md',
      },
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        ok: false,
        error: `Backup kontrol hatasi: ${err}`,
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
