'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Users, Search, Loader2, RefreshCw } from 'lucide-react'

type Athlete = {
  id: string
  name: string
  surname?: string | null
  birth_date?: string | null
  gender?: string | null
  branch?: string | null
  level?: string | null
  status?: string
  parent_name?: string | null
  parent_phone?: string | null
  created_at?: string
}

function ageFromBirth(d: string | null | undefined): number | null {
  if (!d) return null
  const diff = new Date().getTime() - new Date(d).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

export default function TesisOgrencilerPage() {
  const [items, setItems] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/tesis/ogrenciler?${params}`)
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [q, statusFilter])

  useEffect(() => { fetchList() }, [fetchList])

  const statusBadge = (s?: string) => {
    if (s === 'active') return <Badge className="bg-green-500/20 text-green-600">Aktif</Badge>
    if (s === 'inactive') return <Badge className="bg-red-500/20 text-red-600">Pasif</Badge>
    if (s === 'trial') return <Badge className="bg-amber-500/20 text-amber-600">Deneme</Badge>
    return <Badge variant="secondary">{s ?? '—'}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Öğrenciler
          </h1>
          <p className="text-muted-foreground">Tesis ogrenci listesi</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchList}>
          <RefreshCw className="h-4 w-4 mr-1" />Yenile
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ad veya soyad ile ara..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tum Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="trial">Deneme</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Henuz ogrenci kaydi yok.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Yas</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Brans</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Seviye</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Durum</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Veli</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{a.name} {a.surname ?? ''}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ageFromBirth(a.birth_date) ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.branch ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.level ?? '—'}</td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{a.parent_name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t">
            <p className="text-sm text-muted-foreground">Toplam {items.length} ogrenci</p>
          </div>
        </Card>
      )}
    </div>
  )
}
