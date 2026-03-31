'use client'

/**
 * Beyin Takımı Chat — AI seçimi, Gönder, ATA, HERKESE SOR
 * CEO/CELF zincirini atla, direkt seçilen AI'a gönder
 */

import { useState, useRef } from 'react'
import { Send, Paperclip, Eye, Loader2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AIProvider = 'GPT' | 'GEMINI' | 'CLAUDE' | 'CLOUD' | 'V0' | 'CURSOR' | 'FAL'

const AI_BUTTONS: { id: AIProvider; label: string; color: string }[] = [
  { id: 'CLAUDE', label: 'Claude', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
  { id: 'GPT', label: 'GPT', color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' },
  { id: 'GEMINI', label: 'Gemini', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
  { id: 'CLOUD', label: 'Together', color: 'bg-red-500/20 border-red-500/50 text-red-400' },
  { id: 'CURSOR', label: 'Cursor', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
  { id: 'FAL', label: 'Fal AI', color: 'bg-pink-500/20 border-pink-500/50 text-pink-400' },
  { id: 'V0', label: 'V0', color: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
]

const DIRECTORS = [
  { value: '', label: 'Otomatik' },
  { value: 'CFO', label: 'CFO' },
  { value: 'CTO', label: 'CTO' },
  { value: 'CPO', label: 'CPO (v0)' },
  { value: 'CSPO', label: 'CSPO' },
  { value: 'COO', label: 'COO' },
]

interface BrainTeamChatProps {
  chatInput: string
  setChatInput: React.Dispatch<React.SetStateAction<string>>
  onSent?: () => void
  targetDirector: string
  setTargetDirector: (v: string) => void
  asRoutine: boolean
  setAsRoutine: (v: boolean) => void
  fetchApprovalQueue: () => void
}

export function BrainTeamChat({
  chatInput,
  setChatInput,
  onSent,
  targetDirector,
  setTargetDirector,
  asRoutine,
  setAsRoutine,
  fetchApprovalQueue,
}: BrainTeamChatProps) {
  const [selectedAI, setSelectedAI] = useState<Set<AIProvider>>(new Set(['GEMINI']))
  const [sending, setSending] = useState(false)
  const [lastMode, setLastMode] = useState<'send' | 'ata' | 'all' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef(chatInput)
  chatInputRef.current = chatInput

  const toggleAI = (id: AIProvider) => {
    setSelectedAI((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllAI = () => {
    setSelectedAI(new Set(AI_BUTTONS.map((b) => b.id)))
  }

  const handleSend = async (mode: 'send' | 'ata' | 'all') => {
    const msg = chatInput.trim()
    if (!msg || sending) return

    setSending(true)
    setLastMode(mode)
    try {
      const res = await fetch('/api/patron/direct-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          ask_all: mode === 'all',
          providers: mode === 'all' ? [] : Array.from(selectedAI),
          target_director: mode === 'ata' ? (targetDirector || undefined) : undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error ?? 'Gönderilemedi')
        return
      }

      setChatInput('')
      fetchApprovalQueue()
      onSent?.()
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setSending(false)
      setLastMode(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* AI Seçimi */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">AI seç (tıkla, çift tıkla = tümünü seç)</p>
        <div className="flex flex-wrap gap-2">
          {AI_BUTTONS.map(({ id, label, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleAI(id)}
              onDoubleClick={selectAllAI}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedAI.has(id)
                  ? `${color} ring-1 ring-offset-1 ring-offset-gray-900`
                  : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hedef direktör */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Hedef direktör (ATA için)</p>
        <select
          value={targetDirector}
          onChange={(e) => setTargetDirector(e.target.value)}
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground"
        >
          {DIRECTORS.map((d) => (
            <option key={d.value || 'auto'} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dosya + Input */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              const r = new FileReader()
              r.onload = () => {
                const b = (r.result as string)?.split(',')[1]
                if (b) setChatInput(`${chatInputRef.current}\n[Ek: ${f.name}]`.trim())
              }
              r.readAsDataURL(f)
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          title="Dosya ekle"
          className="shrink-0"
        >
          <Paperclip size={18} />
        </Button>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend('send')
            }
          }}
          placeholder="Mesaj yazın..."
          className="flex-1 bg-background border border-input rounded-md px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={sending}
        />
      </div>

      {/* Butonlar */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleSend('send')}
          disabled={sending || !chatInput.trim()}
          className="bg-cyan-600 hover:bg-cyan-700"
          title="Seçili AI'a gönder"
        >
          {sending && lastMode === 'send' ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <Send size={18} className="mr-2" />
          )}
          Gönder
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSend('ata')}
          disabled={sending || !chatInput.trim()}
          title="Seçili direktöre ata"
        >
          {sending && lastMode === 'ata' ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <Bot size={18} className="mr-2" />
          )}
          ATA
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSend('all')}
          disabled={sending || !chatInput.trim()}
          className="bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30"
          title="Tüm AI'lara aynı anda gönder"
        >
          {sending && lastMode === 'all' ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <Eye size={18} className="mr-2" />
          )}
          HERKESE SOR
        </Button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={asRoutine}
            onChange={(e) => setAsRoutine(e.target.checked)}
            className="rounded border-input bg-background text-primary"
          />
          Rutin
        </label>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Direkt AI modu — CEO/CELF zinciri atlanır. Sonuç Patron Havuzu&apos;na gelir.
      </p>
    </div>
  )
}
