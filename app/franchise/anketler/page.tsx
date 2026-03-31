'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Loader2,
  ArrowLeft,
  Trash2,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
  Eye,
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
  status: 'draft' | 'active' | 'closed'
  created_at: string
}

interface ResultSummary {
  questionId: string
  text: string
  type: string
  distribution?: Record<string, number>
  average?: number
  answers?: string[]
  count: number
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FranchiseAnketlerPage() {
  const router = useRouter()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'create' | 'results'>('list')
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const fetchSurveys = useCallback(async () => {
    const res = await fetch('/api/franchise/surveys')
    const data = await res.json()
    setSurveys(Array.isArray(data.items) ? data.items : [])
  }, [])

  useEffect(() => {
    fetchSurveys().finally(() => setLoading(false))
  }, [fetchSurveys])

  const handleToggleStatus = async (survey: Survey) => {
    const nextStatus = survey.status === 'active' ? 'closed' : 'active'
    const res = await fetch('/api/franchise/surveys', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: survey.id, status: nextStatus }),
    })
    if (res.ok) fetchSurveys()
  }

  const openResults = (id: string) => {
    setSelectedSurveyId(id)
    setView('results')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/franchise')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Anketler</h1>
        </div>
        {view === 'list' && (
          <Button onClick={() => setView('create')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Anket
          </Button>
        )}
        {view !== 'list' && (
          <Button variant="outline" onClick={() => { setView('list'); setSelectedSurveyId(null) }}>
            Listeye Dön
          </Button>
        )}
      </header>

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        {view === 'list' && (
          <SurveyListView
            surveys={surveys}
            onToggle={handleToggleStatus}
            onResults={openResults}
          />
        )}
        {view === 'create' && (
          <CreateSurveyView
            onCreated={() => { setView('list'); fetchSurveys() }}
          />
        )}
        {view === 'results' && selectedSurveyId && (
          <SurveyResultsView surveyId={selectedSurveyId} />
        )}
      </main>
    </div>
  )
}

// ─── Survey List ─────────────────────────────────────────────────────────────

function SurveyListView({
  surveys,
  onToggle,
  onResults,
}: {
  surveys: Survey[]
  onToggle: (s: Survey) => void
  onResults: (id: string) => void
}) {
  const statusBadge = (s: string) => {
    if (s === 'active') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Aktif</Badge>
    if (s === 'closed') return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Kapalı</Badge>
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Taslak</Badge>
  }

  if (surveys.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Henüz Anket Yok</h2>
          <p className="text-sm text-muted-foreground">
            &quot;Yeni Anket&quot; butonuna tıklayarak ilk anketinizi oluşturun.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {surveys.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{s.title}</h3>
                {statusBadge(s.status)}
              </div>
              {s.description && (
                <p className="text-sm text-muted-foreground truncate">{s.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {(s.questions ?? []).length} soru · {new Date(s.created_at).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                title={s.status === 'active' ? 'Kapat' : 'Aktifleştir'}
                onClick={() => onToggle(s)}
              >
                {s.status === 'active' ? (
                  <ToggleRight className="h-5 w-5 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
              <Button variant="ghost" size="icon" title="Sonuçlar" onClick={() => onResults(s.id)}>
                <BarChart3 className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Create Survey ───────────────────────────────────────────────────────────

function CreateSurveyView({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [saving, setSaving] = useState(false)

  const addQuestion = (type: QuestionType) => {
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    setQuestions((prev) => [
      ...prev,
      {
        id,
        text: '',
        type,
        ...(type === 'multiple_choice' ? { options: ['', ''] } : {}),
      },
    ])
  }

  const updateQuestion = (idx: number, field: string, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev]
      const opts = [...(updated[qIdx].options ?? [])]
      opts[oIdx] = value
      updated[qIdx] = { ...updated[qIdx], options: opts }
      return updated
    })
  }

  const addOption = (qIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[qIdx] = { ...updated[qIdx], options: [...(updated[qIdx].options ?? []), ''] }
      return updated
    })
  }

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    const validQuestions = questions.filter((q) => q.text.trim())
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, questions: validQuestions }),
      })
      if (res.ok) onCreated()
    } finally {
      setSaving(false)
    }
  }

  const typeLabel = (t: QuestionType) => {
    if (t === 'multiple_choice') return 'Çoktan Seçmeli'
    if (t === 'rating') return 'Puan (1-5)'
    return 'Açık Uçlu'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Anket Oluştur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Anket Başlığı *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Veli Memnuniyet Anketi"
            />
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anketin amacı..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sorular */}
      {questions.map((q, idx) => (
        <Card key={q.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{typeLabel(q.type)}</Badge>
              <Button variant="ghost" size="icon" onClick={() => removeQuestion(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div>
              <Label>Soru {idx + 1}</Label>
              <Input
                value={q.text}
                onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                placeholder="Sorunuzu yazın..."
              />
            </div>
            {q.type === 'multiple_choice' && (
              <div className="space-y-2 pl-4">
                <Label className="text-xs text-muted-foreground">Seçenekler</Label>
                {(q.options ?? []).map((opt, oIdx) => (
                  <Input
                    key={oIdx}
                    value={opt}
                    onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                    placeholder={`Seçenek ${oIdx + 1}`}
                    className="h-8 text-sm"
                  />
                ))}
                <Button variant="outline" size="sm" onClick={() => addOption(idx)}>
                  <Plus className="mr-1 h-3 w-3" /> Seçenek Ekle
                </Button>
              </div>
            )}
            {q.type === 'rating' && (
              <p className="text-xs text-muted-foreground pl-4">1-5 arası puan (yıldız)</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Soru Ekleme Butonları */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => addQuestion('multiple_choice')}>
          <Plus className="mr-1 h-4 w-4" /> Çoktan Seçmeli
        </Button>
        <Button variant="outline" onClick={() => addQuestion('open_ended')}>
          <Plus className="mr-1 h-4 w-4" /> Açık Uçlu
        </Button>
        <Button variant="outline" onClick={() => addQuestion('rating')}>
          <Plus className="mr-1 h-4 w-4" /> Puan
        </Button>
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={saving || !title.trim()}
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Anketi Kaydet
      </Button>
    </div>
  )
}

// ─── Survey Results ──────────────────────────────────────────────────────────

function SurveyResultsView({ surveyId }: { surveyId: string }) {
  const [loading, setLoading] = useState(true)
  const [surveyInfo, setSurveyInfo] = useState<{ title: string; status: string } | null>(null)
  const [totalResponses, setTotalResponses] = useState(0)
  const [summary, setSummary] = useState<ResultSummary[]>([])

  useEffect(() => {
    fetch(`/api/franchise/surveys/${surveyId}/results`)
      .then((r) => r.json())
      .then((data) => {
        setSurveyInfo(data.survey ?? null)
        setTotalResponses(data.totalResponses ?? 0)
        setSummary(Array.isArray(data.summary) ? data.summary : [])
      })
      .finally(() => setLoading(false))
  }, [surveyId])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {surveyInfo?.title ?? 'Anket Sonuçları'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Toplam <strong>{totalResponses}</strong> yanıt
          </p>
        </CardContent>
      </Card>

      {summary.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Eye className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Henüz yanıt yok.</p>
          </CardContent>
        </Card>
      )}

      {summary.map((item) => (
        <Card key={item.questionId}>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground">{item.text}</h3>
            <p className="text-xs text-muted-foreground">{item.count} yanıt</p>

            {/* Çoktan seçmeli — bar chart */}
            {item.type === 'multiple_choice' && item.distribution && (
              <div className="space-y-2">
                {Object.entries(item.distribution).map(([opt, count]) => {
                  const pct = item.count > 0 ? Math.round((count / item.count) * 100) : 0
                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{opt || '(boş)'}</span>
                        <span className="text-muted-foreground">{count} (%{pct})</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Puan — ortalama + dağılım */}
            {item.type === 'rating' && (
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">
                  {item.average ?? 0} <span className="text-sm font-normal text-muted-foreground">/ 5</span>
                </p>
                {item.distribution && (
                  <div className="flex gap-1 items-end h-16">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const count = item.distribution?.[String(star)] ?? 0
                      const maxCount = Math.max(...Object.values(item.distribution ?? {}), 1)
                      const heightPct = Math.round((count / maxCount) * 100)
                      return (
                        <div key={star} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t bg-primary/70 transition-all min-h-[2px]"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{star}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Açık uçlu — liste */}
            {item.type === 'open_ended' && item.answers && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {item.answers.map((a, i) => (
                  <div key={i} className="rounded-lg bg-muted p-3 text-sm text-foreground">
                    {a}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
