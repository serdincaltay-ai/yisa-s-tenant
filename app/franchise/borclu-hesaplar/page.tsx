'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle, Loader2, Wallet } from 'lucide-react'
import type { BorcluSporcu } from '@/app/api/franchise/borclu-hesaplar/route'

type BorcluResponse = { sporcular: BorcluSporcu[]; toplamBorc: number }

const defaultData: BorcluResponse = { sporcular: [], toplamBorc: 0 }

function formatTarih(s: string | null): string {
  if (!s) return '—'
  try {
    const d = new Date(s)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

function formatTL(n: number): string {
  return `${Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
}

export default function BorcluHesaplarPage() {
  const router = useRouter()
  const [data, setData] = useState<BorcluResponse>(defaultData)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/franchise/borclu-hesaplar')
      const json = (await res.json()) as BorcluResponse
      setData({ sporcular: json.sporcular ?? [], toplamBorc: json.toplamBorc ?? 0 })
    } catch {
      setData(defaultData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRowClick = (id: string) => {
    router.push(`/franchise/borclu-hesaplar/${id}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Borçlu Hesaplar</h1>
        <p className="text-zinc-400 text-sm">Bakiye pozitif (ödeme bekleyen) sporcular — GymTekno referansı.</p>

        <Card className="border-red-500/30 bg-red-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Toplam Borç
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-400">{formatTL(data.toplamBorc)}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Liste</CardTitle>
            <CardDescription className="text-zinc-400">
              Satıra tıklayarak sporcu borç detayına gidebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : data.sporcular.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <Wallet className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p>Borçlu hesap yok.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Ad Soyad</TableHead>
                    <TableHead className="text-zinc-400">Şube</TableHead>
                    <TableHead className="text-zinc-400">Bakiye</TableHead>
                    <TableHead className="text-zinc-400">Son Ödeme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sporcular.map((s) => {
                    const neg = s.bakiye < 0
                    return (
                      <TableRow
                        key={s.id}
                        className="border-zinc-800 cursor-pointer hover:bg-zinc-800/80"
                        onClick={() => handleRowClick(s.id)}
                      >
                        <TableCell className="font-medium text-white">
                          {s.ad} {s.soyad}
                        </TableCell>
                        <TableCell className="text-zinc-400">{s.sube}</TableCell>
                        <TableCell>
                          <span className={neg ? 'text-emerald-400' : 'text-red-400 font-medium'}>
                            {formatTL(s.bakiye)}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-400">{formatTarih(s.son_odeme_tarihi)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
