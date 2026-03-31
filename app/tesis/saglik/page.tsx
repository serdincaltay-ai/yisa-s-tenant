'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HeartPulse, Loader2 } from 'lucide-react'

type HealthRecord = {
  id: string
  athlete_id: string
  athlete_name: string
  record_type: string
  notes?: string | null
  recorded_at?: string | null
  created_at?: string | null
}

export default function TesisSaglikPage() {
  const [items, setItems] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/tesis/saglik')
        const data = await res.json()
        setItems(Array.isArray(data.items) ? data.items : [])
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-primary" />
          Sağlık Takibi
        </h1>
        <p className="text-muted-foreground">Öğrenci sağlık kayıtları</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Henuz saglik kaydi yok.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Öğrenci</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Kayit Turu</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Tarih</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm font-medium">Not</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{r.athlete_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{r.record_type ?? 'genel'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {r.recorded_at ? new Date(r.recorded_at).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm max-w-[200px] truncate">
                      {r.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t">
            <p className="text-sm text-muted-foreground">Toplam {items.length} kayit</p>
          </div>
        </Card>
      )}
    </div>
  )
}
