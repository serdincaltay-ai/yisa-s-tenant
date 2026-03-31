'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Loader2, Search, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'

type VeliBilgi = {
  id: string
  veli_adi: string
  telefon: string
  email: string
  ogrenci_adi: string
  brans: string
}

export default function VeliIletisimPage() {
  const [loading, setLoading] = useState(true)
  const [veliler, setVeliler] = useState<VeliBilgi[]>([])
  const [arama, setArama] = useState('')

  useEffect(() => {
    fetch('/api/kayit/veli-iletisim')
      .then((r) => r.json())
      .then((d) => setVeliler(d.veliler ?? []))
      .catch(() => setVeliler([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrelenmis = veliler.filter((v) =>
    v.veli_adi.toLowerCase().includes(arama.toLowerCase()) ||
    v.ogrenci_adi.toLowerCase().includes(arama.toLowerCase()) ||
    v.telefon.includes(arama)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Phone className="h-6 w-6 text-teal-500" />
          Veli İletişim Bilgileri
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Öğrenci velilerinin iletişim bilgileri
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Veli adı, öğrenci adı veya telefon ile ara..."
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Veli Listesi</CardTitle>
          <CardDescription>{filtrelenmis.length} veli kaydı</CardDescription>
        </CardHeader>
        <CardContent>
          {filtrelenmis.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {arama ? 'Arama kriterlerine uygun kayıt bulunamadı.' : 'Henüz veli kaydı yok.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-3 text-muted-foreground text-sm">Veli</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Öğrenci</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Branş</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">Telefon</th>
                    <th className="py-3 px-3 text-muted-foreground text-sm">E-posta</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrelenmis.map((v) => (
                    <tr key={v.id} className="border-b">
                      <td className="py-3 px-3 font-medium text-sm">{v.veli_adi}</td>
                      <td className="py-3 px-3 text-sm">{v.ogrenci_adi}</td>
                      <td className="py-3 px-3 text-sm">{v.brans || '—'}</td>
                      <td className="py-3 px-3 text-sm">
                        {v.telefon ? (
                          <a href={`tel:${v.telefon}`} className="text-teal-500 hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {v.telefon}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {v.email ? (
                          <a href={`mailto:${v.email}`} className="text-teal-500 hover:underline flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {v.email}
                          </a>
                        ) : '—'}
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
