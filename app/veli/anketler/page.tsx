'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'
import {
  Loader2,
  ClipboardList,
  CheckCircle2,
  Star,
  Send,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionType = 'multiple_choice' | 'open_ended' | 'rating'

interface SurveyQuestion {
  id: string
  text: string
  type: QuestionType
  options?: string[]
}

interface Survey {
  id: string
  title: string
  description: string | null
  questions: SurveyQuestion[]
  status: string
  created_at: string
}

interface Answer {
  questionId: string
  value: string | number
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VeliAnketlerPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())

  const fetchSurveys = useCallback(async () => {
    const res = await fetch('/api/franchise/surveys?status=active')
    const data = await res.json()
    const items: Survey[] = Array.isArray(data.items) ? data.items : []
    setSurveys(items)
  }, [])

  useEffect(() => {
    fetchSurveys().finally(() => setLoading(false))
  }, [fetchSurveys])

  const activeSurvey = surveys.find((s) => s.id === activeSurveyId) ?? null

  const handleSubmitted = (id: string) => {
    setSubmitted((prev) => new Set(prev).add(id))
    setActiveSurveyId(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <PanelHeader panelName="VELİ PANELİ" />

      <main className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-white">Anketler</h1>
        <p className="text-sm text-zinc-400">Tesisinizden gelen aktif anketleri doldurun.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : activeSurvey ? (
          <SurveyForm
            survey={activeSurvey}
            onBack={() => setActiveSurveyId(null)}
            onSubmitted={() => handleSubmitted(activeSurvey.id)}
          />
        ) : surveys.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center text-center">
            <ClipboardList className="h-16 w-16 text-zinc-600 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Anket Yok</h2>
            <p className="text-sm text-zinc-400 max-w-sm">
              Şu an doldurulabilecek aktif bir anket bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((s) => {
              const done = submitted.has(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => !done && setActiveSurveyId(s.id)}
                  disabled={done}
                  className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <ClipboardList className="h-5 w-5 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{s.title}</p>
                      {s.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{s.description}</p>
                      )}
                      <p className="text-[10px] text-zinc-600 mt-2">
                        {(s.questions ?? []).length} soru · {new Date(s.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    {done && (
                      <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">Gönderildi</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <VeliBottomNav />
    </div>
  )
}

// ─── Survey Form ─────────────────────────────────────────────────────────────

function SurveyForm({
  survey,
  onBack,
  onSubmitted,
}: {
  survey: Survey
  onBack: () => void
  onSubmitted: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const questions = survey.questions ?? []

  const updateAnswer = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    const formatted: Answer[] = questions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
      .map((q) => ({ questionId: q.id, value: answers[q.id] }))

    if (formatted.length === 0) {
      setError('Lütfen en az bir soruyu yanıtlayın.')
      return
    }

    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/franchise/surveys/${survey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formatted }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Bir hata oluştu')
        return
      }
      onSubmitted()
    } catch {
      setError('Sunucu hatası')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        &larr; Anketlere Dön
      </button>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h2 className="text-lg font-bold text-white mb-1">{survey.title}</h2>
        {survey.description && (
          <p className="text-sm text-zinc-400">{survey.description}</p>
        )}
      </div>

      {questions.map((q, idx) => (
        <div key={q.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-white">
            {idx + 1}. {q.text}
          </p>

          {q.type === 'multiple_choice' && (
            <div className="space-y-2">
              {(q.options ?? []).map((opt, oIdx) => {
                if (!opt.trim()) return null
                const selected = answers[q.id] === opt
                return (
                  <button
                    key={oIdx}
                    onClick={() => updateAnswer(q.id, opt)}
                    className={`w-full text-left rounded-xl px-4 py-2.5 text-sm transition-all ${
                      selected
                        ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {q.type === 'rating' && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => updateAnswer(q.id, star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      (answers[q.id] as number) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-zinc-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {q.type === 'open_ended' && (
            <textarea
              value={(answers[q.id] as string) ?? ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              placeholder="Yanıtınızı yazın..."
              rows={3}
              className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400/40 focus:outline-none resize-none"
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 transition-colors disabled:opacity-50"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Gönder
      </button>
    </div>
  )
}
