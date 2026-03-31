'use client'

/**
 * Patron Onay Paneli — TAM SİSTEM
 * Onayla / Reddet / Öneri İste / Değiştir
 * ÖNCE GÖR: İçerik önizleme — neyi onaylayacağını gör
 */

import { useState } from 'react'
import { Check, X, Edit3, Lightbulb, Eye, Maximize2, Minimize2 } from 'lucide-react'

export interface PendingTask {
  output: Record<string, unknown>
  aiResponses: { provider: string; response: unknown }[]
  flow: string
  message: string
  command_id?: string
  displayText?: string
}

interface PatronApprovalUIProps {
  pendingTask: PendingTask
  commandId?: string
  userId?: string
  onApprove: () => void | Promise<void>
  onReject: () => void | Promise<void>
  onSuggest?: () => void | Promise<void>
  onModify?: (modifyText: string) => void | Promise<void>
}

function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str)
}

export function PatronApprovalUI({
  pendingTask,
  onApprove,
  onReject,
  onSuggest,
  onModify,
}: PatronApprovalUIProps) {
  const [showModifyInput, setShowModifyInput] = useState(false)
  const [modifyText, setModifyText] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [previewExpanded, setPreviewExpanded] = useState(false)

  const content = pendingTask.displayText ?? (pendingTask.output?.displayText as string) ?? ''
  const hasContent = content && content.trim().length > 0

  const handleModify = () => {
    if (onModify && modifyText.trim()) {
      onModify(modifyText.trim())
      setShowModifyInput(false)
      setModifyText('')
    } else {
      setShowModifyInput(false)
    }
  }

  return (
    <div className="patron-approval-panel rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
      <h3 className="font-semibold text-amber-400">⏳ Patron Onayı Bekleniyor</h3>

      <div className="task-summary text-sm text-slate-300 space-y-1">
        <p>
          <strong>Görev:</strong> {pendingTask.message}
        </p>
        <p>
          <strong>İşlem:</strong> {(pendingTask.output?.taskType as string) ?? '—'}
        </p>
        <p>
          <strong>Çalışan AI&apos;lar:</strong>{' '}
          {pendingTask.aiResponses
            .filter((a) => {
              const r = a.response as { status?: string; text?: string } | undefined
              return r && (r.status === 'ok' || typeof r.text === 'string')
            })
            .map((a) => a.provider)
            .join(' → ') || '—'}
        </p>
        <p className="text-slate-500 text-xs">{pendingTask.flow}</p>
      </div>

      {/* ÖNCE GÖR: İçerik önizleme — neyi onaylayacağını gör */}
      {hasContent && (
        <div className="border-2 border-amber-500/40 rounded-xl overflow-hidden bg-slate-900/50">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50 transition-colors bg-amber-500/5"
          >
            <span className="text-amber-400 font-semibold flex items-center gap-2">
              <Eye size={18} />
              📄 İÇERİĞİ GÖR — Buraya tıkla, onaylamadan önce kontrol et
            </span>
            {showPreview ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          {showPreview && (
            <div className="border-t border-slate-600/50">
              <button
                type="button"
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="w-full px-4 py-1.5 text-xs text-slate-500 hover:text-slate-300"
              >
                {previewExpanded ? 'Küçült' : 'Büyüt (10x)'}
              </button>
              <div
                className={`overflow-auto bg-white text-slate-900 p-4 ${previewExpanded ? 'min-h-[400px] max-h-[70vh]' : 'max-h-[200px]'}`}
              >
                {isHtml(content) ? (
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans">{content}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-amber-500/80 text-xs">
        İçeriği inceledikten sonra onaylayın. Virgül, imla, tasarım doğru mu kontrol edin.
      </p>

      <div className="approval-buttons flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors"
        >
          <Check size={14} />
          Onayla
        </button>
        <button
          type="button"
          onClick={onReject}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors"
        >
          <X size={14} />
          Reddet
        </button>
        {onSuggest && (
          <button
            type="button"
            onClick={onSuggest}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium transition-colors"
          >
            <Lightbulb size={14} />
            Öneri İste
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowModifyInput((s) => !s)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500 text-sm font-medium transition-colors"
        >
          <Edit3 size={14} />
          Değiştir
        </button>
      </div>

      {showModifyInput && (
        <div className="space-y-2">
          <textarea
            value={modifyText}
            onChange={(e) => setModifyText(e.target.value)}
            placeholder="Değişiklik talimatınızı yazın..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleModify}
              className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-medium"
            >
              Gönder
            </button>
            <button
              type="button"
              onClick={() => setShowModifyInput(false)}
              className="px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
