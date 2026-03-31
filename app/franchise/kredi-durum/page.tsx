'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Coins, Users, AlertTriangle, Loader2 } from 'lucide-react'

type Sporcu = {
  id: string
  ad: string
  soyad: string
  ders_kredisi: number
  paket_adi: string
  son_yoklama: string | null
}

type Ozet = {
  sporcular: Sporcu[]
  toplam: number
  bitmekUzere: number
  bitmis: number
}

const defaultOzet: Ozet = {
  sporcular: [],
  toplam: 0,
  bitmekUzere: 0,
  bitmis: 0,
}

function formatTarih(s: string | null): string {
  if (!s) return '—'
  try {
    const d = new Date(s)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

export default function KrediDurumPage() {
  const router = useRouter()
  const [durum, setDurum] = useState<'bitmek-uzere' | 'bitmis' | 'tumu'>('bitmek-uzere')
  const [ozet, setOzet] = useState<Ozet>(defaultOzet)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (tab: 'bitmek-uzere' | 'bitmis' | 'tumu') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/franchise/kredi-durum?durum=${tab}`)
      const data = (await res.json()) as Ozet
      setOzet(data)
    } catch {
      setOzet(defaultOzet)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(durum)
  }, [durum, fetchData])

  const handleRowClick = (id: string) => {
    router.push(`/franchise/ogrenci-yonetimi?id=${id}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Kredi Durumu</h1>
        <p className="text-zinc-400 text-sm">Kredisi bitmek üzere ve biten sporcular (GymTekno referansı).</p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Users className="h-4 w-4" /> Toplam Sporcu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{ozet.toplam}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Kredisi Bitmek Üzere (≤3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-400">{ozet.bitmekUzere}</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
                <Coins className="h-4 w-4" /> Kredisi Biten (0)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-400">{ozet.bitmis}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={durum} onValueChange={(v) => setDurum(v as 'bitmek-uzere' | 'bitmis' | 'tumu')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="bitmek-uzere" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              Bitmek Üzere
            </TabsTrigger>
            <TabsTrigger value="bitmis" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              Biten
            </TabsTrigger>
            <TabsTrigger value="tumu" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
              Tümü
            </TabsTrigger>
          </TabsList>
          <TabsContent value={durum} className="mt-4">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">Liste</CardTitle>
                <CardDescription className="text-zinc-400">
                  Satıra tıklayarak sporcu detayına gidebilirsiniz.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Ad Soyad</TableHead>
                        <TableHead className="text-zinc-400">Kalan Kredi</TableHead>
                        <TableHead className="text-zinc-400">Paket</TableHead>
                        <TableHead className="text-zinc-400">Son Yoklama</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ozet.sporcular.length === 0 ? (
                        <TableRow className="border-zinc-800">
                          <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                            Bu filtrede sporcu yok.
                          </TableCell>
                        </TableRow>
                      ) : (
                        ozet.sporcular.map((s) => {
                          const kredi = s.ders_kredisi
                          const isBitmis = kredi === 0
                          const isBitmekUzere = kredi > 0 && kredi <= 3
                          return (
                            <TableRow
                              key={s.id}
                              className={`border-zinc-800 cursor-pointer hover:bg-zinc-800/80 ${
                                isBitmis ? 'bg-red-500/10' : ''
                              }`}
                              onClick={() => handleRowClick(s.id)}
                            >
                              <TableCell className="font-medium text-white">
                                {s.ad} {s.soyad}
                              </TableCell>
                              <TableCell>
                                {isBitmekUzere ? (
                                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/40">
                                    {kredi} ders
                                  </Badge>
                                ) : isBitmis ? (
                                  <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/40">
                                    0
                                  </Badge>
                                ) : (
                                  <span className="text-zinc-300">{kredi}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-zinc-400">{s.paket_adi}</TableCell>
                              <TableCell className="text-zinc-400">{formatTarih(s.son_yoklama)}</TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
