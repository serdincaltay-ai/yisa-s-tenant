/**
 * YiSA-S Veri Robotu — Veritabani Durum API
 * GET /api/robot/veri/status
 * Supabase tablolarinin listesi, satir sayilari
 */

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase"
import { requirePatron } from "@/lib/auth/api-auth"

interface TableInfo {
  name: string
  row_count: number
  last_updated: string | null
}

export async function GET() {
  const auth = await requirePatron()
  if (auth instanceof NextResponse) return auth

  const db = getSupabaseServer()
  if (!db) {
    return NextResponse.json({
      total_tables: 0,
      total_rows: 0,
      tables: [],
      fetched_at: new Date().toISOString(),
      error: "Supabase baglantisi yapilandirilmamis",
    })
  }

  try {
    // Get table list and row counts from information_schema via RPC or direct query
    // Since we can't run raw SQL easily, we'll query known tables
    const knownTables = [
      "tenants",
      "users",
      "athletes",
      "trainers",
      "parents",
      "branches",
      "classes",
      "enrollments",
      "attendance",
      "measurements",
      "demo_requests",
      "franchises",
      "franchise_staff",
      "franchise_branches",
      "franchise_announcements",
      "franchise_documents",
      "franchise_contacts",
      "franchise_attendance",
      "parent_messages",
      "parent_payments",
      "chat_messages",
      "security_logs",
      "audit_log",
      "celf_audit_logs",
      "celf_logs",
      "patron_commands",
      "celf_tasks",
      "cost_reports",
      "routine_tasks",
      "task_results",
      "director_rules",
      "sales_prices",
    ]

    const tables: TableInfo[] = []
    let totalRows = 0

    // Query each known table for its count
    for (const tableName of knownTables) {
      try {
        const { count, error } = await db
          .from(tableName)
          .select("*", { count: "exact", head: true })

        if (!error && count !== null) {
          tables.push({
            name: tableName,
            row_count: count,
            last_updated: null,
          })
          totalRows += count
        }
      } catch {
        // Table might not exist, skip
      }
    }

    // Sort by row count descending
    tables.sort((a, b) => b.row_count - a.row_count)

    return NextResponse.json({
      total_tables: tables.length,
      total_rows: totalRows,
      tables,
      fetched_at: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({
      total_tables: 0,
      total_rows: 0,
      tables: [],
      fetched_at: new Date().toISOString(),
      error: "Veritabani sorgulama hatasi",
    })
  }
}
