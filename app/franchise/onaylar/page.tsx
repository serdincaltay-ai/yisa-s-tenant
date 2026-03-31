'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Check, X } from 'lucide-react'
import type { ApprovalQueueItem, OnaylarGetResponse } from '@/app/api/franchise/onaylar/route'

const TALEP_TIPI_LABEL: Record<string, string> = {
  personel_izin: 'Personel izin',
  personel_avans: 'Personel avans',
  diger: 'Diğer',
}

type TabDurum = 'bekliyor' | 'onaylandi' | 'reddedildi' | 'tumu'

export default function FranchiseOnaylarPage() {
  const [items, setItems] = useState<ApprovalQueueItem[]>([])
  const [counts, setCounts] = useState({ bekleyen: 0, onaylanan: 0, reddedilen: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabDurum>('bekliyor')
  const [onaylaId, setOnaylaId] = useState<string | null>(null)
  const [onayNotu, setOnayNotu] = useState('')
  const [reddetId, setReddetId] = useState<string | null>(null)
  const [redNedeni, setRedNedeni] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchList = useCallback(async () => {
    const res = await fetch('/api/franchise/onaylar?durum=tumu')
    const data = (await res.json()) as OnaylarGetResponse
    setItems(Array.isArray(data?.items) ? data.items : [])
    setCounts({
      bekleyen: typeof data?.bekleyen === 'number' ? data.bekleyen : 0,
      onaylanan: typeof data?.onaylanan === 'number' ? data.onaylanan : 0,
      reddedilen: typeof data?.reddedilen === 'number' ? data.reddedilen : 0,
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchList().finally(() => setLoading(false))
  }, [fetchList])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const filteredItems = tab === 'tumu' ? items : items.filter((i) => i.durum === tab)

  const handleOnayla = async () => {
    if (!onaylaId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/franchise/onaylar/${onaylaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aksiyon: 'onayla', karar_notu: onayNotu.trim() || undefined }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        setOnaylaId(null)
        setOnayNotu('')
        fetchList()
        setToast({ message: 'Onaylandı', type: 'success' })
      } else setToast({ message: data?.error ?? 'İşlem başarısız', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReddet = async () => {
    if (!reddetId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/franchise/onaylar/${reddetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aksiyon: 'reddet', karar_notu: redNedeni.trim() || undefined }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        setReddetId(null)
        setRedNedeni('')
        fetchList()
        setToast({ message: 'Reddedildi', type: 'success' })
      } else setToast({ message: data?.error ?? 'İşlem başarısız', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const durumBadge = (durum: string) => {
    const cls = durum === 'bekliyor' ? 'bg-amber-600 dark:bg-amber-700' : durum === 'onaylandi' ? 'bg-green-600 dark:bg-green-700' : 'bg-destructive'
    return <Badge className={cls}>{durum === 'bekliyor' ? 'Bekleyen' : durum === 'onaylandi' ? 'Onaylandı' : 'Reddedildi'}</Badge>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-zinc-100">Onaylar</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-zinc-700 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Bekleyen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-400">{counts.bekleyen}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-700 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Onaylanan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{counts.onaylanan}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-700 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Reddedilen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-400">{counts.reddedilen}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabDurum)}>
          <TabsList className="bg-zinc-800/80">
            <TabsTrigger value="bekliyor" className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400">Bekleyen</TabsTrigger>
            <TabsTrigger value="onaylandi" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">Onaylanan</TabsTrigger>
            <TabsTrigger value="reddedildi" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">Reddedilen</TabsTrigger>
            <TabsTrigger value="tumu" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Tümü</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
            ) : (
              <Card className="border-zinc-700 bg-zinc-900">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                        <TableHead className="text-zinc-300">Tarih</TableHead>
                        <TableHead className="text-zinc-300">Talep eden</TableHead>
                        <TableHead className="text-zinc-300">Talep tipi</TableHead>
                        <TableHead className="text-zinc-300">Başlık</TableHead>
                        <TableHead className="text-zinc-300">Açıklama</TableHead>
                        <TableHead className="text-zinc-300">Durum</TableHead>
                        {(tab === 'bekliyor' || tab === 'tumu') && (
                          <TableHead className="text-right text-zinc-300">Aksiyon</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={(tab === 'bekliyor' || tab === 'tumu') ? 7 : 6} className="text-center text-zinc-500 py-8">
                            Henüz onay talebi yok
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((row) => (
                          <TableRow key={row.id} className="border-zinc-700 hover:bg-zinc-800/50">
                            <TableCell className="text-zinc-400">{new Date(row.olusturma_tarihi).toLocaleString('tr-TR')}</TableCell>
                            <TableCell className="text-zinc-100">{row.talep_eden_ad ?? '—'}</TableCell>
                            <TableCell className="text-zinc-400">{TALEP_TIPI_LABEL[row.talep_tipi] ?? row.talep_tipi}</TableCell>
                            <TableCell className="text-zinc-100">{row.baslik}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-zinc-400">{row.aciklama ?? '—'}</TableCell>
                            <TableCell>{durumBadge(row.durum)}</TableCell>
                            {(tab === 'bekliyor' || tab === 'tumu') && row.durum === 'bekliyor' && (
                              <TableCell className="text-right">
                                <Button size="sm" className="mr-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setOnaylaId(row.id); setOnayNotu('') }} disabled={submitting}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/20" onClick={() => { setReddetId(row.id); setRedNedeni('') }} disabled={submitting}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                            {(tab === 'bekliyor' || tab === 'tumu') && row.durum !== 'bekliyor' && <TableCell className="text-right">—</TableCell>}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={onaylaId !== null} onOpenChange={(o) => { if (!o) setOnaylaId(null); setOnayNotu('') }}>
        <AlertDialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Onayla</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">Onay notu (opsiyonel)</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-zinc-300">Onay notu</Label>
            <Textarea className="border-zinc-600 bg-zinc-800 text-zinc-100 min-h-[80px]" value={onayNotu} onChange={(e) => setOnayNotu(e.target.value)} placeholder="İsteğe bağlı not..." />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-600 text-zinc-300">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleOnayla() }}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reddetId !== null} onOpenChange={(o) => { if (!o) setReddetId(null); setRedNedeni('') }}>
        <AlertDialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Reddet</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">Red nedeni (opsiyonel)</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-zinc-300">Red nedeni</Label>
            <Textarea className="border-zinc-600 bg-zinc-800 text-zinc-100 min-h-[80px]" value={redNedeni} onChange={(e) => setRedNedeni(e.target.value)} placeholder="Neden reddedildi?" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-600 text-zinc-300">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleReddet() }}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reddet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${toast.type === 'success' ? 'bg-green-600 dark:bg-green-700' : 'bg-destructive'} text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
