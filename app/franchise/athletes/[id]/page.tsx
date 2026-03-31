'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

type AthleteRow = {
  id: string
  name: string
  surname?: string | null
  birth_date?: string | null
  branch?: string | null
  level?: string | null
  status?: string
}

type EvalRow = {
  id: string
  evaluation_type: string
  scores: Record<string, number>
  trainer_note: string | null
  risk_flags: string[]
  program_profile: Record<string, unknown>
  created_at: string
}

const ILK_OLCUM_KEYS = [
  { key: 'kuvvet', label: 'Kuvvet (1-10)' },
  { key: 'esneklik', label: 'Esneklik (1-10)' },
  { key: 'denge', label: 'Denge (1-10)' },
]

const RISK_OPTIONS = [
  { id: 'seviye_testi_yaklasti', label: 'Seviye testi zamanı yaklaşıyor' },
  { id: 'gelisim_durdu', label: 'Gelişim yavaşladı / durağan' },
  { id: 'teknik_risk', label: 'Teknik / zorlanma riski işareti' },
  { id: 'eksik_kayit', label: 'Antrenör kayıtları eksik' },
]

export default function FranchiseAthleteDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''

  const [athlete, setAthlete] = useState<AthleteRow | null>(null)
  const [evaluations, setEvaluations] = useState<EvalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [ilkScores, setIlkScores] = useState<Record<string, number>>({ kuvvet: 5, esneklik: 5, denge: 5 })
  const [ilkNote, setIlkNote] = useState(
    'İLK DERS — Nazik ol, korkutma, eğlenceli tut'
  )

  const [riskSel, setRiskSel] = useState<string[]>([])
  const [programBody, setProgramBody] = useState<'ectomorph' | 'mesomorph' | 'endomorph' | ''>('')
  const [programMuscle, setProgramMuscle] = useState<'fast_twitch' | 'slow_twitch' | 'mixed' | ''>('')

  const fetchAll = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [aRes, eRes] = await Promise.all([
        fetch(`/api/franchise/athletes/${id}`),
        fetch(`/api/franchise/evaluations?athlete_id=${encodeURIComponent(id)}`),
      ])
      const aData = await aRes.json()
      const eData = await eRes.json()
      if (aRes.ok && aData?.id) setAthlete(aData as AthleteRow)
      else setAthlete(null)
      setEvaluations(Array.isArray(eData.items) ? eData.items : [])
      const latest = (eData.items as EvalRow[] | undefined)?.[0]
      if (latest?.scores && typeof latest.scores === 'object') {
        setIlkScores((s) => ({ ...s, ...latest.scores }))
      }
      if (latest?.trainer_note) setIlkNote(latest.trainer_note)
      if (latest?.risk_flags?.length) setRiskSel(latest.risk_flags)
      const pp = latest?.program_profile as { vucut?: string; kas?: string } | undefined
      if (pp?.vucut) setProgramBody(pp.vucut as typeof programBody)
      if (pp?.kas) setProgramMuscle(pp.kas as typeof programMuscle)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const saveIlkOlcum = async () => {
    if (!id || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: id,
          evaluation_type: 'ilk_olcum',
          scores: ilkScores,
          trainer_note: ilkNote.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setToast({ message: 'İlk ölçüm kaydedildi', type: 'success' })
        fetchAll()
      } else {
        setToast({ message: data.error ?? 'Kayıt başarısız', type: 'error' })
      }
    } catch {
      setToast({ message: 'Bağlantı hatası', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const saveRiskProgram = async () => {
    if (!id || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: id,
          evaluation_type: 'risk_program',
          scores: {},
          risk_flags: riskSel,
          program_profile: {
            vucut: programBody || undefined,
            kas: programMuscle || undefined,
          },
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setToast({ message: 'Risk ve program notu kaydedildi', type: 'success' })
        fetchAll()
      } else {
        setToast({ message: data.error ?? 'Kayıt başarısız', type: 'error' })
      }
    } catch {
      setToast({ message: 'Bağlantı hatası', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-white">
        <p className="text-zinc-400">Geçersiz adres</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
          <Link href="/franchise/ogrenci-yonetimi">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Öğrenci listesine dön
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : !athlete ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-zinc-400">Öğrenci bulunamadı.</CardContent>
        </Card>
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold">
              {athlete.name} {athlete.surname ?? ''}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {athlete.branch ?? '—'} · {athlete.level ?? '—'} ·{' '}
              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                {athlete.status ?? '—'}
              </Badge>
            </p>
          </header>

          {toast && (
            <div
              className={`rounded-md px-4 py-2 text-sm ${
                toast.type === 'success' ? 'bg-emerald-900/40 text-emerald-200' : 'bg-red-900/40 text-red-200'
              }`}
            >
              {toast.message}
            </div>
          )}

          <Tabs defaultValue="ilk" className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="ilk">İlk ölçüm</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="program">Program</TabsTrigger>
              <TabsTrigger value="gecmis">Geçmiş</TabsTrigger>
            </TabsList>

            <TabsContent value="ilk" className="mt-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>İlk ders değerlendirmesi</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Kuvvet, esneklik ve denge için 1–10 arası not. Veliye ham puan yerine özet gösterilir (ayrı modül).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ILK_OLCUM_KEYS.map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-zinc-300">{label}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={ilkScores[key] ?? 5}
                        onChange={(e) =>
                          setIlkScores((s) => ({ ...s, [key]: Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)) }))
                        }
                        className="bg-zinc-800 border-zinc-700 text-white max-w-[120px]"
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Antrenör notu</Label>
                    <Textarea
                      value={ilkNote}
                      onChange={(e) => setIlkNote(e.target.value)}
                      rows={3}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <Button onClick={saveIlkOlcum} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Kaydet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Risk ve uyarı</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Sportif direktör haftalık raporu için işaretler (master K5 özeti).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {RISK_OPTIONS.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer text-zinc-200">
                      <input
                        type="checkbox"
                        checked={riskSel.includes(o.id)}
                        onChange={() =>
                          setRiskSel((s) => (s.includes(o.id) ? s.filter((x) => x !== o.id) : [...s, o.id]))
                        }
                        className="rounded border-zinc-600"
                      />
                      {o.label}
                    </label>
                  ))}
                  <Button onClick={saveRiskProgram} disabled={saving} variant="secondary" className="mt-4">
                    Risk notunu kaydet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="program" className="mt-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Hareket programı profili</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Vücut ve kas tipi — öneri listesi ileride CSPO özeti ile birleştirilebilir (K6).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Vücut tipi</Label>
                    <select
                      value={programBody}
                      onChange={(e) => setProgramBody(e.target.value as typeof programBody)}
                      className="flex h-10 w-full max-w-md rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                    >
                      <option value="">Seçin</option>
                      <option value="ectomorph">Ektomorf</option>
                      <option value="mesomorph">Mezomorf</option>
                      <option value="endomorph">Endomorf</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Kas lif tercihi</Label>
                    <select
                      value={programMuscle}
                      onChange={(e) => setProgramMuscle(e.target.value as typeof programMuscle)}
                      className="flex h-10 w-full max-w-md rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                    >
                      <option value="">Seçin</option>
                      <option value="fast_twitch">Hızlı kas (fast twitch)</option>
                      <option value="slow_twitch">Dayanıklılık (slow twitch)</option>
                      <option value="mixed">Karma</option>
                    </select>
                  </div>
                  <Button onClick={saveRiskProgram} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500">
                    Program profilini kaydet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gecmis" className="mt-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Kayıt geçmişi</CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluations.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Henüz kayıt yok.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-zinc-300">
                      {evaluations.map((ev) => (
                        <li key={ev.id} className="border-b border-zinc-800 pb-2">
                          <span className="text-zinc-500">{new Date(ev.created_at).toLocaleString('tr-TR')}</span> —{' '}
                          {ev.evaluation_type}
                          {ev.trainer_note ? ` · ${ev.trainer_note.slice(0, 80)}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
