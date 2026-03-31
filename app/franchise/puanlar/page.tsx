'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'

const SOURCE_LABEL: Record<string, string> = {
  google_yorum: 'Google yorumu',
  instagram_paylasim: 'Instagram paylaşımı',
  arkadas_yonlendirme: 'Arkadaş yönlendirme',
  duzenli_katilim: 'Düzenli katılım',
  ev_odevi: 'Ev ödevi tamamlama',
  diger: 'Diğer',
}

type Row = { id: string; athlete_id: string | null; source: string; points: number; note: string | null; created_at: string }

export default function FranchisePuanlarPage() {
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ source: 'duzenli_katilim' as string, points: '1', note: '' })

  const fetchList = useCallback(async () => {
    const res = await fetch('/api/franchise/points-ledger')
    const data = await res.json()
    setItems(Array.isArray(data.items) ? data.items : [])
    if (data.warning) console.warn(data.warning)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchList().finally(() => setLoading(false))
  }, [fetchList])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/franchise/points-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: form.source,
          points: parseInt(form.points, 10) || 1,
          note: form.note.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setForm({ source: 'duzenli_katilim', points: '1', note: '' })
        fetchList()
      } else alert(data.error ?? 'Kayıt başarısız')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
        <Link href="/franchise">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Panele dön
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-bold">Puan defteri</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Tablo: <code className="text-cyan-500/90">points_ledger</code> — migration uygulanmadan kayıt eklenemez.
        </p>
      </header>

      <Card className="bg-zinc-900 border-zinc-800 max-w-xl">
        <CardHeader>
          <CardTitle>Manuel puan ekle</CardTitle>
          <CardDescription className="text-zinc-400">Sporcu bazlı kayıt için API&apos;ye athlete_id eklenebilir (ileride).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>Kaynak</Label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              >
                {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Puan</Label>
              <Input
                type="number"
                className="mt-1 bg-zinc-800 border-zinc-700"
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
              />
            </div>
            <div>
              <Label>Not</Label>
              <Input className="mt-1 bg-zinc-800 border-zinc-700" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
            <Button type="submit" disabled={sending} className="bg-cyan-600 hover:bg-cyan-500">
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Ekle
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Son kayıtlar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          ) : items.length === 0 ? (
            <p className="text-zinc-500 text-sm">Kayıt yok veya tablo henüz oluşturulmadı.</p>
          ) : (
            <ul className="space-y-2 text-sm text-zinc-300">
              {items.map((r) => (
                <li key={r.id} className="border-b border-zinc-800 pb-2">
                  {new Date(r.created_at).toLocaleString('tr-TR')} — {SOURCE_LABEL[r.source] ?? r.source} —{' '}
                  <span className="text-cyan-400">+{r.points}</span>
                  {r.note ? ` · ${r.note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
