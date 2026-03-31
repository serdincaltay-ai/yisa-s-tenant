/**
 * YiSA-S Guvenlik Robotu — Guvenlik Loglari API
 * GET /api/robot/guvenlik/logs
 * security_logs tablosundan son 100 log getirir
 */

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase"
import { requirePatron } from "@/lib/auth/api-auth"

export async function GET() {
  const auth = await requirePatron()
  if (auth instanceof NextResponse) return auth

  const db = getSupabaseServer()
  if (!db) {
    return NextResponse.json({ logs: [], error: "Supabase baglantisi yok" })
  }

  try {
    const { data, error } = await db
      .from("security_logs")
      .select("id, event_type, severity, description, blocked, created_at")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ logs: [], error: error.message })
    }

    return NextResponse.json({ logs: data ?? [] })
  } catch {
    return NextResponse.json({ logs: [], error: "Guvenlik loglari sorgulama hatasi" })
  }
}
