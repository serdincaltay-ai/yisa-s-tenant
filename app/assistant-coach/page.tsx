'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type DashboardData = {
  sporcuSayisi?: number
  bugunDersleri?: Array<{
    id: string
    ders_adi: string
    gun: string
    saat: string
    brans?: string | null
  }>
}

export default function AssistantCoachPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/antrenor/dashboard')
        const json = await res.json()
        setData(json)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        Yükleniyor...
      </div>
    )
  }

  const dersler = Array.isArray(data?.bugunDersleri) ? data!.bugunDersleri : []

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Yardımcı Antrenör Paneli</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Günlük destek görevleri, ders akışı ve sporcu takibi.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Atanan Sporcu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{data?.sporcuSayisi ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Rol Kapsamı</CardTitle>
          </CardHeader>
          <CardContent className="space-x-2">
            <Badge className="bg-cyan-600/30 text-cyan-200 border-cyan-500/30">assistant_coach</Badge>
            <Badge variant="outline" className="border-zinc-700 text-zinc-300">gözlem</Badge>
            <Badge variant="outline" className="border-zinc-700 text-zinc-300">destek</Badge>
            <Badge variant="outline" className="border-zinc-700 text-zinc-300">yoklama</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Bugünkü Dersler</CardTitle>
        </CardHeader>
        <CardContent>
          {dersler.length === 0 ? (
            <p className="text-zinc-400 text-sm">Bugün için ders bulunmuyor.</p>
          ) : (
            <div className="space-y-2">
              {dersler.map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{d.ders_adi}</p>
                    <p className="text-xs text-zinc-400">
                      {d.gun} · {d.saat}{d.brans ? ` · ${d.brans}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                    Destek
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
