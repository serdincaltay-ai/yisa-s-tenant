import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireDashboard, requirePatronOrFlow } from '@/lib/auth/api-auth'
import {
  updatePatronCommand,
  updateCeoTask,
  insertAuditLog,
  getPatronCommand,
} from '@/lib/db/ceo-celf'
import { saveCeoTemplate } from '@/lib/db/ceo-templates'
import type { TemplateType } from '@/lib/db/ceo-templates'
import { createCeoRoutine, type ScheduleType } from '@/lib/db/ceo-routines'
import { githubPush, githubCreateFiles } from '@/lib/api/github-client'
import { fetchWithRetry } from '@/lib/api/fetch-with-retry'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUSES = new Set(['pending', 'approved', 'rejected', 'cancelled', 'modified'])

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export interface ApprovalItem {
  id: string
  ticket_no?: string
  type: string
  title: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'modified'
  priority?: 'low' | 'normal' | 'high'
  created_at: string
  source?: string
  has_github_commit?: boolean
  has_code_files?: boolean
  /** Tam çıktı - önizleme için */
  displayText?: string
  output_payload?: Record<string, unknown>
  /** Komutu gönderen (Patron e-posta veya "Patron") */
  sent_by_email?: string
  /** Asistan özeti: ne yapıldı, hangi direktör, onaylarsanız ne olur */
  assistant_summary?: string
  /** Hangi direktörlük üretti (CELF) */
  director_key?: string
  director_name?: string
}

export async function GET() {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Veritabani baglantisi yok', items: [], table: null, orphan_count: 0, unprocessed_count: 0 }, { status: 503 })
    }

    const { data, error } = await supabase
      .from('patron_commands')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message, items: [], table: null }, { status: 500 })
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ items: [], table: 'patron_commands', orphan_count: 0, unprocessed_count: 0 })
    }

    const now = Date.now()
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
    const finalStatuses = new Set(['approved', 'rejected', 'cancelled'])
    let orphanCount = 0
    let unprocessedCount = 0
    for (const row of data) {
      const s = String(row.status ?? 'pending')
      if (!finalStatuses.has(s)) unprocessedCount++
      if (s === 'pending' && String(row.created_at ?? '') < dayAgo) orphanCount++
    }

    const items: ApprovalItem[] = data.map((row: Record<string, unknown>) => {
      const rawStatus = String(row.status ?? 'pending')
      const status = (ALLOWED_STATUSES.has(rawStatus) ? rawStatus : 'pending') as ApprovalItem['status']
      const outputPayload = row.output_payload as Record<string, unknown> | null
      const hasGithubCommit = !!(outputPayload?.github_prepared_commit)
      const hasCodeFiles = !!(outputPayload?.code_files && Array.isArray(outputPayload.code_files) && outputPayload.code_files.length > 0)

      const displayText = typeof outputPayload?.displayText === 'string' ? outputPayload.displayText : undefined
      const sentByEmail = typeof outputPayload?.sent_by_email === 'string' ? outputPayload.sent_by_email : undefined
      const assistantSummary = typeof outputPayload?.assistant_summary === 'string' ? outputPayload.assistant_summary : undefined
      const directorKey = typeof outputPayload?.director_key === 'string' ? outputPayload.director_key : undefined
      const directorName = typeof outputPayload?.director_name === 'string' ? outputPayload.director_name : undefined
      return {
        id: String(row.id ?? ''),
        ticket_no: row.ticket_no != null ? String(row.ticket_no) : (outputPayload?.ticket_no != null ? String(outputPayload.ticket_no) : undefined),
        type: String(row.type ?? outputPayload?.task_type ?? 'onay'),
        title: String(row.title ?? row.command ?? '-'),
        description: row.description != null ? String(row.description) : (displayText ? displayText.slice(0, 200) : undefined),
        status,
        priority: (row.priority as 'low' | 'normal' | 'high') ?? 'normal',
        created_at: String(row.created_at ?? ''),
        source: row.source != null ? String(row.source) : undefined,
        has_github_commit: hasGithubCommit,
        has_code_files: hasCodeFiles,
        displayText,
        output_payload: outputPayload ?? undefined,
        sent_by_email: sentByEmail ?? (row.user_id ? 'Dashboard kullanıcısı' : 'Patron'),
        assistant_summary: assistantSummary,
        director_key: directorKey,
        director_name: directorName,
      }
    })

    return NextResponse.json({ items, table: 'patron_commands', orphan_count: orphanCount, unprocessed_count: unprocessedCount })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: err, items: [], table: null, orphan_count: 0, unprocessed_count: 0 }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePatronOrFlow()
    if (auth instanceof NextResponse) return auth
    const userId = auth.user.id

    const body = await req.json()
    const commandId = typeof body.command_id === 'string' ? body.command_id : undefined
    const decision = body.decision as 'approve' | 'reject' | 'cancel' | 'modify' | 'suggest' | 'push'
    const cancelAll = body.cancel_all === true
    const cancelPendingOnly = body.cancel_pending_only === true
    const modifyText = typeof body.modify_text === 'string' ? body.modify_text : undefined
    const saveRoutine = body.save_routine === true
    const schedule = (body.schedule as ScheduleType) ?? undefined

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Veritabani baglantisi yok' }, { status: 503 })
    }

    // Tumunu Iptal Et (veya sadece bekleyenler)
    if (cancelAll || cancelPendingOnly) {
      const statuses = cancelPendingOnly ? ['pending'] : ['pending', 'approved', 'modified']
      const { data: rows, error: fetchErr } = await supabase
        .from('patron_commands')
        .select('id, ceo_task_id, status')
        .in('status', statuses)
        .limit(200)
      if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
      
      const list = (rows ?? []) as { id: string; ceo_task_id: string | null; status: string }[]
      const now = new Date().toISOString()
      let cancelledCount = 0
      
      for (const row of list) {
        const upd = await updatePatronCommand(row.id, {
          status: 'cancelled',
          decision: 'cancel',
          decision_at: now,
        })
        if (!upd.error) {
          cancelledCount++
          if (row.ceo_task_id) await updateCeoTask(row.ceo_task_id, { status: 'cancelled' })
          await insertAuditLog({
            action: 'cancel_all',
            entity_type: 'patron_command',
            entity_id: row.id,
            user_id: userId,
            payload: { cancel_all: true, previous_status: row.status },
          })
        }
      }
      return NextResponse.json({
        ok: true,
        cancelled_count: cancelledCount,
        message: cancelledCount === 0 ? 'Iptal edilecek is yok.' : cancelledCount + ' is iptal edildi.',
      })
    }

    if (!commandId) {
      return NextResponse.json({ error: 'command_id gerekli' }, { status: 400 })
    }

    // Rutin kaydi
    if (saveRoutine && schedule && ['daily', 'weekly', 'monthly'].includes(schedule)) {
      const cmd = await getPatronCommand(commandId)
      if (cmd.error || !cmd.command) {
        return NextResponse.json({ error: 'Komut bulunamadi' }, { status: 404 })
      }
      const payload = cmd.output_payload ?? {}
      const directorKey = (typeof payload.director_key === 'string' ? payload.director_key : 'CCO') as string
      const { id, error } = await createCeoRoutine({
        routine_name: 'Rutin: ' + (cmd.command as string).substring(0, 50),
        routine_type: 'rapor',
        director_key: directorKey,
        command_template: cmd.command as string,
        schedule,
        schedule_time: '02:00',
        created_by: userId ?? undefined,
      })
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ ok: true, routine_id: id, message: 'Rutin gorev kaydedildi.' })
    }

    if (!decision) {
      return NextResponse.json({ error: 'decision gerekli (approve, reject, cancel, modify, suggest, push)' }, { status: 400 })
    }
    if (!['approve', 'reject', 'cancel', 'modify', 'suggest', 'push'].includes(decision)) {
      return NextResponse.json({ error: 'Gecersiz decision' }, { status: 400 })
    }

    // Oneri Iste (suggest)
    if (decision === 'suggest') {
      const cmd = await getPatronCommand(commandId)
      if (cmd.error || !cmd.output_payload) {
        return NextResponse.json({ error: 'Komut bulunamadi' }, { status: 404 })
      }
      const displayText = typeof cmd.output_payload.displayText === 'string' ? cmd.output_payload.displayText : ''
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        return NextResponse.json({ suggestions: 'Oneri servisi su an kullanilamiyor.', ok: true })
      }
      const res = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          max_tokens: 512,
          messages: [
            { role: 'system', content: 'Sen YiSA-S kalite asistanisin. Verilen ciktiyi inceleyip gelistirilebilecek 3-5 kisa oneri ver. Turkce, madde madde.' },
            { role: 'user', content: 'Gorev: ' + cmd.command + '\n\nMevcut cikti:\n' + displayText + '\n\nGelistirme onerileri (kisa, net):' },
          ],
        }),
      })
      if (!res.ok) {
        return NextResponse.json({ suggestions: 'Oneri alinamadi.', ok: true })
      }
      const data = await res.json()
      const suggestions = data.choices?.[0]?.message?.content ?? 'Oneri olusturulamadi.'
      return NextResponse.json({ ok: true, suggestions })
    }

    // GitHub Push (ayri adim)
    if (decision === 'push') {
      const { data: cmdRow, error: cmdErr } = await supabase
        .from('patron_commands')
        .select('id, status, output_payload')
        .eq('id', commandId)
        .single()
      if (cmdErr || !cmdRow) {
        return NextResponse.json({ error: 'Komut bulunamadi' }, { status: 404 })
      }
      if (cmdRow.status !== 'approved') {
        return NextResponse.json({ error: 'Push icin once isi onaylamaniz gerekir.' }, { status: 400 })
      }
      const outputPayload = cmdRow.output_payload as Record<string, unknown> | null
      
      // code_files varsa GitHub'a dosya olustur
      const codeFiles = outputPayload?.code_files as Array<{ file: string; content: string; language: string }> | undefined
      if (codeFiles && codeFiles.length > 0) {
        const owner = process.env.GITHUB_OWNER ?? 'serdincaltay-ai'
        const repo = process.env.GITHUB_REPO ?? 'yisa-s-app'
        const branch = process.env.GITHUB_BRANCH ?? 'main'
        
        try {
          const result = await githubCreateFiles({
            owner,
            repo,
            branch,
            files: codeFiles.map(f => ({ path: f.file, content: f.content })),
            message: 'feat: CEO auto-deploy - ' + (cmdRow.output_payload as Record<string, unknown>)?.director_key,
          })
          
          // output_payload guncelle
          await supabase.from('patron_commands').update({
            output_payload: {
              ...outputPayload,
              github_pushed_at: new Date().toISOString(),
              github_push_result: result,
            }
          }).eq('id', commandId)
          
          await insertAuditLog({
            action: 'push',
            entity_type: 'patron_command',
            entity_id: commandId,
            user_id: userId,
            payload: { files: codeFiles.map(f => f.file), result },
          })
          
          return NextResponse.json({ 
            ok: true, 
            message: 'GitHub push basarili. ' + codeFiles.length + ' dosya olusturuldu.', 
            github_push: 'pushed',
            files_created: codeFiles.map(f => f.file),
          })
        } catch (pushErr) {
          const errMsg = pushErr instanceof Error ? pushErr.message : String(pushErr)
          return NextResponse.json({ ok: false, error: 'GitHub push basarisiz: ' + errMsg }, { status: 500 })
        }
      }
      
      // Hazir commit varsa push et
      const gh = outputPayload?.github_prepared_commit as { commitSha: string; owner: string; repo: string; branch?: string } | undefined
      if (gh?.commitSha && gh?.owner && gh?.repo) {
        const pushResult = await githubPush({
          owner: gh.owner,
          repo: gh.repo,
          branch: gh.branch ?? 'main',
          commitSha: gh.commitSha,
        })
        await insertAuditLog({
          action: 'push',
          entity_type: 'patron_command',
          entity_id: commandId,
          user_id: userId,
          payload: { github: gh, result: pushResult },
        })
        if (!pushResult.ok) {
          return NextResponse.json({ ok: false, error: 'GitHub push basarisiz: ' + ('error' in pushResult ? pushResult.error : 'unknown') }, { status: 500 })
        }
        return NextResponse.json({ ok: true, message: 'GitHub push basarili.', github_push: 'pushed' })
      }
      
      return NextResponse.json({ error: 'Bu iste hazirlanmis kod veya GitHub commit yok.' }, { status: 400 })
    }

    // Normal kararlar: approve / reject / cancel / modify
    const now = new Date().toISOString()

    let resultText: string | undefined
    let autoDeployed = false
    if (decision === 'approve') {
      const cmd = await getPatronCommand(commandId)
      const payload = cmd.output_payload ?? {}
      resultText = typeof payload.displayText === 'string' ? payload.displayText : undefined
      // Onayla = Deploy: Hazır GitHub commit varsa otomatik push et
      const gh = payload?.github_prepared_commit as { commitSha: string; owner: string; repo: string; branch?: string } | undefined
      if (gh?.commitSha && gh?.owner && gh?.repo) {
        try {
          const pushResult = await githubPush({
            owner: gh.owner,
            repo: gh.repo,
            branch: gh.branch ?? 'main',
            commitSha: gh.commitSha,
          })
          if (pushResult.ok) autoDeployed = true
          await insertAuditLog({
            action: 'approve_auto_push',
            entity_type: 'patron_command',
            entity_id: commandId,
            user_id: userId,
            payload: { github: gh, result: pushResult },
          })
        } catch (_) { /* push hatası sessiz */ }
      }
    }

    const status =
      decision === 'approve' ? 'approved'
      : decision === 'reject' ? 'rejected'
      : decision === 'cancel' ? 'cancelled'
      : 'modified'

    const updateErr = await updatePatronCommand(commandId, {
      status,
      decision,
      decision_at: now,
      modify_text: modifyText,
    })
    if (updateErr.error) {
      return NextResponse.json({ error: updateErr.error }, { status: 500 })
    }

    // celf_tasks senkronizasyonu (v2)
    const cmdForCeo = await getPatronCommand(commandId)
    if (cmdForCeo.ceo_task_id && !cmdForCeo.error) {
      const celfStatus =
        decision === 'approve' ? 'completed'
        : decision === 'reject' || decision === 'cancel' ? 'cancelled'
        : undefined
      if (celfStatus) {
        await updateCeoTask(cmdForCeo.ceo_task_id, { status: celfStatus })
      }
    }

    await insertAuditLog({
      action: decision,
      entity_type: 'patron_command',
      entity_id: commandId,
      user_id: userId,
      payload: { modify_text: modifyText },
    })

    // Onaylanan şablon çıktısını ceo_templates'e kaydet
    if (decision === 'approve') {
      const cmdForTemplate = await getPatronCommand(commandId)
      const payload = cmdForTemplate.output_payload ?? {}
      const displayText = typeof payload.displayText === 'string' ? payload.displayText : ''
      const directorKey = (payload.director_key as string) ?? ''
      const taskName = (payload.task_name as string) ?? ''
      const command = (cmdForTemplate.command as string) ?? ''
      const isTemplateLike =
        (displayText.length > 50 &&
          (/şablon|sablon|template/i.test(taskName) ||
            /şablon|sablon|template/i.test(command) ||
            ['CPO', 'CFO', 'CMO', 'CDO', 'CHRO', 'CLO'].includes(directorKey)))
      if (isTemplateLike && displayText) {
        const typeMap: Record<string, TemplateType> = {
          CFO: 'rapor',
          CPO: 'ui',
          CMO: 'email',
          CDO: 'rapor',
          CHRO: 'bildirim',
          CLO: 'rapor',
        }
        const templateType = (typeMap[directorKey] ?? 'rapor') as TemplateType
        await saveCeoTemplate({
          template_name: taskName || command?.slice(0, 80) || 'Onaylanan Şablon',
          template_type: templateType,
          director_key: directorKey || undefined,
          content: { body: displayText, source: 'patron_approval', patron_command_id: commandId },
          is_approved: true,
          approved_by: userId ?? undefined,
        })
      }
    }

    const message =
      decision === 'approve'
        ? (autoDeployed ? 'Islem onaylandi ve deploy edildi (GitHub push).' : 'Islem onaylandi.')
        : decision === 'reject' ? 'Islem reddedildi.'
        : decision === 'cancel' ? 'Islem iptal edildi.'
        : 'Degisiklik kaydedildi.'

    return NextResponse.json({
      ok: true,
      command_id: commandId,
      decision,
      status,
      result: resultText,
      message,
      auto_deployed: autoDeployed,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Onay karari hatasi', detail: err }, { status: 500 })
  }
}
