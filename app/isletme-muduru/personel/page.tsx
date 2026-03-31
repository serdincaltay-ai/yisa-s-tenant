'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type PersonelItem = {
  id: string
  ad_soyad: string
  email: string
  rol: string
  rol_label: string
  durum: 'aktif' | 'pasif'
  baslama_tarihi: string
}

export default function IsletmePersonelPage() {
  const [loading, setLoading] = useState(true)
  const [personeller, setPersoneller] = useState<PersonelItem[]>([])

  useEffect(() => {
    fetch('/api/isletme-muduru/dashboard')
      .then((r) => r.json())
      .then((d) => setPersoneller(d.personeller ?? []))
      .catch(() => setPersoneller([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-orange-400" />
          Personel Yönetimi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tesis personel listesi ve durumları
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personel Listesi</CardTitle>
          <CardDescription>{personeller.length} personel kayıtlı</CardDescription>
        </CardHeader>
        <CardContent>
          {personeller.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">Henüz personel kaydı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-4 text-muted-foreground text-sm">Ad Soyad</th>
                    <th className="py-3 px-4 text-muted-foreground text-sm">E-posta</th>
                    <th className="py-3 px-4 text-muted-foreground text-sm">Rol</th>
                    <th className="py-3 px-4 text-muted-foreground text-sm">Durum</th>
                    <th className="py-3 px-4 text-muted-foreground text-sm">Başlama</th>
                  </tr>
                </thead>
                <tbody>
                  {personeller.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-3 px-4 font-medium">{p.ad_soyad}</td>
                      <td className="py-3 px-4 text-sm">{p.email || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-xs">{p.rol_label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.durum === 'aktif' ? 'default' : 'outline'} className="text-xs capitalize">
                          {p.durum}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{p.baslama_tarihi}</td>
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
