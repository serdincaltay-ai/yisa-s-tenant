'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { startTaskFlow, FLOW_DESCRIPTION } from '@/lib/assistant/task-flow'
import { QUALITY_FLOW } from '@/lib/ai-router'
import { checkPatronLock } from '@/lib/security/patron-lock'
import { isPatron } from '@/lib/auth/roles'
import { PatronApprovalUI } from '@/app/components/PatronApproval'
import { BrainTeamChat } from '@/components/patron/BrainTeamChat'
import {
  Send,
  Bot,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  Rocket,
  Store,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  ClipboardCheck,
  RefreshCw,
  Ban,
  Loader2,
  Copy,
  Terminal,
  Eye,
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
  assignedAI?: string
  taskType?: string
  aiProviders?: string[]
}

type PatronDecision = 'approve' | 'reject' | 'modify'

const STEP_LABELS = ['GPT algılıyor...', 'Claude kontrol ediyor...', 'Patrona sunuluyor...']

export default function DashboardPage() {
  const [user, setUser] = useState<{
    id?: string
    email?: string
    user_metadata?: { role?: string }
  } | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<Record<number, PatronDecision>>({})
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [showFlow, setShowFlow] = useState(false)
  const [useQualityFlow, setUseQualityFlow] = useState(true)
  const [assistantProvider, setAssistantProvider] = useState<'GPT' | 'GEMINI' | 'CLAUDE' | 'CLOUD' | 'V0' | 'CURSOR' | 'SUPABASE' | 'GITHUB' | 'VERCEL' | 'RAILWAY' | 'FAL'>('GEMINI')
  const [assistantChain, setAssistantChain] = useState<string[]>(['GEMINI'])
  const [targetDirector, setTargetDirector] = useState<string>('')
  const [asRoutine, setAsRoutine] = useState(false)
  const [currentStepLabel, setCurrentStepLabel] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState<{
    output: Record<string, unknown>
    aiResponses: { provider: string; response: unknown }[]
    flow: string
    message: string
    command_id?: string
    displayText?: string
    director_key?: string
  } | null>(null)
  const [approvedWaitingRoutineChoice, setApprovedWaitingRoutineChoice] = useState<{
    command_id: string
    message: string
    director_key?: string
  } | null>(null)
  const [routineStep, setRoutineStep] = useState<'choice' | 'schedule' | null>(null)
  const [pendingSpellingConfirmation, setPendingSpellingConfirmation] = useState<{
    correctedMessage: string
    originalMessage: string
  } | null>(null)
  const [pendingPrivateSave, setPendingPrivateSave] = useState<{
    command: string
    result: string
  } | null>(null)
  const [approvalBusy, setApprovalBusy] = useState(false)

  // Genişletilebilir paneller
  const [chatExpanded, setChatExpanded] = useState(true)
  const [startupStatus, setStartupStatus] = useState<{
    summary?: { director: string; total: number; pending: number; completed: number }[]
    total_pending?: number
    next_tasks?: { id: string; name: string; directorKey: string }[]
  } | null>(null)
  const [startupTasksLoading, setStartupTasksLoading] = useState(false)

  const [stats, setStats] = useState({
    franchiseRevenueMonth: 0,
    expensesMonth: 0,
    activeFranchises: 0,
    pendingApprovals: 0,
    newFranchiseApplications: 0,
  })
  const [approvalItems, setApprovalItems] = useState<{
    id: string
    type: string
    title: string
    status: string
    created_at: string
    displayText?: string
    output_payload?: Record<string, unknown>
  }[]>([])
  const [previewItem, setPreviewItem] = useState<{
    id: string
    title: string
    displayText: string
    status: string
  } | null>(null)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalActingId, setApprovalActingId] = useState<string | null>(null)
  const [queueExpanded, setQueueExpanded] = useState(true)
  const [suggestedCommand, setSuggestedCommand] = useState<string | null>(null)
  const [commandCopied, setCommandCopied] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  function extractCommandFromText(text: string): string | null {
    if (!text || typeof text !== 'string') return null
    const codeBlock = text.match(/```(?:bash|sh|powershell|ps1|cmd)?\s*\n?([\s\S]*?)```/)
    if (codeBlock?.[1]) return codeBlock[1].trim()
    const cdMatch = text.match(/(?:cd\s+[^\n]+|npm\s+run\s+[^\n]+)/)
    if (cdMatch) return cdMatch[0].trim()
    const patronMatch = text.match(/Patron\s+şunu\s+çalıştır[:\s]+([^\n]+)/i)
    if (patronMatch) return patronMatch[1].trim()
    return null
  }

  function setCommandFromMessage(text: string) {
    const cmd = extractCommandFromText(text)
    if (cmd) setSuggestedCommand(cmd)
  }

  function toggleAssistantInChain(id: string) {
    setAssistantChain((prev) => {
      const idx = prev.indexOf(id)
      if (idx >= 0) return prev.filter((p) => p !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  async function copySuggestedCommand() {
    if (!suggestedCommand) return
    await navigator.clipboard.writeText(suggestedCommand)
    setCommandCopied(true)
    setTimeout(() => setCommandCopied(false), 2000)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) =>
      setUser(
        u
          ? {
              id: u.id,
              email: u.email ?? undefined,
              user_metadata: u.user_metadata as { role?: string } | undefined,
            }
          : null
      )
    )
  }, [])

  useEffect(() => {
    if (!chatSending || !useQualityFlow) return
    let idx = 0
    setCurrentStepLabel(STEP_LABELS[0])
    const t = setInterval(() => {
      idx = (idx + 1) % STEP_LABELS.length
      setCurrentStepLabel(STEP_LABELS[idx])
    }, 2500)
    return () => clearInterval(t)
  }, [chatSending, useQualityFlow])

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) =>
        setStats({
          franchiseRevenueMonth: Number(d?.franchiseRevenueMonth) ?? Number(d?.revenueMonth) ?? 0,
          expensesMonth: Number(d?.expensesMonth) ?? 0,
          activeFranchises: Number(d?.activeFranchises) ?? 0,
          pendingApprovals: Number(d?.pendingApprovals) ?? 0,
          newFranchiseApplications: Number(d?.newFranchiseApplications) ?? Number(d?.demoRequests) ?? 0,
        })
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/startup')
      .then((r) => r.json())
      .then((d) => setStartupStatus(d))
      .catch(() => {})
  }, [])

  const fetchApprovalQueue = () => {
    setApprovalLoading(true)
    fetch('/api/approvals')
      .then((r) => r.json())
      .then((d) => setApprovalItems(Array.isArray(d?.items) ? d.items : []))
      .catch(() => setApprovalItems([]))
      .finally(() => setApprovalLoading(false))
  }
  useEffect(() => {
    fetchApprovalQueue()
    const t = setInterval(fetchApprovalQueue, 30000)
    return () => clearInterval(t)
  }, [])

  const handleSendAsCommand = async () => {
    const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === 'user')
    const msg = lastUserMsg?.text?.trim() ?? chatInput.trim()
    if (!msg || chatSending) return
    setLockError(null)
    const lockCheck = checkPatronLock(msg)
    if (!lockCheck.allowed) {
      setLockError(lockCheck.reason ?? 'Bu işlem AI için yasaktır.')
      return
    }
    setChatSending(true)
    setCurrentStepLabel('CEO\'ya gönderiliyor...')
    try {
      const res = await fetch('/api/chat/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          send_as_command: true,
          confirm_type: 'company',
          confirmed_first_step: true,
          as_routine: asRoutine,
          target_director: targetDirector || undefined,
          user: user ?? undefined,
          user_id: user?.id ?? undefined,
          assistant_provider: assistantChain[0] || assistantProvider,
          assistant_chain: assistantChain.length > 0 ? assistantChain : undefined,
          idempotency_key: crypto.randomUUID(),
        }),
      })
      const data = await res.json()
      setCurrentStepLabel(null)
      if (data.error) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: `Hata: ${data.error}`, aiProviders: [] }])
      } else if (data.status === 'awaiting_patron_approval') {
        const displayTextRaw = typeof data.text === 'string' ? data.text : undefined
        setPendingApproval({
          output: data.output ?? {},
          aiResponses: data.aiResponses ?? [],
          flow: data.flow ?? QUALITY_FLOW.name,
          message: msg,
          command_id: data.command_id,
          displayText: displayTextRaw,
          director_key: data.director_key,
        })
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: displayTextRaw ?? 'Komut CEO\'ya gönderildi. Havuzda onay bekliyor.', aiProviders: data.ai_providers ?? [] },
        ])
        fetchApprovalQueue()
      } else if (data.status === 'pending_task_exists') {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: data.message ?? 'Zaten bekleyen bir iş var.', aiProviders: [] }])
      } else if (data.status === 'celf_check_failed') {
        const errs = Array.isArray((data as { errors?: string[] }).errors) ? (data as { errors: string[] }).errors : []
        setChatMessages((prev) => [...prev, { role: 'assistant', text: errs.length ? `⚠️ ${errs.join(' ')}` : (data.message ?? 'CELF denetimi geçilemedi.'), aiProviders: [] }])
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: data.message ?? data.text ?? 'İşlem tamamlandı.', aiProviders: [] }])
      }
    } catch {
      setCurrentStepLabel(null)
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Bağlantı hatası.', aiProviders: [] }])
    } finally {
      setChatSending(false)
    }
  }

  const handleSendChat = async () => {
    const msg = chatInput.trim()
    if (!msg || chatSending) return

    setLockError(null)
    setPendingApproval(null)
    setPendingSpellingConfirmation(null)
    setPendingPrivateSave(null)

    const lockCheck = checkPatronLock(msg)
    if (!lockCheck.allowed) {
      setLockError(lockCheck.reason ?? 'Bu işlem AI için yasaktır.')
      return
    }

    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }])
    setChatSending(true)

    if (useQualityFlow) {
      try {
        const res = await fetch('/api/chat/flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          user: user ?? undefined,
          user_id: user?.id ?? undefined,
          assistant_provider: assistantChain[0] || assistantProvider,
          assistant_chain: assistantChain.length > 0 ? assistantChain : undefined,
          as_routine: asRoutine,
          target_director: targetDirector || undefined,
        }),
        })
        const data = await res.json()
        setCurrentStepLabel(null)

        if (data.error) {
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `Hata: ${data.error}`, aiProviders: [] },
          ])
        } else if (data.status === 'spelling_confirmation') {
          const corrected = data.correctedMessage ?? msg
          const spellingProvider = data.spellingProvider === 'GEMINI' ? 'GEMINI' : 'GPT'
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `📝 Bu mu demek istediniz?\n\n"${corrected}"`, aiProviders: [spellingProvider] },
          ])
          setPendingSpellingConfirmation({ correctedMessage: corrected, originalMessage: msg })
        } else if (data.status === 'private_done') {
          const text = data.text ?? 'Yanıt oluşturulamadı.'
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text, aiProviders: ['CLAUDE'] },
          ])
          if (data.ask_save && data.command_used) {
            setPendingPrivateSave({ command: data.command_used, result: text })
          }
        } else if (data.status === 'private_saved') {
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: '✅ Kendi alanınıza kaydedildi.', aiProviders: [] },
          ])
          setPendingPrivateSave(null)
        } else if (data.status === 'patron_approval_done') {
          const text = typeof data.text === 'string' ? data.text : 'Patron onayı uygulandı.'
          setPendingApproval(null)
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `✅ ${text}`, aiProviders: [] },
          ])
          fetchApprovalQueue()
        } else if (data.status === 'patron_conversation_done') {
          const text = typeof data.text === 'string' ? data.text : 'Yanıt oluşturulamadı.'
          const prov = data.ai_provider ?? 'CLAUDE'
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text, aiProviders: [prov] },
          ])
        } else if (data.status === 'patron_direct_done') {
          const text = typeof data.text === 'string' ? data.text : 'İşlem tamamlandı.'
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text, aiProviders: data.ai_providers ?? [], taskType: data.output?.taskType },
          ])
        } else if (data.status === 'awaiting_patron_approval') {
          const displayTextRaw = typeof data.text === 'string' ? data.text : undefined
          const errorReason = typeof (data as { error_reason?: string }).error_reason === 'string' ? (data as { error_reason: string }).error_reason : undefined
          setPendingApproval({
            output: data.output ?? {},
            aiResponses: data.aiResponses ?? [],
            flow: data.flow ?? QUALITY_FLOW.name,
            message: msg,
            command_id: data.command_id,
            displayText: displayTextRaw,
            director_key: data.director_key,
          })
          const messageToShow = displayTextRaw || errorReason || 'Patron onayı bekleniyor. (Onay kuyruğuna bakın.)'
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: messageToShow, aiProviders: data.ai_providers ?? [], taskType: data.output?.taskType },
          ])
          fetchApprovalQueue()
        } else if (data.status === 'pending_task_exists') {
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: data.message ?? 'Zaten bekleyen bir iş var. Önce onay kuyruğundan onu onaylayın veya reddedin.', aiProviders: [] },
          ])
        } else if (data.status === 'celf_check_failed') {
          const errs = Array.isArray((data as { errors?: string[] }).errors) ? (data as { errors: string[] }).errors : []
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: errs.length ? `⚠️ ${errs.join(' ')}` : (data.message ?? 'CELF denetimi geçilemedi.'), aiProviders: [] },
          ])
        } else if (data.status === 'strategy_change_requires_approval' || data.status === 'requires_patron_approval') {
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: data.message ?? 'Bu işlem Patron onayı gerektirir.', aiProviders: [] },
          ])
        } else {
          const fallback = data.message ?? data.text ?? ((data as { detail?: string }).detail ? `Hata: ${(data as { detail: string }).detail}` : null)
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: fallback ?? 'Yanıt alınamadı. API anahtarlarını (.env) kontrol edin.', aiProviders: data.ai_providers ?? [] },
          ])
        }
      } catch {
        setCurrentStepLabel(null)
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Bağlantı hatası. Tekrar dene.', aiProviders: [] },
        ])
      } finally {
        setChatSending(false)
      }
      return
    }

    const flow = startTaskFlow(msg)
    const taskType = flow.routerResult?.taskType ?? 'unknown'
    const assignedAI = flow.routerResult?.assignedAI ?? 'GPT'

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          taskType,
          assignedAI,
          user_id: user?.id ?? undefined,
        }),
      })
      const data = await res.json()
      const text = data.error ? `Hata: ${data.error}` : (data.text ?? 'Yanıt alınamadı.')
      const ai = data.assignedAI ?? assignedAI
      const tt = data.taskType ?? taskType
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text, assignedAI: ai, taskType: tt },
      ])
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Bağlantı hatası. Tekrar dene.', assignedAI: 'CLAUDE', taskType: 'unknown' },
      ])
    } finally {
      setChatSending(false)
    }
  }

  const handleConfirmationChoice = async (confirmType: 'company' | 'private', correctedMessage: string) => {
    if (chatSending || !correctedMessage.trim()) return
    setPendingSpellingConfirmation(null)
    setChatSending(true)
    setCurrentStepLabel(confirmType === 'company' ? 'Şirket işi işleniyor...' : 'Özel iş işleniyor...')
    try {
      const res = await fetch('/api/chat/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: correctedMessage,
          confirm_type: confirmType,
          corrected_message: correctedMessage,
          user: user ?? undefined,
          user_id: user?.id ?? undefined,
          assistant_provider: assistantChain[0] || assistantProvider,
          assistant_chain: assistantChain.length > 0 ? assistantChain : undefined,
          as_routine: asRoutine,
          ...(confirmType === 'company' && {
            confirmed_first_step: true,
            idempotency_key: crypto.randomUUID(),
          }),
          target_director: targetDirector || undefined,
        }),
      })
      const data = await res.json()
      setCurrentStepLabel(null)
      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `Hata: ${data.error}`, aiProviders: [] },
        ])
      } else if (data.status === 'first_step_required') {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.message ?? 'Önce imla adımı tamamlanmalı.', aiProviders: [] },
        ])
      } else if (data.status === 'spelling_confirmation') {
        const corrected = data.correctedMessage ?? correctedMessage
        const spellingProvider = data.spellingProvider === 'GEMINI' ? 'GEMINI' : 'GPT'
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `📝 Bu mu demek istediniz?\n\n"${corrected}"`, aiProviders: [spellingProvider] },
        ])
        setPendingSpellingConfirmation({ correctedMessage: corrected, originalMessage: correctedMessage })
      } else if (data.status === 'private_done') {
        const text = data.text ?? 'Yanıt oluşturulamadı.'
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text, aiProviders: ['CLAUDE'] },
        ])
        if (data.ask_save && data.command_used) {
          setPendingPrivateSave({ command: data.command_used, result: text })
        }
      } else if (data.status === 'private_saved') {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: '✅ Kendi alanınıza kaydedildi.', aiProviders: [] },
        ])
        setPendingPrivateSave(null)
      } else if (data.status === 'patron_direct_done') {
        const text = typeof data.text === 'string' ? data.text : 'İşlem tamamlandı.'
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text, aiProviders: data.ai_providers ?? [], taskType: data.output?.taskType },
        ])
      } else if (data.status === 'awaiting_patron_approval') {
        const displayTextRaw = typeof data.text === 'string' ? data.text : undefined
        const errorReason = typeof (data as { error_reason?: string }).error_reason === 'string' ? (data as { error_reason: string }).error_reason : undefined
        setPendingApproval({
          output: data.output ?? {},
          aiResponses: data.aiResponses ?? [],
          flow: data.flow ?? QUALITY_FLOW.name,
          message: correctedMessage,
          command_id: data.command_id,
          displayText: displayTextRaw ?? (errorReason ? undefined : 'Rapor/işlem sonucu bekleniyor'),
          director_key: data.director_key,
        })
        const messageToShow = displayTextRaw || errorReason || 'Patron onayı bekleniyor. (Rapor içeriği için Onay kuyruğuna bakın.)'
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: messageToShow, aiProviders: data.ai_providers ?? [], taskType: data.output?.taskType },
        ])
      } else if (data.status === 'pending_task_exists') {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.message ?? 'Zaten bekleyen bir iş var. Önce onay kuyruğundan onu onaylayın veya reddedin.', aiProviders: [] },
        ])
      } else if (data.status === 'celf_check_failed') {
        const errs = Array.isArray((data as { errors?: string[] }).errors) ? (data as { errors: string[] }).errors : []
        const msg = errs.length ? errs.join(' ') : (data.message ?? 'CELF denetimi geçilemedi.')
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `⚠️ ${msg}`, aiProviders: [] },
        ])
      } else if (data.status === 'strategy_change_requires_approval' || data.status === 'requires_patron_approval') {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.message ?? 'Bu işlem Patron onayı gerektirir.', aiProviders: [] },
        ])
      } else {
        const fallback = data.message ?? data.text ?? ((data as { detail?: string }).detail ? `Hata: ${(data as { detail: string }).detail}` : null)
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: fallback ?? 'Yanıt alınamadı. API anahtarlarını (.env) kontrol edin.', aiProviders: data.ai_providers ?? [] },
        ])
      }
    } catch {
      setCurrentStepLabel(null)
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Bağlantı hatası. Tekrar dene.', aiProviders: [] },
      ])
    } finally {
      setChatSending(false)
    }
  }

  const handlePrivateSave = async (save: boolean) => {
    if (!pendingPrivateSave || approvalBusy) return
    setPendingPrivateSave(null)
    if (!save) return
    setApprovalBusy(true)
    try {
      const res = await fetch('/api/chat/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          save_private: true,
          private_command: pendingPrivateSave.command,
          private_result: pendingPrivateSave.result,
          user_id: user?.id ?? undefined,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `Kaydetme hatası: ${data.error}`, aiProviders: [] },
        ])
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: '✅ Kendi alanınıza kaydedildi.', aiProviders: [] },
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Kaydetme sırasında bağlantı hatası.', aiProviders: [] },
      ])
    } finally {
      setApprovalBusy(false)
    }
  }

  const handlePatronDecision = (index: number, decision: PatronDecision) => {
    setDecisions((prev) => ({ ...prev, [index]: decision }))
    if (decision === 'modify') {
      const m = chatMessages[index]
      setEditText(m?.text ?? '')
      setEditingIndex(index)
    } else {
      setEditingIndex(null)
    }
  }

  const handleSaveEdit = () => {
    if (editingIndex == null) return
    setChatMessages((prev) => {
      const next = [...prev]
      const m = next[editingIndex]
      if (m && m.role === 'assistant') {
        next[editingIndex] = { ...m, text: editText }
      }
      return next
    })
    setDecisions((prev) => ({ ...prev, [editingIndex]: 'modify' }))
    setEditingIndex(null)
  }

  const handleQueueDecision = async (commandId: string, decision: 'approve' | 'reject' | 'cancel') => {
    setApprovalActingId(commandId + '_' + decision)
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command_id: commandId, decision, user_id: user?.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: `Hata: ${data?.error ?? 'İşlem başarısız'}`, aiProviders: [] }])
        return
      }
      if (decision === 'approve' && data?.result) {
        const deployNote = data?.auto_deployed ? '\n\n🚀 Deploy edildi (GitHub push).' : ''
        setChatMessages((prev) => [...prev, { role: 'assistant', text: `✅ Onaylandı.${deployNote}\n\n${data.result}`, aiProviders: [] }])
      } else if (decision === 'reject' || decision === 'cancel') {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: decision === 'cancel' ? 'İptal edildi.' : 'Reddedildi.', aiProviders: [] }])
      }
      fetchApprovalQueue()
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'İstek gönderilemedi.', aiProviders: [] }])
    } finally {
      setApprovalActingId(null)
    }
  }

  const handleCancelAllPending = async () => {
    const pending = approvalItems.filter((i) => i.status === 'pending')
    if (pending.length === 0) return
    if (!confirm(`${pending.length} bekleyen işin tamamını iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return
    setApprovalActingId('cancel_all')
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_all: true, cancel_pending_only: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: `Hata: ${data?.error ?? 'Tümünü iptal başarısız'}`, aiProviders: [] }])
        return
      }
      setChatMessages((prev) => [...prev, { role: 'assistant', text: `✅ ${pending.length} bekleyen iş iptal edildi.`, aiProviders: [] }])
      fetchApprovalQueue()
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'İstek gönderilemedi.', aiProviders: [] }])
    } finally {
      setApprovalActingId(null)
    }
  }

  const runStartupTasks = async (action: 'run_all' | 'run_director') => {
    if (startupTasksLoading) return
    setStartupTasksLoading(true)
    try {
      const res = await fetch('/api/startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'run_all' ? 'run_all' : 'run_director',
          director: action === 'run_director' ? 'CSPO' : undefined,
          user_id: user?.id,
          user,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `Başlangıç hatası: ${data.error}`, aiProviders: [] },
        ])
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `✅ Başlangıç görevleri tetiklendi. ${action === 'run_all' ? 'Tüm direktörlükler' : 'CSPO'} işe başlıyor. Onay kuyruğuna bakın (sağda).`,
            aiProviders: [],
          },
        ])
        fetch('/api/startup').then((r) => r.json()).then(setStartupStatus).catch(() => {})
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Başlangıç tetiklenirken hata.', aiProviders: [] },
      ])
    } finally {
      setStartupTasksLoading(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    const lastAssistant = [...chatMessages].reverse().find((m) => m.role === 'assistant')
    if (lastAssistant?.text) setCommandFromMessage(lastAssistant.text)
  }, [chatMessages])

  return (
    <div className="min-h-screen text-white bg-gray-950">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header: Logo, Saat (tıklanınca konuş/görev), Avatar */}
        <header className="flex items-center justify-between py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
              <Image src="/logo.png" alt="YİSA-S" fill className="object-contain" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white">YİSA-S Patron Komuta Merkezi</span>
              <p className="text-xs text-gray-400">Sistem hazır. Komut gönderin veya onay kuyruğunu yönetin.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setChatExpanded((e) => !e)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 transition-colors"
              title="Tıklayınca konuş veya görev ver"
            >
              <Clock size={18} />
              <span className="font-mono tabular-nums">{new Date().toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-xs">Konuş / Görev</span>
            </button>
            <Avatar className="h-8 w-8 border border-gray-700">
              <AvatarFallback className="bg-gray-800 text-gray-300 text-xs font-medium">
                {(user?.email ?? 'P').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* KPI kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-4">
            <p className="text-xs text-pink-400/80 mb-1">GELİR</p>
            <p className="text-xl font-mono font-semibold text-white">₺{stats.franchiseRevenueMonth.toLocaleString('tr-TR')}</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-xs text-blue-400/80 mb-1">GİDER</p>
            <p className="text-xl font-mono font-semibold text-white">₺{stats.expensesMonth.toLocaleString('tr-TR')}</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs text-amber-400/80 mb-1">ONAY</p>
            <p className="text-xl font-mono font-semibold text-white">{stats.pendingApprovals}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs text-emerald-400/80 mb-1">BAŞVURU</p>
            <p className="text-xl font-mono font-semibold text-white">{stats.newFranchiseApplications}</p>
          </div>
        </div>

        {/* Robot kartları: CELF, YİSA, Güvenlik, Veri + yisa-s.com */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <a href="/dashboard/celf" className="rounded-xl border-2 border-cyan-500/40 bg-cyan-500/10 p-4 hover:border-cyan-500/60 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/30 flex items-center justify-center">
              <Bot className="text-cyan-400" size={20} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">CELF Motor</p>
              <p className="text-[10px] text-cyan-400/80 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Çalışıyor</p>
            </div>
          </a>
          <a href="/dashboard/directors" className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 hover:border-amber-500/60 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center">
              <Bot className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">YİSA Motor</p>
              <p className="text-[10px] text-amber-400/80 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Çalışıyor</p>
            </div>
          </a>
          <a href="/dashboard/reports" className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 hover:border-emerald-500/60 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center">
              <Bot className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Güvenlik Robotu</p>
              <p className="text-[10px] text-emerald-400/80 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif</p>
            </div>
          </a>
          <a href="/dashboard/reports" className="rounded-xl border-2 border-violet-500/40 bg-violet-500/10 p-4 hover:border-violet-500/60 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/30 flex items-center justify-center">
              <Bot className="text-violet-400" size={20} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Veri Robotu</p>
              <p className="text-[10px] text-violet-400/80 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif</p>
            </div>
          </a>
          <a href="https://yisa-s.com" target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-slate-500/40 bg-slate-500/10 p-4 hover:border-slate-500/60 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500/30 flex items-center justify-center">
              <Store className="text-slate-400" size={20} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">yisa-s.com</p>
              <p className="text-[10px] text-slate-400">Tanıtım</p>
            </div>
          </a>
        </div>

        {/* Geniş Ekran + Şablonlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/dashboard/genis-ekran" className="flex items-center gap-4 p-4 rounded-xl border-2 border-cyan-500/40 bg-cyan-500/10 hover:border-cyan-500/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Maximize2 size={24} className="text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Geniş Ekran</p>
              <p className="text-xs text-cyan-400/80">Özet, siteler, çalıştırılacaklar</p>
            </div>
          </a>
          <a href="/dashboard/sablonlar" className="flex items-center gap-4 p-4 rounded-xl border-2 border-pink-500/40 bg-pink-500/10 hover:border-pink-500/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <LayoutTemplate size={24} className="text-pink-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Şablonlar</p>
              <p className="text-xs text-pink-400/80">Büyük ekranda önizleme, v0 Çıkart</p>
            </div>
          </a>
        </div>

        {/* Başlangıç Görevleri */}
        <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4">
          <h3 className="font-semibold text-white mb-2">Başlangıç Görevleri</h3>
          <p className="text-sm text-amber-400/80 mb-3">
            {startupStatus?.total_pending ?? 0} görev bekliyor. Direktörlükler ilk görevlerini yapacak.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => runStartupTasks('run_all')}
              disabled={startupTasksLoading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {startupTasksLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              <span className="ml-2">Tüm Robotları Başlat</span>
            </Button>
            <a href="/dashboard/ozel-araclar" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
              <Play size={16} />
              Oyna — Deploy ({stats.pendingApprovals} onay)
            </a>
          </div>
        </div>

      {/* Patron Havuzu (sol, büyük) + Chat (sağ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Sol: PATRON HAVUZU — Her şey buraya gelir */}
        <div className="lg:col-span-7">
          <Card className="bg-gray-900 border-2 border-amber-500/40 overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <ClipboardCheck className="text-amber-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Patron Havuzu</h2>
                  <p className="text-xs text-amber-400/90">CEO Havuzu — Her şey buraya gelir. Onayla, oyna.</p>
                </div>
              </div>
              <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 text-lg px-3 py-1">
                {approvalItems.filter((i) => i.status === 'pending').length} bekliyor
              </Badge>
            </div>
            <CardContent className="p-4">
              {approvalLoading ? (
                <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-amber-400" /></div>
              ) : approvalItems.filter((i) => i.status === 'pending').length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardCheck size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Bekleyen iş yok</p>
                  <p className="text-sm mt-1">Görev verdiğinizde buraya gelecek. Onayla, oyna.</p>
                  <a href="/dashboard/onay-kuyrugu" className="inline-block mt-4 text-amber-400 hover:text-amber-300 text-sm">Tüm havuz →</a>
                </div>
              ) : (
                <div className="space-y-3 max-h-[340px] overflow-y-auto">
                  {approvalItems.filter((i) => i.status === 'pending').map((item) => {
                    const content = item.displayText ?? (item.output_payload as { displayText?: string })?.displayText ?? ''
                    const snippet = content ? content.slice(0, 60).replace(/\n/g, ' ') + (content.length > 60 ? '…' : '') : ''
                    return (
                      <div key={item.id} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-amber-500/40 transition-colors">
                        <p className="font-medium text-white truncate">{item.title}</p>
                        {snippet && <p className="text-xs text-gray-400 mt-1 line-clamp-1">« {snippet} »</p>}
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => content && setPreviewItem({ id: item.id, title: item.title, displayText: content, status: item.status })}
                            className="px-3 py-1.5 rounded-lg text-xs border border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center gap-1"
                            title="Önizleme"
                          >
                            <Eye size={12} />
                            Gör
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQueueDecision(item.id, 'approve')}
                            disabled={!!approvalActingId}
                            className="px-4 py-1.5 rounded-lg text-xs bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/40 disabled:opacity-50"
                          >
                            {approvalActingId === item.id + '_approve' ? <Loader2 size={12} className="animate-spin inline" /> : <Check size={12} className="inline mr-1" />} Onayla
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQueueDecision(item.id, 'reject')}
                            disabled={!!approvalActingId}
                            className="px-3 py-1.5 rounded-lg text-xs bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                          >
                            <X size={12} className="inline" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-4 flex gap-4">
                <button type="button" onClick={fetchApprovalQueue} disabled={approvalLoading} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  <RefreshCw size={12} className={approvalLoading ? 'animate-spin' : ''} /> Yenile
                </button>
                <a href="/dashboard/onay-kuyrugu" className="text-xs text-amber-400 hover:text-amber-300">Tüm havuz →</a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ: Chat — Konuş / Görev ver */}
        <div className="lg:col-span-5">
      <Card className="bg-gray-900 border-gray-800 overflow-hidden flex flex-col">
        <button
          type="button"
          onClick={() => setChatExpanded(!chatExpanded)}
          className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors w-full text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Bot className="text-cyan-400" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white">Konuş / Görev Ver</h2>
            <p className="text-xs text-gray-400">Yaz → CEO&apos;ya Gönder → Patron Havuzuna gelir</p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            CANLI
          </Badge>
          {chatExpanded ? <Minimize2 size={18} className="text-muted-foreground" /> : <Maximize2 size={18} className="text-muted-foreground" />}
        </button>
        {chatExpanded && (
          <>
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <p className="text-xs text-muted-foreground mb-2">Hedef direktör (boş = otomatik)</p>
              <select
                value={targetDirector}
                onChange={(e) => setTargetDirector(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="">Otomatik</option>
                <option value="CFO">CFO</option>
                <option value="CTO">CTO</option>
                <option value="CPO">CPO (v0)</option>
                <option value="CSPO">CSPO</option>
                <option value="COO">COO</option>
              </select>
            </div>
            <div className="flex-1 min-h-[200px] max-h-[340px] overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-1">Merhaba, ben YİSA-S asistanıyım.</p>
                  <p className="text-sm mb-2">Görev ver veya soru sor.</p>
                  <p className="text-xs text-muted-foreground/80">
                    Örn: <span className="text-amber-400/90">&quot;v0&apos;a tasarım yaptır&quot;</span>, <span className="text-cyan-400/90">&quot;CFO&apos;ya rapor hazırla&quot;</span>, <span className="text-emerald-400/90">&quot;Onaylıyorum&quot;</span> — Onay kuyruğu sağda.
                  </p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 ${
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'
                    } ${decisions[i] === 'approve' ? 'ring-2 ring-ring' : ''} ${decisions[i] === 'reject' ? 'opacity-60' : ''}`}
                  >
                    {m.role === 'assistant' && (m.aiProviders?.length || m.assignedAI) && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(m.aiProviders ?? [m.assignedAI]).filter(Boolean).map((ai) => (
                          <span key={ai} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                            {ai}
                          </span>
                        ))}
                      </div>
                    )}
                    {editingIndex === i && m.role === 'assistant' ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground"
                        />
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={handleSaveEdit}>
                            Kaydet
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditingIndex(null)}>
                            İptal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                    )}
                    {m.role === 'assistant' && editingIndex !== i && (
                      <div className="flex gap-2 mt-3 pt-2 border-t border-border">
                        <button
                          type="button"
                          onClick={() => handlePatronDecision(i, 'approve')}
                          className={`px-2 py-1 rounded-md text-xs ${decisions[i] === 'approve' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                        >
                          <Check size={12} className="inline mr-1" /> Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePatronDecision(i, 'reject')}
                          className={`px-2 py-1 rounded-md text-xs ${decisions[i] === 'reject' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                        >
                          <X size={12} className="inline mr-1" /> Reddet
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePatronDecision(i, 'modify')}
                          className={`px-2 py-1 rounded-md text-xs ${decisions[i] === 'modify' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                        >
                          <Edit3 size={12} className="inline mr-1" /> Değiştir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatSending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-3 text-muted-foreground text-sm border border-border">
                    {currentStepLabel ?? 'Yanıt yazılıyor…'}
                  </div>
                </div>
              )}
              {pendingSpellingConfirmation && (
                <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Bu mu demek istediniz?</h3>
                  <p className="text-sm text-muted-foreground">&quot;{pendingSpellingConfirmation.correctedMessage}&quot;</p>
                  <p className="text-xs text-muted-foreground">Devam etmek için aşağıdaki butonlardan birine tıklayın</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleConfirmationChoice('company', pendingSpellingConfirmation!.correctedMessage)}
                      disabled={chatSending}
                    >
                      Evet, Şirket İşi
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleConfirmationChoice('private', pendingSpellingConfirmation!.correctedMessage)}
                      disabled={chatSending}
                    >
                      Evet, Özel İş
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChatInput(pendingSpellingConfirmation!.correctedMessage)
                        setPendingSpellingConfirmation(null)
                      }}
                    >
                      Hayır, Düzelt
                    </Button>
                  </div>
                </div>
              )}
              {approvedWaitingRoutineChoice && (
                <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Bu görevi nasıl kaydetmek istersiniz?</h3>
                  {routineStep === null || routineStep === 'choice' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={() => setRoutineStep('schedule')}>
                        Rutin Görev
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setApprovedWaitingRoutineChoice(null)
                          setRoutineStep(null)
                          setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Bir seferlik olarak kaydedildi.', aiProviders: [] }])
                        }}
                      >
                        Bir Seferlik
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((schedule) => (
                        <Button
                          key={schedule}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setApprovalBusy(true)
                            try {
                              const res = await fetch('/api/approvals', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  command_id: approvedWaitingRoutineChoice.command_id,
                                  save_routine: true,
                                  schedule,
                                  user_id: user?.id,
                                }),
                              })
                              const data = await res.json()
                              setApprovedWaitingRoutineChoice(null)
                              setRoutineStep(null)
                              setChatMessages((prev) => [
                                ...prev,
                                {
                                  role: 'assistant',
                                  text: data.message ?? `Rutin kaydedildi (${schedule === 'daily' ? 'Günlük' : schedule === 'weekly' ? 'Haftalık' : 'Aylık'}).`,
                                  aiProviders: [],
                                },
                              ])
                            } finally {
                              setApprovalBusy(false)
                            }
                          }}
                          disabled={approvalBusy}
                        >
                          {schedule === 'daily' ? 'Günlük' : schedule === 'weekly' ? 'Haftalık' : 'Aylık'}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {pendingPrivateSave && (
                <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Kendi alanınıza kaydetmek ister misiniz?</h3>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => handlePrivateSave(true)} disabled={approvalBusy}>
                      Evet, Kaydet
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => { setPendingPrivateSave(null); setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Kaydetmediniz.', aiProviders: [] }]) }}>
                      Hayır
                    </Button>
                  </div>
                </div>
              )}
              {pendingApproval && (
                approvalBusy ? (
                  <div className="rounded-xl border border-border bg-muted/50 p-4 text-center text-muted-foreground">
                    <p className="font-medium">Çalışıyor...</p>
                    <p className="text-sm mt-1">Patron kararı uygulanıyor</p>
                  </div>
                ) : (
                <PatronApprovalUI
                  pendingTask={pendingApproval}
                  onApprove={async () => {
                    setApprovalBusy(true)
                    const cmdId = pendingApproval.command_id
                    try {
                      const res = await fetch('/api/approvals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command_id: cmdId, decision: 'approve', user_id: user?.id }),
                      })
                      const data = await res.json()
                      const resultText = data.result ?? pendingApproval.displayText ?? 'İşlem tamamlandı.'
                      const deployNote = data?.auto_deployed ? '\n\n🚀 Deploy edildi.' : ''
                      setChatMessages((prev) => [
                        ...prev,
                        { role: 'assistant', text: `✅ Onaylandı.${deployNote}\n\n${resultText}`, aiProviders: pendingApproval.aiResponses.map((a) => a.provider), taskType: pendingApproval.output?.taskType as string },
                      ])
                      setPendingApproval(null)
                      fetchApprovalQueue()
                      if (cmdId) setApprovedWaitingRoutineChoice({ command_id: cmdId, message: pendingApproval.message, director_key: pendingApproval.director_key })
                    } catch {
                      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Onay hatası.', aiProviders: [] }])
                    } finally {
                      setApprovalBusy(false)
                    }
                  }}
                  onSuggest={async () => {
                    if (!pendingApproval?.command_id) return
                    setApprovalBusy(true)
                    try {
                      const res = await fetch('/api/approvals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command_id: pendingApproval.command_id, decision: 'suggest', user_id: user?.id }),
                      })
                      const data = await res.json()
                      setChatMessages((prev) => [...prev, { role: 'assistant', text: `💡 Öneriler:\n\n${data.suggestions ?? 'Alınamadı.'}`, aiProviders: ['GPT'] }])
                    } finally {
                      setApprovalBusy(false)
                    }
                  }}
                  onReject={async () => {
                    setApprovalBusy(true)
                    try {
                      await fetch('/api/approvals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command_id: pendingApproval.command_id, decision: 'reject', user_id: user?.id }),
                      })
                      setChatMessages((prev) => [...prev, { role: 'assistant', text: '❌ İptal edildi.', aiProviders: [] }])
                    } finally {
                      setPendingApproval(null)
                      setApprovalBusy(false)
                    }
                  }}
                  onModify={async (modifyText) => {
                    setApprovalBusy(true)
                    try {
                      await fetch('/api/approvals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command_id: pendingApproval.command_id, decision: 'modify', modify_text: modifyText, user_id: user?.id }),
                      })
                      setChatInput(modifyText)
                      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Değişiklik kaydedildi. Yeni talimatı yazıp Gönder ile tekrar işleyin.', aiProviders: [] }])
                    } finally {
                      setPendingApproval(null)
                      setApprovalBusy(false)
                    }
                  }}
                />
                )
              )}
              <div ref={chatEndRef} />
            </div>
            {suggestedCommand && (
              <div className="mx-4 mb-2 p-4 rounded-xl bg-muted/50 border border-border relative">
                <button
                  type="button"
                  onClick={() => setSuggestedCommand(null)}
                  className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Kapat"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Terminal size={18} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Patron — PowerShell&apos;te çalıştırın</span>
                </div>
                <pre className="bg-background rounded-md p-3 text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap border border-border">{suggestedCommand}</pre>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">Asistan önerisi — kopyalayıp terminalde yapıştırın</span>
                  <Button type="button" variant="outline" size="sm" onClick={copySuggestedCommand}>
                    <Copy size={14} className="mr-1" />
                    {commandCopied ? 'Kopyalandı!' : 'Kopyala'}
                  </Button>
                </div>
              </div>
            )}
            {lockError && (
              <div className="mx-4 mb-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm flex justify-between">
                <span>{lockError}</span>
                <button type="button" onClick={() => setLockError(null)}>×</button>
              </div>
            )}
            <CardFooter className="border-t border-border p-4 flex flex-col gap-3">
              <BrainTeamChat
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSent={() => {
                  setChatMessages((prev) => [
                    ...prev,
                    { role: 'assistant', text: '✅ Patron Havuzu\'na eklendi. Soldaki listeden görüntüleyebilirsiniz.', aiProviders: [] },
                  ])
                }}
                targetDirector={targetDirector}
                setTargetDirector={setTargetDirector}
                asRoutine={asRoutine}
                setAsRoutine={setAsRoutine}
                fetchApprovalQueue={fetchApprovalQueue}
              />
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">CEO zinciri:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendAsCommand}
                  disabled={chatSending || (!chatInput.trim() && !chatMessages.some((m) => m.role === 'user'))}
                  title="İmla → Şirket/Özel → CEO → CELF → Onay kuyruğu"
                >
                  CEO&apos;ya Gönder
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSendChat}
                  disabled={chatSending || !chatInput.trim()}
                  title="Konuşma (imla düzeltme dahil)"
                >
                  Gönder (Konuş)
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
        </div>
      </div>
      </div>

      {/* Önizleme modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-card rounded-xl border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground truncate">{previewItem.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-md hover:bg-accent text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-muted/30 text-foreground">
              {/<\/?[a-z][\s\S]*>/i.test(previewItem.displayText) ? (
                <div
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewItem.displayText }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">{previewItem.displayText}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
