/**
 * Deploy Agent — Oyna basınca: Bekleyen tüm onayları onayla, push/deploy tetikle
 * Patron yetkisi gerekir
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePatronOrFlow } from '@/lib/auth/api-auth'
import {
  updatePatronCommand,
  updateCeoTask,
  getPatronCommand,
  insertAuditLog,
} from '@/lib/db/ceo-celf'
import { githubPush } from '@/lib/api/github-client'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST() {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof Response) return auth
    const userId = auth.user.id
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Veritabanı bağlantısı yok', ok: false }, { status: 503 })
    }

    const { data: rows, error } = await supabase
      .from('patron_commands')
      .select('id, ceo_task_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: `Supabase: ${error.message}`, ok: false },
        { status: 503 }
      )
    }
    const items = Array.isArray(rows) ? rows : []
    const now = new Date().toISOString()
    let approved = 0
    let pushCount = 0

    for (const row of items) {
      const cmd = await getPatronCommand(row.id)
      const payload = cmd.output_payload ?? {}
      const gh = payload?.github_prepared_commit as { commitSha?: string; owner?: string; repo?: string; branch?: string } | undefined

      if (gh?.commitSha && gh?.owner && gh?.repo) {
        try {
          const pushResult = await githubPush({
            owner: gh.owner,
            repo: gh.repo,
            branch: gh.branch ?? 'main',
            commitSha: gh.commitSha,
          })
          if (pushResult.ok) pushCount++
          await insertAuditLog({
            action: 'oyna_deploy_push',
            entity_type: 'patron_command',
            entity_id: row.id,
            user_id: userId,
            payload: { github: gh, result: pushResult },
          })
        } catch {
          /* push hatası sessiz */
        }
      }

      await updatePatronCommand(row.id, { status: 'approved', decision: 'approve', decision_at: now })
      if (row.ceo_task_id) {
        await updateCeoTask(row.ceo_task_id, { status: 'completed' })
      }
      approved++
    }

    return NextResponse.json({
      ok: true,
      message: `Oyna tamamlandı. ${approved} iş onaylandı, ${pushCount} push/deploy tetiklendi.`,
      approved,
      push_count: pushCount,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
