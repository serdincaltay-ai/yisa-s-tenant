'use client'

import { useState, useEffect } from 'react'
import { Play, Video, Palette, Rocket, Loader2, Check, AlertCircle, Copy, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type FalSlogan = string

export default function OzelAraclarPage() {
  const [slogans, setSlogans] = useState<FalSlogan[]>([])
  const [falSloganIndex, setFalSloganIndex] = useState(0)
  const [falLoading, setFalLoading] = useState(false)
  const [falResult, setFalResult] = useState<{ video_url?: string; error?: string } | null>(null)

  const [v0Prompt, setV0Prompt] = useState('')
  const [v0Loading, setV0Loading] = useState(false)
  const [v0Result, setV0Result] = useState<{ text?: string; error?: string } | null>(null)
  const [v0Copied, setV0Copied] = useState(false)

  const [oynaLoading, setOynaLoading] = useState(false)
  const [oynaResult, setOynaResult] = useState<{ message?: string; approved?: number; push_count?: number; error?: string } | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  const [sqlLoading, setSqlLoading] = useState(false)
  const [sqlResult, setSqlResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null)

  useEffect(() => {
    fetch('/api/fal/intro-video')
      .then((r) => r.json())
      .then((d) => setSlogans(Array.isArray(d?.slogans) ? d.slogans : []))
      .catch(() => setSlogans([]))
  }, [])

  useEffect(() => {
    fetch('/api/approvals')
      .then((r) => r.json())
      .then((d) => {
        const items = Array.isArray(d?.items) ? d.items : []
        setPendingCount(items.filter((i: { status?: string }) => i.status === 'pending').length)
      })
      .catch(() => {})
  }, [oynaResult])

  const handleFalGenerate = async () => {
    setFalLoading(true)
    setFalResult(null)
    try {
      const res = await fetch('/api/fal/intro-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slogan_index: falSloganIndex }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.ok && data.video_url) {
        setFalResult({ video_url: data.video_url })
      } else {
        setFalResult({ error: data.error ?? 'Video üretilemedi.' })
      }
    } catch (e) {
      setFalResult({ error: e instanceof Error ? e.message : 'İstek hatası' })
    } finally {
      setFalLoading(false)
    }
  }

  const handleV0Generate = async () => {
    if (!v0Prompt.trim()) return
    setV0Loading(true)
    setV0Result(null)
    try {
      const res = await fetch('/api/v0/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: v0Prompt.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.ok && data.text) {
        setV0Result({ text: data.text })
      } else {
        setV0Result({ error: data.error ?? 'Tasarım üretilemedi.' })
      }
    } catch (e) {
      setV0Result({ error: e instanceof Error ? e.message : 'İstek hatası' })
    } finally {
      setV0Loading(false)
    }
  }

  const handleSqlDeploy = async () => {
    if (!confirm('Veritabanı migration çalıştırılacak. Devam?')) return
    setSqlLoading(true)
    setSqlResult(null)
    try {
      const res = await fetch('/api/db/migrate', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data.ok) {
        setSqlResult({ ok: true, message: data.message ?? 'Migration tamamlandı.' })
      } else {
        setSqlResult({ ok: false, error: data.error ?? 'Migration başarısız.' })
      }
    } catch (e) {
      setSqlResult({ ok: false, error: e instanceof Error ? e.message : 'İstek hatası' })
    } finally {
      setSqlLoading(false)
    }
  }

  const handleOyna = async () => {
    setOynaLoading(true)
    setOynaResult(null)
    try {
      const res = await fetch('/api/deploy/oyna', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data.ok) {
        setOynaResult({ message: data.message, approved: data.approved, push_count: data.push_count })
        setPendingCount(0)
      } else {
        setOynaResult({ error: data.error ?? 'Deploy tetiklenemedi.' })
      }
    } catch (e) {
      setOynaResult({ error: e instanceof Error ? e.message : 'İstek hatası' })
    } finally {
      setOynaLoading(false)
    }
  }

  const copyV0Code = () => {
    if (v0Result?.text) {
      navigator.clipboard.writeText(v0Result.text)
      setV0Copied(true)
      setTimeout(() => setV0Copied(false), 2000)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Özel Araçlar</h1>
        <p className="text-muted-foreground text-sm mt-1">Fal intro video, v0 tasarım, Deploy Agent (Oyna)</p>
      </div>

      {/* Deploy Agent — Oyna */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket size={20} />
            Deploy Agent (Oyna)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Bekleyen onayları onayla, GitHub push ve deploy tetikle. Tek tuş.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingCount > 0 && (
            <Badge variant="secondary">
              {pendingCount} bekleyen iş
            </Badge>
          )}
          <Button
            onClick={handleOyna}
            disabled={oynaLoading || pendingCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {oynaLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            <span className="ml-2">Oyna</span>
          </Button>
          {oynaResult && (
            <div className={`text-sm p-3 rounded-lg ${oynaResult.error ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
              {oynaResult.error ? (
                <span className="flex items-center gap-2"><AlertCircle size={16} />{oynaResult.error}</span>
              ) : (
                <span className="flex items-center gap-2"><Check size={16} />{oynaResult.message}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SQL Deploy (Migration) — Ayrı, elle */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database size={20} />
            SQL Deploy (Migration)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Veritabanı migration — Oyna&apos;dan bağımsız, gerektiğinde elle çalıştırın.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSqlDeploy}
            disabled={sqlLoading}
            variant="outline"
          >
            {sqlLoading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            <span className="ml-2">Migration Çalıştır</span>
          </Button>
          {sqlResult && (
            <div className={`text-sm p-3 rounded-lg ${sqlResult.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
              {sqlResult.ok ? (
                <span className="flex items-center gap-2"><Check size={16} />{sqlResult.message}</span>
              ) : (
                <span className="flex items-center gap-2"><AlertCircle size={16} />{sqlResult.error}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fal Intro Video */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video size={20} />
            Fal Intro Video
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            YİSA-S logo, slogan, Serdinç Altay — fuar/tanıtım için 8 saniyelik intro.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {slogans.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Slogan seçin</label>
              <select
                value={falSloganIndex}
                onChange={(e) => setFalSloganIndex(Number(e.target.value))}
                className="w-full max-w-md p-2 rounded-lg border bg-background"
              >
                {slogans.map((s, i) => (
                  <option key={i} value={i}>{s}</option>
                ))}
              </select>
            </div>
          )}
          <Button onClick={handleFalGenerate} disabled={falLoading}>
            {falLoading ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
            <span className="ml-2">Video Üret</span>
          </Button>
          {falResult && (
            <div className="space-y-2">
              {falResult.video_url ? (
                <div>
                  <video src={falResult.video_url} controls className="rounded-lg w-full max-w-lg aspect-video bg-black" />
                  <a href={falResult.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline mt-2 inline-block">Videoyu aç</a>
                </div>
              ) : (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle size={16} />{falResult.error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* v0 Tasarım */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette size={20} />
            v0 Tasarım
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tasarım açıklamanızı yazın — v0 UI/komponent üretecek. Komut kodu gösterilmez, sadece sonuç.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={v0Prompt}
            onChange={(e) => setV0Prompt(e.target.value)}
            placeholder="Örn: YİSA-S için koyu tema, modern bir karşılama kartı. Logo ortada, altında 3 CTA butonu."
            className="w-full min-h-[100px] p-3 rounded-lg border bg-background text-sm"
            rows={4}
          />
          <Button onClick={handleV0Generate} disabled={v0Loading || !v0Prompt.trim()}>
            {v0Loading ? <Loader2 size={18} className="animate-spin" /> : <Palette size={18} />}
            <span className="ml-2">Tasarım Üret</span>
          </Button>
          {v0Result && (
            <div className="space-y-2">
              {v0Result.text ? (
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words">
                    {v0Result.text}
                  </pre>
                  <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={copyV0Code}>
                    {v0Copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="ml-1">{v0Copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle size={16} />{v0Result.error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
