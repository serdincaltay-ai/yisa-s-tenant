'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ClipboardCheck } from 'lucide-react'
import type { SonGecisRow } from '@/app/api/franchise/son-gecisler/route'

const REVALIDATE_MS = 30_000

function formatTarihSaat(tarih: string, saat: string): string {
  try {
    const d = new Date(tarih + (saat && saat !== '—' ? `T${saat}` : ''))
    if (saat && saat !== '—') return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return `${tarih} ${saat}`
  }
}

export function SonGecislerWidget({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<SonGecisRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/franchise/son-gecisler?limit=${limit}`)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REVALIDATE_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <ClipboardCheck className="h-4 w-4 text-zinc-400" />
          Son Geçişler
        </CardTitle>
        <CardDescription className="text-zinc-400 text-sm">
          Son yoklama kayıtları
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">Henüz yoklama kaydı yok</p>
        ) : (
          <ul className="space-y-2 max-h-[280px] overflow-y-auto">
            {items.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2 last:border-0 last:pb-0"
              >
                <span className="font-medium text-white truncate min-w-0">
                  {[g.sporcu_ad, g.sporcu_soyad].filter(Boolean).join(' ') || '—'}
                </span>
                <span className="text-zinc-400 text-sm shrink-0">
                  {formatTarihSaat(g.tarih, g.saat)}
                </span>
                {g.ders_adi !== '—' && (
                  <span className="text-zinc-500 text-xs w-full sm:w-auto">{g.ders_adi}</span>
                )}
                <Badge
                  variant={g.yoklama_durumu === 'geldi' || g.yoklama_durumu === 'geç kaldı' ? 'default' : g.yoklama_durumu === 'izinli' ? 'secondary' : 'destructive'}
                  className={
                    g.yoklama_durumu === 'geldi'
                      ? 'bg-emerald-600 hover:bg-emerald-700 border-0 shrink-0'
                      : g.yoklama_durumu === 'geç kaldı'
                        ? 'bg-amber-600 hover:bg-amber-700 border-0 shrink-0'
                        : g.yoklama_durumu === 'izinli'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shrink-0'
                          : 'shrink-0'
                  }
                >
                  {g.yoklama_durumu === 'geldi'
                    ? 'Geldi'
                    : g.yoklama_durumu === 'gelmedi'
                      ? 'Gelmedi'
                      : g.yoklama_durumu === 'izinli'
                        ? 'İzinli'
                        : 'Geç kaldı'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
