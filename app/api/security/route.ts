/**
 * Güvenlik API - Kontrol ve log listesi
 * POST: message + action? → securityCheck → allowed / blocked
 * GET: security_logs listesi (limit query)
 */

import { NextRequest, NextResponse } from 'next/server'
import { securityCheck } from '@/lib/robots/security-robot'
import { getSecurityLogs } from '@/lib/db/security-logs'
import { requireAuth, requirePatron } from '@/lib/auth/api-auth'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message : (body.message ?? '')
    const action = typeof body.action === 'string' ? body.action : undefined
    const userId = typeof body.user_id === 'string' ? body.user_id : (body.user?.id as string | undefined)
    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
    const logToDb = body.log_to_db !== false

    const result = await securityCheck({
      message,
      action,
      userId,
      ipAddress,
      logToDb,
    })

    return NextResponse.json({
      ok: true,
      allowed: result.allowed,
      requires_approval: result.requiresApproval ?? false,
      reason: result.reason,
      severity: result.severity,
      blocked: !result.allowed,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Güvenlik kontrolü hatası', detail: err }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePatron()
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)
    const { data, error } = await getSecurityLogs(limit)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Log listesi hatası', detail: err }, { status: 500 })
  }
}
