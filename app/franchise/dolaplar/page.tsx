'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import type { LockerRow } from '@/app/api/franchise/dolaplar/route'

type AthleteOption = { id: string; name: string; surname: string | null }

const DURUM_RENK: Record<string, string> = {
  bos: 'bg-zinc-600',
  kirali: 'bg-cyan-600',
  arizali: 'bg-destructive',
  rezerve: 'bg-amber-600',
}

export default function DolaplarPage() {
  const [items, setItems] = useState<LockerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [kiralaOpen, setKiralaOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedLocker, setSelectedLocker] = useState<LockerRow | null>(null)
  const [athletes, setAthletes] = useState<AthleteOption[]>([])
  const [kiralaForm, setKiralaForm] = useState({ athlete_id: '', baslangic: '', bitis: '', ucret: '' })
  const [saving, setSaving] = useState(false)
  const [bosaltLoading, setBosaltLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [durumFilter, setDurumFilter] = useState<string>('')
  const [yeniDolapOpen, setYeniDolapOpen] = useState(false)
  const [yeniDolapForm, setYeniDolapForm] = useState({ dolap_no: '', konum: '' })
  const [yeniDolapSaving, setYeniDolapSaving] = useState(false)

  const fetchLockers = useCallback(async () => {
    const url = durumFilter ? `/api/franchise/dolaplar?durum=${encodeURIComponent(durumFilter)}` : '/api/franchise/dolaplar'
    const res = await fetch(url)
    const data = (await res.json()) as { items?: LockerRow[] }
    setItems(Array.isArray(data?.items) ? data.items : [])
  }, [durumFilter])

  useEffect(() => {
    setLoading(true)
    fetchLockers().finally(() => setLoading(false))
  }, [fetchLockers])

  useEffect(() => {
    if (kiralaOpen) {
      fetch('/api/franchise/athletes?status=active')
        .then((r) => r.json())
        .then((d: { items?: AthleteOption[] }) => setAthletes(Array.isArray(d?.items) ? d.items : []))
      setKiralaForm({ athlete_id: '', baslangic: new Date().toISOString().slice(0, 10), bitis: '', ucret: '' })
    }
  }, [kiralaOpen])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const openKirala = (locker: LockerRow) => {
    if (locker.durum !== 'bos') return
    setSelectedLocker(locker)
    setKiralaOpen(true)
  }

  const openDetail = (locker: LockerRow) => {
    setSelectedLocker(locker)
    setDetailOpen(true)
  }

  const handleKirala = async () => {
    if (!selectedLocker || !kiralaForm.athlete_id || !kiralaForm.baslangic) return
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/dolaplar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dolap_id: selectedLocker.id,
          athlete_id: kiralaForm.athlete_id,
          baslangic: kiralaForm.baslangic,
          bitis: kiralaForm.bitis || undefined,
          ucret: kiralaForm.ucret ? parseFloat(kiralaForm.ucret) : undefined,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        setKiralaOpen(false)
        setSelectedLocker(null)
        fetchLockers()
        setToast({ message: 'Dolap kiralandı', type: 'success' })
      } else setToast({ message: data?.error ?? 'İşlem başarısız', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleYeniDolap = async () => {
    if (!yeniDolapForm.dolap_no.trim()) return
    setYeniDolapSaving(true)
    try {
      const res = await fetch('/api/franchise/dolaplar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dolap_no: yeniDolapForm.dolap_no.trim(), konum: yeniDolapForm.konum.trim() || undefined }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        setYeniDolapOpen(false)
        setYeniDolapForm({ dolap_no: '', konum: '' })
        fetchLockers()
        setToast({ message: 'Dolap eklendi', type: 'success' })
      } else setToast({ message: data?.error ?? 'Eklenemedi', type: 'error' })
    } finally {
      setYeniDolapSaving(false)
    }
  }

  const handleBosalt = async () => {
    if (!selectedLocker) return
    setBosaltLoading(true)
    try {
      const res = await fetch(`/api/franchise/dolaplar/${selectedLocker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bosalt: true }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        setDetailOpen(false)
        setSelectedLocker(null)
        fetchLockers()
        setToast({ message: 'Dolap boşaltıldı', type: 'success' })
      } else setToast({ message: data?.error ?? 'İşlem başarısız', type: 'error' })
    } finally {
      setBosaltLoading(false)
    }
  }

  const toplam = items.length
  const bos = items.filter((l) => l.durum === 'bos').length
  const kirali = items.filter((l) => l.durum === 'kirali').length
  const arizali = items.filter((l) => l.durum === 'arizali').length

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-zinc-100">Dolaplar</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card className="border-zinc-700 bg-zinc-900">
          <CardHeader>
            <CardTitle>Özet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <span className="text-zinc-400">Toplam: <strong className="text-zinc-100">{toplam}</strong></span>
              <span className="text-zinc-400">Boş: <strong className="text-cyan-400">{bos}</strong></span>
              <span className="text-zinc-400">Kiralı: <strong className="text-cyan-400">{kirali}</strong></span>
              <span className="text-zinc-400">Arızalı: <strong className="text-destructive">{arizali}</strong></span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            value={durumFilter}
            onChange={(e) => setDurumFilter(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="bos">Boş</option>
            <option value="kirali">Kiralı</option>
            <option value="arizali">Arızalı</option>
            <option value="rezerve">Rezerve</option>
          </select>
          <Button size="sm" variant="outline" onClick={() => setYeniDolapOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Dolap
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((locker) => (
              <Card
                key={locker.id}
                className={`cursor-pointer border-zinc-700 bg-zinc-900 transition-opacity hover:opacity-90 ${locker.durum === 'bos' ? 'border-cyan-500/30' : ''}`}
                onClick={() => locker.durum === 'bos' ? openKirala(locker) : openDetail(locker)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-100">#{locker.dolap_no}</span>
                    <Badge className={DURUM_RENK[locker.durum] ?? 'bg-zinc-600'}>{locker.durum}</Badge>
                  </div>
                  {locker.konum && <p className="mt-1 text-sm text-zinc-400">{locker.konum}</p>}
                  {locker.durum === 'kirali' && locker.kiralayan_adi && (
                    <p className="mt-1 text-sm text-cyan-400 truncate">{locker.kiralayan_adi}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && (
              <p className="col-span-full text-center text-zinc-500 py-8">Dolap kaydı yok</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={kiralaOpen} onOpenChange={(o) => { if (!o) setSelectedLocker(null); setKiralaOpen(o) }}>
        <DialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Dolap kirala</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedLocker ? `Dolap #${selectedLocker.dolap_no}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-300">Sporcu *</Label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                value={kiralaForm.athlete_id}
                onChange={(e) => setKiralaForm((f) => ({ ...f, athlete_id: e.target.value }))}
              >
                <option value="">Seçin</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} {a.surname ?? ''}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-zinc-300">Başlangıç *</Label>
              <Input type="date" className="mt-1 border-zinc-600 bg-zinc-800" value={kiralaForm.baslangic} onChange={(e) => setKiralaForm((f) => ({ ...f, baslangic: e.target.value }))} />
            </div>
            <div>
              <Label className="text-zinc-300">Bitiş (opsiyonel)</Label>
              <Input type="date" className="mt-1 border-zinc-600 bg-zinc-800" value={kiralaForm.bitis} onChange={(e) => setKiralaForm((f) => ({ ...f, bitis: e.target.value }))} />
            </div>
            <div>
              <Label className="text-zinc-300">Aylık ücret (₺)</Label>
              <Input type="number" min={0} step={0.01} className="mt-1 border-zinc-600 bg-zinc-800" value={kiralaForm.ucret} onChange={(e) => setKiralaForm((f) => ({ ...f, ucret: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKiralaOpen(false)}>İptal</Button>
            <Button onClick={handleKirala} disabled={saving || !kiralaForm.athlete_id || !kiralaForm.baslangic}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Kirala
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={yeniDolapOpen} onOpenChange={setYeniDolapOpen}>
        <DialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Yeni dolap</DialogTitle>
            <DialogDescription className="text-zinc-400">Dolap numarası ve konum</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-300">Dolap no *</Label>
              <Input className="mt-1 border-zinc-600 bg-zinc-800" value={yeniDolapForm.dolap_no} onChange={(e) => setYeniDolapForm((f) => ({ ...f, dolap_no: e.target.value }))} placeholder="Örn. A-01" />
            </div>
            <div>
              <Label className="text-zinc-300">Konum</Label>
              <Input className="mt-1 border-zinc-600 bg-zinc-800" value={yeniDolapForm.konum} onChange={(e) => setYeniDolapForm((f) => ({ ...f, konum: e.target.value }))} placeholder="Erkek soyunma" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYeniDolapOpen(false)}>İptal</Button>
            <Button onClick={handleYeniDolap} disabled={yeniDolapSaving || !yeniDolapForm.dolap_no.trim()}>
              {yeniDolapSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={(o) => { if (!o) setSelectedLocker(null); setDetailOpen(o) }}>
        <DialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Dolap detayı</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedLocker ? `#${selectedLocker.dolap_no} ${selectedLocker.konum ?? ''}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedLocker && (
            <div className="space-y-2">
              <p><span className="text-zinc-400">Durum:</span> <Badge className={DURUM_RENK[selectedLocker.durum]}>{selectedLocker.durum}</Badge></p>
              {selectedLocker.kiralayan_adi && (
                <>
                  <p><span className="text-zinc-400">Kiralayan:</span> {selectedLocker.kiralayan_adi}</p>
                  <p><span className="text-zinc-400">Başlangıç:</span> {selectedLocker.kiralama_baslangic ?? '—'}</p>
                  <p><span className="text-zinc-400">Bitiş:</span> {selectedLocker.kiralama_bitis ?? '—'}</p>
                  {selectedLocker.aylik_ucret != null && <p><span className="text-zinc-400">Aylık ücret:</span> {selectedLocker.aylik_ucret.toLocaleString('tr-TR')} ₺</p>}
                </>
              )}
              {selectedLocker.durum === 'kirali' && (
                <Button variant="destructive" className="mt-4" onClick={handleBosalt} disabled={bosaltLoading}>
                  {bosaltLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Boşalt
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${toast.type === 'success' ? 'bg-green-600/90' : 'bg-destructive/90'} text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
