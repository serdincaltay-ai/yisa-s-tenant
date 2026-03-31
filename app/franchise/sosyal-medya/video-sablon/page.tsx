'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Video } from 'lucide-react'

/** M4 — video şablon talimatları (çekim + Fal AI entegrasyonu sonraki adım) */
const SENARYOLAR = [
  '3 sn: sabit tripod, çocuk merkezde hazır duruş.',
  '3 sn: yavaş yaklaş, yüz ve form net görünsün.',
  '3 sn: yan açı — hareketin tekrarı.',
]

export default function FranchiseVideoSablonPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
        <Link href="/franchise/sosyal-medya">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Sosyal medya akışına dön
        </Link>
      </Button>

      <header className="flex items-start gap-3">
        <Video className="h-8 w-8 text-pink-400 shrink-0 mt-1" />
        <div>
          <h1 className="text-2xl font-bold">Video içerik şablonu</h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Antrenöre verilecek çekim senaryosu örneği. Müzik ve Fal AI üretim parametreleri COO şablonlarıyla eşleştirilir.
          </p>
        </div>
      </header>

      <Card className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <CardHeader>
          <CardTitle>Örnek çekim talimatı</CardTitle>
          <CardDescription className="text-zinc-400">Standart: tesis tanıtımı / çocuk gelişimi / veli memnuniyeti</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300 text-sm">
            {SENARYOLAR.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p className="mt-4 text-zinc-500 text-sm">
            Yükleme ve AI birleştirme uçları eklendiğinde bu sayfa dosya seçimi + önizleme ile genişletilecek.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
