'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Loader2, CreditCard, User } from 'lucide-react'
import type { BorcluDetayResponse, OdemeKaydi } from '@/app/api/franchise/borclu-hesaplar/[id]/route'

function formatTL(n: number): string {
  return `${Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
}

function formatTarih(s: string | null): string {
  if (!s || s === '—') return '—'
  try {
    const d = new Date(s)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return s
  }
}

export default function BorcluHesapDetayPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [data, setData] = useState<BorcluDetayResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/franchise/borclu-hesaplar/${id}`)
      const json = (await res.json()) as BorcluDetayResponse
      setData(json)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!id) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <p className="text-zinc-400">Geçersiz sporcu.</p>
        <Button variant="link" className="mt-2 text-zinc-400" onClick={() => router.push('/franchise/borclu-hesaplar')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Listeye dön
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!data?.sporcu) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <p className="text-zinc-400">Sporcu bulunamadı.</p>
        <Button variant="link" className="mt-2 text-zinc-400" onClick={() => router.push('/franchise/borclu-hesaplar')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Listeye dön
        </Button>
      </div>
    )
  }

  const { sporcu, toplamBorc, sonOdeme, kayitlar } = data

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" asChild>
            <Link href="/franchise/borclu-hesaplar">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-white">Borç Detayı</h1>
        </div>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-zinc-400" />
              {sporcu.ad} {sporcu.soyad}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Şube: {sporcu.sube} · Toplam borç: <span className="text-red-400 font-semibold">{formatTL(toplamBorc)}</span>
              {sonOdeme && <> · Son ödeme: {formatTarih(sonOdeme)}</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/franchise/aidatlar">
                <CreditCard className="mr-2 h-4 w-4" /> Ödeme Al
              </Link>
            </Button>
            <Button variant="outline" className="border-zinc-600 text-zinc-300" asChild>
              <Link href={`/franchise/ogrenci-yonetimi?id=${id}`}>Sporcu profili</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Ödeme Geçmişi</CardTitle>
            <CardDescription className="text-zinc-400">Tüm ödeme kayıtları</CardDescription>
          </CardHeader>
          <CardContent>
            {kayitlar.length === 0 ? (
              <p className="text-zinc-500 py-6 text-center">Henüz ödeme kaydı yok.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Tarih</TableHead>
                    <TableHead className="text-zinc-400">Tutar</TableHead>
                    <TableHead className="text-zinc-400">Durum</TableHead>
                    <TableHead className="text-zinc-400">Açıklama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kayitlar.map((k: OdemeKaydi) => (
                    <TableRow key={k.id} className="border-zinc-800">
                      <TableCell className="text-zinc-300">{formatTarih(k.tarih)}</TableCell>
                      <TableCell className="font-medium text-white">{formatTL(k.tutar)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            k.durum === 'Ödendi'
                              ? 'text-emerald-400'
                              : k.durum === 'Gecikmiş'
                                ? 'text-red-400'
                                : 'text-zinc-400'
                          }
                        >
                          {k.durum}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-400">{k.aciklama}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
