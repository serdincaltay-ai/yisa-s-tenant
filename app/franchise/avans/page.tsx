'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Check, X } from 'lucide-react'

type Item = {
  id: string
  amount: number
  reason: string | null
  status: string
  requested_at: string
  reviewed_at: string | null
  staff_name: string
}

export default function FranchiseAvansPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchList = useCallback(async () => {
    const res = await fetch('/api/franchise/advance-requests')
    const data = await res.json()
    if (res.ok) setItems(Array.isArray(data.items) ? data.items : [])
    else setToast({ message: data.error ?? 'Liste yüklenemedi', type: 'error' })
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

  const patch = async (id: string, status: 'approved' | 'rejected') => {
    setActing(id)
    try {
      const res = await fetch('/api/franchise/advance-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setToast({ message: status === 'approved' ? 'Onaylandı' : 'Reddedildi', type: 'success' })
        fetchList()
      } else {
        setToast({ message: data.error ?? 'İşlem başarısız', type: 'error' })
      }
    } finally {
      setActing(null)
    }
  }

  const badge = (s: string) => {
    if (s === 'pending') return <Badge className="bg-amber-600">Bekliyor</Badge>
    if (s === 'approved') return <Badge className="bg-green-600">Onaylandı</Badge>
    if (s === 'rejected') return <Badge variant="destructive">Reddedildi</Badge>
    return <Badge variant="secondary">{s}</Badge>
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
        <h1 className="text-2xl font-bold">Personel avans talepleri</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Antrenör talepleri burada listelenir. Birleşik onay akışı için{' '}
          <Link href="/franchise/onaylar" className="text-cyan-400 hover:underline">
            Onaylar
          </Link>{' '}
          sayfasını da kullanın.
        </p>
      </header>

      {toast && (
        <div
          className={`rounded-md px-4 py-2 text-sm ${
            toast.type === 'success' ? 'bg-emerald-900/40 text-emerald-200' : 'bg-red-900/40 text-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Talepler</CardTitle>
          <CardDescription className="text-zinc-400">Son 50 kayıt</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-zinc-500 text-sm">Bekleyen veya geçmiş avans talebi yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2 pr-4">Personel</th>
                    <th className="py-2 pr-4">Tutar</th>
                    <th className="py-2 pr-4">Gerekçe</th>
                    <th className="py-2 pr-4">Durum</th>
                    <th className="py-2 pr-4">Tarih</th>
                    <th className="py-2">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-zinc-800/60">
                      <td className="py-3 pr-4 text-white">{row.staff_name}</td>
                      <td className="py-3 pr-4">{row.amount} ₺</td>
                      <td className="py-3 pr-4 text-zinc-300 max-w-[200px] truncate">{row.reason ?? '—'}</td>
                      <td className="py-3 pr-4">{badge(row.status)}</td>
                      <td className="py-3 pr-4 text-zinc-400 whitespace-nowrap">
                        {new Date(row.requested_at).toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3">
                        {row.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 bg-green-700 hover:bg-green-600"
                              disabled={acting === row.id}
                              onClick={() => patch(row.id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8"
                              disabled={acting === row.id}
                              onClick={() => patch(row.id, 'rejected')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
