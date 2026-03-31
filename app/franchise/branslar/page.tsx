'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

type SportsBranch = {
  id: string
  kod: string
  isim: string
  aciklama?: string | null
  kategori?: string | null
  aktif: boolean
  sira: number
  meta_data?: Record<string, unknown> | null
}

const KATEGORI_RENK: Record<string, string> = {
  jimnastik: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fitness: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  genel: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

function getKategoriClass(kategori: string | null | undefined): string {
  if (!kategori) return KATEGORI_RENK.genel
  return KATEGORI_RENK[kategori] ?? KATEGORI_RENK.genel
}

export default function BranslarPage() {
  const [branslar, setBranslar] = useState<SportsBranch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBranslar = useCallback(async () => {
    try {
      const res = await fetch('/api/franchise/branslar')
      const data = await res.json()
      setBranslar(Array.isArray(data?.branslar) ? data.branslar : [])
    } catch {
      setBranslar([])
    }
  }, [])

  useEffect(() => {
    fetchBranslar().finally(() => setLoading(false))
  }, [fetchBranslar])

  const handleToggle = async (id: string, currentAktif: boolean) => {
    try {
      const res = await fetch('/api/franchise/branslar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aktif: !currentAktif }),
      })
      const data = await res.json()
      if (data?.ok) {
        fetchBranslar()
      } else {
        alert(data?.error ?? 'Guncelleme basarisiz')
      }
    } catch {
      alert('Baglanti hatasi')
    }
  }

  const aktifCount = branslar.filter((b) => b.aktif).length

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/franchise"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Branslar</h1>
              <p className="text-sm text-zinc-400">Tesis brans yonetimi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {aktifCount} aktif
            </Badge>
            <Badge className="bg-zinc-600/30 text-zinc-400 border-zinc-600/30">
              {branslar.length} toplam
            </Badge>
          </div>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-cyan-400" />
              Spor Branslari
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Tesisinizde aktif branslari yonetin. Aktif branslari kapatarak ders programindan gizleyebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : branslar.length === 0 ? (
              <p className="py-8 text-center text-zinc-500">Henuz brans kaydi bulunamadi.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 w-12">#</TableHead>
                    <TableHead className="text-zinc-400">Kod</TableHead>
                    <TableHead className="text-zinc-400">Brans Adi</TableHead>
                    <TableHead className="text-zinc-400">Kategori</TableHead>
                    <TableHead className="text-zinc-400">Durum</TableHead>
                    <TableHead className="text-zinc-400 text-right">Islem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branslar.map((b) => (
                    <TableRow key={b.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="text-zinc-500 tabular-nums">{b.sira}</TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">{b.kod}</TableCell>
                      <TableCell className="font-medium text-white">{b.isim}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getKategoriClass(b.kategori)}`}>
                          {b.kategori ?? 'genel'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            b.aktif
                              ? 'inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400'
                              : 'inline-flex items-center gap-1 rounded-full bg-zinc-600/30 px-2 py-0.5 text-xs text-zinc-500'
                          }
                        >
                          {b.aktif ? (
                            <><CheckCircle2 className="h-3 w-3" /> Aktif</>
                          ) : (
                            <><XCircle className="h-3 w-3" /> Pasif</>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={
                            b.aktif
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                          }
                          onClick={() => handleToggle(b.id, b.aktif)}
                        >
                          {b.aktif ? 'Deaktif Et' : 'Aktif Et'}
                        </Button>
                      </TableCell>
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
