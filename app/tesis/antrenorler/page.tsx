'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Loader2, Phone, Mail } from 'lucide-react'

type Staff = {
  id: string
  name: string
  surname?: string | null
  email?: string | null
  phone?: string | null
  role: string
  branch?: string | null
  is_active: boolean
  created_at?: string
}

export default function TesisAntrenorlerPage() {
  const [items, setItems] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/tesis/antrenorler')
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
          <Dumbbell className="h-6 w-6 text-primary" />
          Antrenörler
        </h1>
        <p className="text-muted-foreground">Tesis antrenor kadrosu</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Henuz antrenor kaydi yok.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {(s.name?.[0] ?? '').toUpperCase()}{(s.surname?.[0] ?? '').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{s.name} {s.surname ?? ''}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {s.branch && <Badge variant="secondary" className="text-xs">{s.branch}</Badge>}
                      <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs">
                        {s.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    {s.phone && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <Phone className="h-3 w-3" />{s.phone}
                      </p>
                    )}
                    {s.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />{s.email}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
