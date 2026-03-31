'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, Users, Loader2 } from 'lucide-react'
import type { PaketOzet, PaketUye } from '@/app/api/franchise/paket-dagilim/route'

type OzetResponse = { paketler: PaketOzet[]; toplamAktif: number }
type UyelerResponse = { uyeler: PaketUye[] }

const defaultOzet: OzetResponse = { paketler: [], toplamAktif: 0 }

function formatTarih(s: string | null): string {
  if (!s) return '—'
  try {
    const d = new Date(s)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

function durumLabel(d: PaketUye['durum']): string {
  switch (d) {
    case 'aktif': return 'Aktif'
    case 'bitmek_uzere': return 'Bitmek üzere'
    case 'bitmis': return 'Bitti'
    default: return d
  }
}

export default function PaketDagilimPage() {
  const router = useRouter()
  const [ozet, setOzet] = useState<OzetResponse>(defaultOzet)
  const [selectedPaketId, setSelectedPaketId] = useState<string>('')
  const [uyeler, setUyeler] = useState<PaketUye[]>([])
  const [loadingOzet, setLoadingOzet] = useState(true)
  const [loadingUyeler, setLoadingUyeler] = useState(false)

  const fetchOzet = useCallback(async () => {
    setLoadingOzet(true)
    try {
      const res = await fetch('/api/franchise/paket-dagilim')
      const data = (await res.json()) as OzetResponse
      setOzet({ paketler: data.paketler ?? [], toplamAktif: data.toplamAktif ?? 0 })
      setSelectedPaketId((prev) => (prev ? prev : data.paketler?.[0]?.id ?? ''))
    } catch {
      setOzet(defaultOzet)
    } finally {
      setLoadingOzet(false)
    }
  }, [])

  const fetchUyeler = useCallback(async (paketId: string) => {
    if (!paketId) {
      setUyeler([])
      return
    }
    setLoadingUyeler(true)
    try {
      const res = await fetch(`/api/franchise/paket-dagilim?paket_id=${encodeURIComponent(paketId)}`)
      const data = (await res.json()) as UyelerResponse
      setUyeler(Array.isArray(data?.uyeler) ? data.uyeler : [])
    } catch {
      setUyeler([])
    } finally {
      setLoadingUyeler(false)
    }
  }, [])

  useEffect(() => {
    fetchOzet()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedPaketId) fetchUyeler(selectedPaketId)
    else setUyeler([])
  }, [selectedPaketId, fetchUyeler])

  const handleRowClick = (id: string) => {
    router.push(`/franchise/ogrenci-yonetimi?id=${id}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Paket Dağılımı</h1>
        <p className="text-zinc-400 text-sm">Seans paketlerine göre aktif üye sayısı ve kalan kredi (GymTekno referansı).</p>

        {loadingOzet ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Toplam Aktif Üye
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{ozet.toplamAktif}</p>
                </CardContent>
              </Card>
              {ozet.paketler.map((p) => (
                <Card
                  key={p.id}
                  className={`cursor-pointer border-zinc-800 bg-zinc-900 transition-colors hover:bg-zinc-800/80 ${selectedPaketId === p.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedPaketId(p.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <Package className="h-4 w-4" /> {p.paket_adi}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-white">{p.aktif_uye_sayisi}</p>
                    <p className="text-xs text-zinc-500">üye · {p.toplam_kredi} kalan kredi</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-zinc-400">Paket seçin:</label>
              <select
                value={selectedPaketId}
                onChange={(e) => setSelectedPaketId(e.target.value)}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
              >
                <option value="">— Tümü —</option>
                {ozet.paketler.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.paket_adi} ({p.aktif_uye_sayisi})
                  </option>
                ))}
              </select>
            </div>

            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedPaketId ? ozet.paketler.find((p) => p.id === selectedPaketId)?.paket_adi ?? 'Üyeler' : 'Üyeler'}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Seçilen paketteki aktif üyeler — satıra tıklayarak profil sayfasına gidebilirsiniz.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedPaketId ? (
                  <p className="py-8 text-center text-zinc-500">Liste için yukarıdan bir paket seçin.</p>
                ) : loadingUyeler ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                  </div>
                ) : uyeler.length === 0 ? (
                  <p className="py-8 text-center text-zinc-500">Bu pakette aktif üye yok.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Ad Soyad</TableHead>
                        <TableHead className="text-zinc-400">Kalan Kredi</TableHead>
                        <TableHead className="text-zinc-400">Bitiş Tarihi</TableHead>
                        <TableHead className="text-zinc-400">Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uyeler.map((u) => (
                        <TableRow
                          key={u.id}
                          className="border-zinc-800 cursor-pointer hover:bg-zinc-800/80"
                          onClick={() => handleRowClick(u.id)}
                        >
                          <TableCell className="font-medium text-white">
                            {u.ad} {u.soyad}
                          </TableCell>
                          <TableCell className="text-zinc-300">{u.kalan_kredi}</TableCell>
                          <TableCell className="text-zinc-400">{formatTarih(u.bitis_tarihi)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                u.durum === 'aktif'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : u.durum === 'bitmek_uzere'
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                              }
                            >
                              {durumLabel(u.durum)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
