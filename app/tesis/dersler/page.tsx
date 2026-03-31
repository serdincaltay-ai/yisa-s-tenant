'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Loader2 } from 'lucide-react'

const GUNLER = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar']

type Ders = {
  id: string
  gun: string
  saat: string
  ders_adi: string
  brans?: string | null
  seviye?: string | null
  antrenor_id?: string | null
}

export default function TesisDerslerPage() {
  const [items, setItems] = useState<Ders[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/tesis/dersler')
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

  const grouped = GUNLER.reduce<Record<string, Ders[]>>((acc, gun) => {
    acc[gun] = items.filter((d) => d.gun === gun).sort((a, b) => a.saat.localeCompare(b.saat))
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Ders Programi
        </h1>
        <p className="text-muted-foreground">Haftalik ders programi</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Henuz ders programi tanimlanmamis.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GUNLER.map((gun) => {
            const dersler = grouped[gun]
            if (dersler.length === 0) return null
            return (
              <Card key={gun}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{gun}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dersler.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-lg border p-2">
                      <div className="flex h-8 w-14 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                        {d.saat}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.ders_adi}</p>
                        {d.brans && <Badge variant="secondary" className="text-xs mt-0.5">{d.brans}</Badge>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
