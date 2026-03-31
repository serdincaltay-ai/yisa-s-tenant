/**
 * SEÇENEK 2 - TAM SİSTEM AKIŞI
 * 1) Patron mesaj → Gemini (önce) veya GPT imla düzelt → "Bu mu demek istediniz?" + [Şirket İşi] [Özel İş] [Hayır Düzelt]
 * 2) Özel İş → Asistan (Claude/Gemini) halleder, CELF'e gitmez → "Kaydet?" → Evet ise patron_private_tasks
 * 3) Şirket İşi → CEO → CELF → Sonuç Patron onayına → Onayla/Reddet/Öneri/Değiştir → Rutin/Bir seferlik
 * Patron Kararı: 30 Ocak 2026
 *
 * KURAL: API'ler sadece 2 bölümde — Asistan (imla GPT, özel iş Claude) + CELF (runCelfDirector).
 * CEO/COO/güvenlik API çağırmaz; sadece kurallar ve CELF tetiklemesi. Bkz. API_SADECE_ASISTAN_CELF_KURULUM.md
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  detectTaskType,
  routeToDirector,
  isRoutineRequest,
  getRoutineScheduleFromMessage,
} from '@/lib/robots/ceo-robot'
import { analyzeCommand, isStrategyChange, type CIOAnalysisResult } from '@/lib/robots/cio-robot'
import { logCIOAnalysis } from '@/lib/db/cio-logs'
import { CELF_DIRECTORATES, runCelfChecks, type DirectorKey } from '@/lib/robots/celf-center'
import { parsePatronDirective, getDirectorFromDirective, isValidDirectorKey } from '@/lib/robots/patron-directives'
import { securityCheck } from '@/lib/robots/security-robot'
import { archiveTaskResult } from '@/lib/robots/data-robot'
import { saveChatMessage } from '@/lib/db/chat-messages'
import { savePrivateTask } from '@/lib/db/patron-private'
import { logCelfAudit } from '@/lib/db/celf-audit'
import {
  createCeoTask,
  updateCeoTask,
  createPatronCommand,
  updatePatronCommand,
  insertCelfLog,
  getPendingPatronCommandCount,
  getLatestPendingPatronCommand,
  getPatronCommand,
  insertAuditLog,
} from '@/lib/db/ceo-celf'
import { canTriggerFlow, isPatron } from '@/lib/auth/roles'
import { requireAuth } from '@/lib/auth/api-auth'
import { correctSpelling, askConfirmation } from '@/lib/ai/gpt-service'
import { runCelfDirector, callClaude } from '@/lib/ai/celf-execute'
import { classifyPatronMessage, isApprovalPhrase } from '@/lib/patron-chat-classifier'
import { githubPush } from '@/lib/api/github-client'
import { callAssistantByProvider, callAssistantChain, type AssistantProvider } from '@/lib/ai/assistant-provider'

function taskTypeToLabel(taskType: string): string {
  const map: Record<string, string> = {
    research: 'araştırma',
    design: 'tasarım',
    code: 'kod',
    report: 'rapor',
    general: 'genel',
  }
  return map[taskType] ?? taskType
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message : (body.message ?? 'Merhaba')
    // GÜVENLİK: Kullanıcı bilgisi her zaman session'dan alınır, body'den asla.
    const sessionUser = authResult.user
    const userId = sessionUser.id
    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
    const confirmType = body.confirm_type as 'company' | 'private' | undefined
    const confirmedFirstStep = body.confirmed_first_step === true
    const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key.trim() || undefined : undefined
    const correctedMessage = typeof body.corrected_message === 'string' ? body.corrected_message : undefined
    const savePrivate = body.save_private === true
    const privateCommand = typeof body.private_command === 'string' ? body.private_command : undefined
    const privateResult = typeof body.private_result === 'string' ? body.private_result : undefined
    const VALID_PROVIDERS = ['GPT', 'GEMINI', 'CLAUDE', 'CLOUD', 'V0', 'CURSOR', 'SUPABASE', 'GITHUB', 'VERCEL', 'RAILWAY', 'FAL'] as const
    const assistantProvider = VALID_PROVIDERS.includes(body.assistant_provider as (typeof VALID_PROVIDERS)[number])
      ? (body.assistant_provider as AssistantProvider)
      : ('GEMINI' as AssistantProvider)
    const assistantChain = Array.isArray(body.assistant_chain) && body.assistant_chain.length > 0
      ? body.assistant_chain.filter((p: unknown) => typeof p === 'string' && VALID_PROVIDERS.includes(p as (typeof VALID_PROVIDERS)[number])).slice(0, 5)
      : []
    const sendAsCommand = body.send_as_command === true
    const asRoutine = body.as_routine === true
    const rawTarget = typeof body.target_director === 'string' ? body.target_director.trim().toUpperCase() : ''
    const targetDirector = rawTarget && isValidDirectorKey(rawTarget) ? rawTarget : undefined

    const messageToUse = correctedMessage ?? message
    const skipSpelling = body.skip_spelling === true || body.skip_imla === true
    const customSystemPrompt = typeof body.system_prompt === 'string' ? body.system_prompt : (typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined)

    // ─── Rol guard: Flow (CEO/CELF/onay) sadece Patron ve üst roller tetikleyebilir ─
    // GÜVENLİK: Rol kontrolü session user üzerinden yapılır (body.user KULLANILMAZ)
    if (savePrivate || confirmType === 'private' || confirmType === 'company') {
      if (!canTriggerFlow(sessionUser)) {
        return NextResponse.json(
          { error: 'Yetkisiz erişim. Flow sadece Patron ve yetkili roller tarafından tetiklenebilir.', blocked: true },
          { status: 403 }
        )
      }
    }

    // ─── Özel iş "Kaydet?" → Evet: patron_private_tasks'a kaydet ─────────────
    if (savePrivate && userId && privateCommand && privateResult != null) {
      const saved = await savePrivateTask({
        patron_id: userId,
        command: privateCommand,
        result: privateResult,
        task_type: 'genel',
        ai_providers: ['CLAUDE'],
      })
      if (saved.error) {
        return NextResponse.json({ error: saved.error }, { status: 500 })
      }
      return NextResponse.json({
        status: 'private_saved',
        message: 'Kendi alanınıza kaydedildi.',
        flow: 'Patron özel iş → Kaydet',
      })
    }

    // ─── a) Önce securityCheck ─────────────────────────────────────────────
    const security = await securityCheck({
      message: messageToUse,
      userId,
      ipAddress,
      logToDb: true,
    })
    if (!security.allowed) {
      return NextResponse.json(
        { error: security.reason ?? 'Bu işlem AI için yasaktır.', blocked: true },
        { status: 403 }
      )
    }

    const isPatronUser = isPatron(sessionUser)

    // ─── PATRON: confirm_type yoksa önce onay/konuşma/komut ayrımı ─────────────────────
    if (!confirmType && isPatronUser) {
      // 1) "Onaylıyorum" vb. → Bekleyen işi onayla, push/deploy, "Push yapıldı" dön
      if (isApprovalPhrase(messageToUse) && userId) {
        const pending = await getLatestPendingPatronCommand(userId)
        if (pending.id) {
          const now = new Date().toISOString()
          const cmd = await getPatronCommand(pending.id)
          const payload = cmd.output_payload ?? {}
          let pushDone = false
          const gh = payload?.github_prepared_commit as { commitSha: string; owner: string; repo: string; branch?: string } | undefined
          if (gh?.commitSha && gh?.owner && gh?.repo) {
            try {
              const pushResult = await githubPush({
                owner: gh.owner,
                repo: gh.repo,
                branch: gh.branch ?? 'main',
                commitSha: gh.commitSha,
              })
              if (pushResult.ok) pushDone = true
              await insertAuditLog({
                action: 'approve_auto_push',
                entity_type: 'patron_command',
                entity_id: pending.id,
                user_id: userId,
                payload: { github: gh, result: pushResult },
              })
            } catch (_) { /* push hatası sessiz */ }
            await updatePatronCommand(pending.id, {
              status: 'approved',
              decision: 'approve',
              decision_at: now,
            })
            if (pending.ceo_task_id) {
              await updateCeoTask(pending.ceo_task_id, { status: 'completed' })
            }
            const outText = pushDone
              ? 'Patron onayı uygulandı. Push yapıldı, deploy hazır.'
              : 'Patron onayı kaydedildi.'
            await saveChatMessage({
              user_id: userId,
              message: messageToUse,
              response: outText,
              ai_providers: [],
            })
            return NextResponse.json({
              status: 'patron_approval_done',
              flow: 'Patron onay (chat) → Push / Deploy',
              text: outText,
              push_done: pushDone,
              message: outText,
            })
          }
          await updatePatronCommand(pending.id, {
            status: 'approved',
            decision: 'approve',
            decision_at: now,
          })
          if (pending.ceo_task_id) {
            await updateCeoTask(pending.ceo_task_id, { status: 'completed' })
          }
          await saveChatMessage({
            user_id: userId,
            message: messageToUse,
            response: 'Patron onayı uygulandı.',
            ai_providers: [],
          })
          return NextResponse.json({
            status: 'patron_approval_done',
            flow: 'Patron onay (chat)',
            text: 'Patron onayı uygulandı.',
            push_done: false,
            message: 'Patron onayı uygulandı.',
          })
        }
        // Bekleyen iş yok; normal yanıt ver
      }

      // 2) CEO'ya Gönder butonu: send_as_command=true → doğrudan komut (konuşma değil)
      if (sendAsCommand) {
        // Aşağıya düşer: CIO → CEO → CELF
      } else if (classifyPatronMessage(messageToUse) === 'conversation') {
        // Konuşma/araştırma → Zincir varsa sırayla çalıştır, yoksa tek asistan
        // Sistem durumu/bilgisi istendiğinde gerçek veriyi enjekte et
        const sistemSoru = /\b(sistem\s+(durumu|bilgisi|özeti)|genel\s+durum|ne\s+durumda|durum\s+nedir)\b/i.test(messageToUse)
        let promptForAssistant = messageToUse
        if (sistemSoru) {
          try {
            const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
            const proto = req.headers.get('x-forwarded-proto') || 'http'
            const base = `${proto}://${host}`
            const [statusRes, healthRes] = await Promise.all([
              fetch(`${base}/api/system/status`).then((r) => r.json()).catch(() => null),
              fetch(`${base}/api/health`).then((r) => r.json()).catch(() => null),
            ])
            const sistemOzeti = [
              statusRes ? `Sistem durumu: ${statusRes.overall ?? 'bilinmiyor'}. Veritabanı: ${statusRes.database?.connected ? 'OK' : 'Hata'}. Direktörlükler: ${statusRes.directorates?.length ?? 0}. AI servisleri: ${statusRes.aiServices?.filter((s: { configured: boolean }) => s.configured).length ?? 0}/${statusRes.aiServices?.length ?? 0}.` : '',
              healthRes ? `Health: ${healthRes.ok ? 'OK' : healthRes.error ?? 'bilinmiyor'}.` : '',
            ].filter(Boolean).join(' ')
            if (sistemOzeti) {
              promptForAssistant = `[Sistem verisi: ${sistemOzeti}]\n\nKullanıcı sorusu: ${messageToUse}\n\nYukarıdaki gerçek sistem verisine göre kısa, net Türkçe yanıt ver.`
            }
          } catch (_) { /* sistem verisi alınamazsa normal devam */ }
        }
        const chain = assistantChain.length > 0 ? assistantChain : [assistantProvider]
        const { text: conversationText, providers } = await callAssistantChain(chain, promptForAssistant, customSystemPrompt)
        const resultText = conversationText ?? 'Yanıt oluşturulamadı.'
        if (userId) {
          await saveChatMessage({
            user_id: userId,
            message: messageToUse,
            response: resultText,
            ai_providers: providers,
          })
        }
        return NextResponse.json({
          status: 'patron_conversation_done',
          flow: chain.length > 1 ? `Patron konuşma (zincir: ${providers.join(' → ')})` : `Patron konuşma (${providers[0] ?? assistantProvider})`,
          text: resultText,
          ai_provider: providers[providers.length - 1],
          ai_providers: providers,
          message: 'Konuşma tamamlandı. Onaylamak istediğiniz bir iş varsa "Onaylıyorum" yazın veya CEO\'ya Gönder ile komut gönderin.',
        })
      }

      // 3) Komut (veya send_as_command) → Aşağıya düşer: CIO → CEO → CELF → sonuç onay kuyruğuna
    }

    // ─── 1) İLK ADIM: confirm_type yoksa imla + "Bu mu demek istediniz?" — skip_spelling veya basit selamlaşmada ATLANIR ─
    if (!confirmType) {
      if (isPatronUser) {
        // Patron: konuşma/onay yukarıda halledildi; kalan komut aşağıya düşer
      } else if (skipSpelling || /^\s*(merhaba|selam|hey|hi|hello)\s*$/i.test(message.trim())) {
        // İmla atla: direkt Gemini yanıtı dön
        const chain = assistantChain.length > 0 ? assistantChain : [assistantProvider]
        const { text: conversationText, providers } = await callAssistantChain(chain, messageToUse, customSystemPrompt)
        const resultText = conversationText ?? 'Yanıt oluşturulamadı.'
        if (userId) {
          await saveChatMessage({
            user_id: userId,
            message: messageToUse,
            response: resultText,
            ai_providers: providers,
          })
        }
        return NextResponse.json({
          status: 'patron_conversation_done',
          flow: `Direkt (${providers[providers.length - 1] ?? 'GEMINI'})`,
          text: resultText,
          ai_provider: providers[providers.length - 1],
          ai_providers: providers,
          message: resultText,
        })
      } else {
        const spell = await correctSpelling(message)
        const confirmation = askConfirmation(spell.correctedMessage)
        const spellingProvider = spell.provider ?? 'GPT'
        return NextResponse.json({
          status: 'spelling_confirmation',
          flow: spellingProvider === 'GEMINI' ? 'Gemini imla düzeltme' : 'GPT imla düzeltme',
          spellingProvider,
          correctedMessage: confirmation.correctedMessage,
          promptText: confirmation.promptText,
          choices: confirmation.choices,
          message: 'Bu mu demek istediniz? Şirket işi / Özel iş / Hayır düzelt seçin.',
        })
      }
    }

    // ─── 2) ÖZEL İŞ: CELF'e gitmez, asistan halleder, kaydetme sonra sorulur ─
    if (confirmType === 'private') {
      if (!userId) {
        return NextResponse.json({ error: 'Özel iş için giriş gerekli.' }, { status: 401 })
      }
      const privateResultText = await callClaude(
        messageToUse,
        'Sen Patronun kişisel asistanısın. Şirket verisine erişmeden, kısa ve Türkçe yanıt ver. CELF\'e gitme.',
        'asistan'
      )
      const resultText = privateResultText ?? 'Yanıt oluşturulamadı.'
      await saveChatMessage({
        user_id: userId,
        message: messageToUse,
        response: resultText,
        ai_providers: ['CLAUDE'],
      })
      return NextResponse.json({
        status: 'private_done',
        flow: 'Patron özel iş (CELF\'e gitmez)',
        text: resultText,
        command_used: messageToUse,
        ask_save: true,
        message: 'İş tamamlandı. Kendi alanınıza kaydetmek ister misiniz?',
      })
    }

    // ─── 3) ŞİRKET İŞİ: CIO → CEO → CELF → Patron Onay (Patron için ilk adım kilidi yok) ─
    if (confirmType === 'company' && !confirmedFirstStep && !isPatronUser) {
      return NextResponse.json(
        {
          status: 'first_step_required',
          message: 'Şirket işi için önce "Bu mu demek istediniz?" adımı tamamlanmalı. İmla düzeltmesi sonrası Şirket İşi seçin.',
          blocked: true,
        },
        { status: 400 }
      )
    }

    // ─── CIO KATMANI: Strateji analizi ve önceliklendirme ───────────────────────
    const cioAnalysis: CIOAnalysisResult = analyzeCommand(messageToUse)
    
    // Strateji değişikliği: Patron dışındakiler için onay gerekir; Patron direkt geçer
    if (!isPatronUser && isStrategyChange(messageToUse)) {
      return NextResponse.json(
        {
          status: 'strategy_change_requires_approval',
          message: 'Strateji değişikliği Patron onayı gerektirir. Bu işlem direkt yapılamaz.',
          cio_analysis: cioAnalysis,
          blocked: true,
        },
        { status: 403 }
      )
    }

    // CIO çakışma uyarıları varsa logla
    if (cioAnalysis.conflictWarnings.length > 0) {
      console.log('[CIO] Çakışma uyarıları:', cioAnalysis.conflictWarnings)
    }

    // Güvenlik robotu: Patron onayı gerektiren işlem — sadece Patron dışı için engel
    if (!isPatronUser && security.requiresApproval) {
      return NextResponse.json(
        {
          status: 'requires_patron_approval',
          message: 'Bu işlem Patron onayı gerektirir. Önce onay alın.',
          blocked: true,
        },
        { status: 403 }
      )
    }
    // Tek bekleyen iş kuralı: Sadece Patron dışı için — Patron komutu hiç engellenmez
    if (!isPatronUser) {
      const pending = await getPendingPatronCommandCount(userId)
      if (pending.error) {
        return NextResponse.json({ error: pending.error }, { status: 500 })
      }
      if (pending.count >= 1) {
        return NextResponse.json(
          {
            status: 'pending_task_exists',
            message: 'Zaten bekleyen bir şirket işiniz var. Önce onu onaylayın veya reddedin.',
            blocked: true,
          },
          { status: 409 }
        )
      }
    }

    // Patron doğrudan talimatı: UI'dan seçim (target_director) veya metinden "CFO'ya şunu yaptır", "v0'a gönder", "cursor'u çağır"
    const directive = parsePatronDirective(messageToUse)
    let forcedDirector = targetDirector ?? getDirectorFromDirective(directive)
    if (!forcedDirector && directive.type === 'v0') forcedDirector = 'CPO' as DirectorKey   // v0 → CPO (UI/tasarım)
    if (!forcedDirector && directive.type === 'cursor') forcedDirector = 'CTO' as DirectorKey // cursor → CTO (kod)
    const messageForCelf = directive.task && (directive.type === 'director' || directive.type === 'remind' || directive.type === 'v0' || directive.type === 'cursor') ? directive.task : messageToUse

    // CIO'dan gelen analizi kullan (CEO'ya iş emri); Patron direktifi varsa öncelikli
    const taskType = cioAnalysis.taskType
    let directorKey = forcedDirector ?? cioAnalysis.primaryDirector
    if (!directorKey) directorKey = routeToDirector(messageForCelf) ?? routeToDirector(messageToUse) ?? ('CCO' as DirectorKey)
    const taskTypeLabel = taskTypeToLabel(taskType)

    const ceoTaskResult = await createCeoTask({
      user_id: userId,
      task_description: messageToUse,
      task_type: taskTypeLabel,
      director_key: directorKey,
      idempotency_key: idempotencyKey,
    })
    const ceoTaskId = ceoTaskResult.id ?? undefined
    
    // CIO analiz logunu kaydet (tablo yoksa sessizce atla)
    if (ceoTaskId) {
      try {
        await logCIOAnalysis(cioAnalysis, ceoTaskId)
      } catch (_) {
        // cio_analysis_logs tablosu yoksa devam et
      }
    }
    
    if (ceoTaskId) {
      await insertCelfLog({
        ceo_task_id: ceoTaskId,
        director_key: directorKey,
        action: 'ceo_classify',
        input_summary: messageToUse.substring(0, 200),
        output_summary: `${taskTypeLabel} → ${directorKey} (CIO: ${cioAnalysis.priority})`,
      })
    }

    // ─── CELF iç denetim: veri erişim, koruma, onay, veto ───────────────────
    const celfAudit = runCelfChecks({
      directorKey,
      taskId: ceoTaskId,
      requiredData: [],
      affectedData: [],
      operation: messageToUse,
    })
    if (ceoTaskId) {
      await logCelfAudit({
        task_id: ceoTaskId,
        director_key: directorKey,
        check_type: 'data_access',
        check_result: celfAudit.errors.length ? 'failed' : 'passed',
        details: { errors: celfAudit.errors, warnings: celfAudit.warnings },
      })
      await logCelfAudit({
        task_id: ceoTaskId,
        director_key: directorKey,
        check_type: celfAudit.vetoBlocked ? 'veto' : 'approval',
        check_result: celfAudit.vetoBlocked ? 'failed' : (celfAudit.warnings.length ? 'warning' : 'passed'),
        details: { vetoBlocked: celfAudit.vetoBlocked, warnings: celfAudit.warnings },
      })
    }
    if (!celfAudit.passed) {
      return NextResponse.json({
        status: 'celf_check_failed',
        flow: 'CEO → CELF denetim',
        errors: celfAudit.errors,
        warnings: celfAudit.warnings,
        veto_blocked: celfAudit.vetoBlocked,
        message: celfAudit.errors[0] ?? 'CELF denetimi geçilemedi.',
      })
    }

    // ─── c) CELF: İlgili direktörlük AI'ını çalıştır. v0 direktifi → v0Only (sadece V0, Cursor atlanır) ─
    const celfResult = await runCelfDirector(directorKey, messageForCelf, {
      v0Only: directive.type === 'v0',
    })
    const errorReason = (celfResult as { text: string | null; errorReason?: string }).errorReason
    const displayText = celfResult.text ?? (errorReason && errorReason.trim()) ?? 'Yanıt oluşturulamadı. API anahtarlarını (.env) kontrol edin.'
    const aiProvider = celfResult.text ? (celfResult as { provider: string }).provider : '—'
    const aiProviders = celfResult.text ? [(celfResult as { provider: string }).provider] : []

    // ─── d) CEO sonucu toplar: task_results'a kaydet ───────────────────────
    await archiveTaskResult({
      taskId: ceoTaskId,
      directorKey,
      aiProviders,
      inputCommand: messageToUse,
      outputResult: displayText,
      status: 'completed',
    })

    // Onay tek kaynak: celf_tasks.status. CELF bitti, Patron onayı bekleniyor → awaiting_approval
    if (ceoTaskId) {
      await updateCeoTask(ceoTaskId, {
        status: 'awaiting_approval',
        result_payload: {
          taskType: taskTypeLabel,
          director_key: directorKey,
          displayText,
          aiProvider,
        },
      })
      await insertCelfLog({
        ceo_task_id: ceoTaskId,
        director_key: directorKey,
        action: 'celf_execute',
        input_summary: messageToUse.substring(0, 200),
        output_summary: displayText.substring(0, 300),
        payload: { providers: aiProviders },
      })
    }

    // ─── e) Patrona sun: Her zaman onay kuyruğuna al ───────────────────────
    const routineRequest = asRoutine || isRoutineRequest(messageToUse)
    const routineSchedule = getRoutineScheduleFromMessage(messageToUse)
    const githubPrepared = celfResult.text && 'githubPreparedCommit' in celfResult ? celfResult.githubPreparedCommit : undefined
    const directorName = CELF_DIRECTORATES[directorKey]?.name ?? directorKey
    const sentByEmail = sessionUser.email ?? (process.env.NEXT_PUBLIC_PATRON_EMAIL ?? 'Patron')
    const assistantSummary =
      `${directorName} (${directorKey}) tarafından hazırlandı. ` +
      (displayText.length > 120 ? displayText.slice(0, 120) + '…' : displayText) +
      (githubPrepared ? ' Onaylarsanız GitHub\'a push edilebilir.' : ' Onaylarsanız uygulamaya geçer.')
    const cmd = await createPatronCommand({
      user_id: userId,
      command: messageToUse,
      ceo_task_id: ceoTaskId,
      output_payload: {
        displayText,
        task_type: taskTypeLabel,
        director_key: directorKey,
        director_name: directorName,
        ai_providers: aiProviders,
        flow: 'CEO → CELF → Patron Onay',
        sent_by_email: sentByEmail,
        assistant_summary: assistantSummary,
        ...(githubPrepared && { github_prepared_commit: githubPrepared }),
        ...(routineRequest && { as_routine: true, routine_schedule: routineSchedule }),
      },
    })
    const commandId = cmd.id

    if (ceoTaskId && commandId) {
      await updateCeoTask(ceoTaskId, { patron_command_id: commandId })
    }

    if (userId) {
      await saveChatMessage({
        user_id: userId,
        message: messageToUse,
        response: isPatronUser ? displayText : 'Patron onayı bekleniyor. Onay kuyruğunu kontrol edin.',
        ai_providers: aiProviders.length ? aiProviders : [],
      })
    }

    // ─── f) Sonuç her zaman onay kuyruğuna (Patron dahil). "Onaylıyorum" deyince veya Onayla butonuna basınca push/deploy yapılır. ─
    return NextResponse.json({
      status: 'awaiting_patron_approval',
      flow: 'CIO → CEO → CELF → Patron Onay',
      text: displayText,
      error_reason: errorReason ?? undefined,
      command_id: commandId,
      ceo_task_id: ceoTaskId,
      director_key: directorKey,
      director_name: CELF_DIRECTORATES[directorKey]?.name ?? directorKey,
      task_type: taskTypeLabel,
      ai_provider: aiProvider,
      routine_request: routineRequest,
      routine_schedule: routineSchedule ?? undefined,
      cio_priority: cioAnalysis.priority,
      cio_estimated_tokens: cioAnalysis.estimatedTokenCost,
      cio_strategy_notes: cioAnalysis.strategyNotes,
      cio_conflict_warnings: cioAnalysis.conflictWarnings,
      message: 'Sonuç Patron onayına sunuldu. Onayla / Reddet / Değiştir ile karar verin.',
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Flow hatası', detail: err }, { status: 500 })
  }
}
