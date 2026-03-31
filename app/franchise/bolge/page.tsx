'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin } from 'lucide-react'

/** K10 — mock bölgesel kulüp listesi (tenis örneği); ileride API ile değiştirilebilir */
const MOCK_BOLGELER = [
  {
    id: 'atasehir',
    ad: 'Ataşehir (İstanbul Anadolu)',
    kulup: [
      { ad: 'İstanbul Tenis Kulübü', not: 'Bölgesel lig' },
      { ad: 'Örnek Spor Kulübü Ataşehir', not: 'Youth ligi' },
      { ad: 'Cadde Spor Tenis', not: 'Kulüp üyeliği' },
    ],
  },
  {
    id: 'kartal',
    ad: 'Kartal / Pendik hattı',
    kulup: [
      { ad: 'Kartal Tenis İhtisas', not: 'Mock veri' },
      { ad: 'Sahil Spor Kulübü', not: 'Mock veri' },
    ],
  },
]

export default function FranchiseBolgePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
        <Link href="/franchise">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Panele dön
        </Link>
      </Button>

      <header className="flex items-start gap-3">
        <MapPin className="h-8 w-8 text-cyan-400 shrink-0 mt-1" />
        <div>
          <h1 className="text-2xl font-bold">Bölge ve kulüpler</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Şimdilik örnek liste (mock). Tenant yöneticisi bölge seçtiğinde resmi kulüp yönlendirmesi için veri kaynağı sonra
            bağlanacak.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_BOLGELER.map((b) => (
          <Card key={b.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">{b.ad}</CardTitle>
              <CardDescription className="text-zinc-500">Tenis — örnek kulüpler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {b.kulup.map((k) => (
                <div key={k.ad} className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 px-3 py-2">
                  <span className="text-zinc-100">{k.ad}</span>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400 shrink-0">
                    {k.not}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
