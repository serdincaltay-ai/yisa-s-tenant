'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react'

/** M1 — 7 adımlı içerik akışı (rehber + durum; COO şablonları ile birlikte kullanın) */
const ADIMLAR = [
  { n: 1, baslik: 'AI içerik önerisi', aciklama: 'GPT + Fal AI ile taslak metin/görsel önerisi (yönetici tetikler).' },
  { n: 2, baslik: 'Yönetici onayı', aciklama: 'Franchise yetkilisi taslağı onaylar veya düzeltir.' },
  { n: 3, baslik: 'Antrenör talimatı', aciklama: 'Hangi sporcu, hareket, açı ve şablon — net talimat.' },
  { n: 4, baslik: 'Antrenör çekimi', aciklama: 'Çekim yüklenir; kalite kontrol.' },
  { n: 5, baslik: 'AI birleştirme', aciklama: 'Şablon + çekim + metin birleşimi.' },
  { n: 6, baslik: 'Final onay', aciklama: 'Yayın öncesi son kontrol.' },
  { n: 7, baslik: 'Paylaşım', aciklama: 'Instagram / WhatsApp / YouTube (entegrasyon aşamasında).' },
]

export default function FranchiseSosyalMedyaPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
          <Link href="/franchise">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Panele dön
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="border-zinc-600 text-cyan-300">
          <Link href="/franchise/sosyal-medya/video-sablon">Video şablon</Link>
        </Button>
      </div>

      <header>
        <h1 className="text-2xl font-bold">Sosyal medya içerik akışı</h1>
        <p className="text-zinc-400 text-sm mt-1 max-w-3xl">
          COO Mağazası ve <code className="text-cyan-500/90">coo_depo_*</code> akışını bozmayın. Bu sayfa süreç rehberidir;
          taslak/onay/yayın verisi depoda tutulur.
        </p>
      </header>

      <div className="grid gap-4 max-w-3xl">
        {ADIMLAR.map((a) => (
          <Card key={a.n} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
              <div className="mt-0.5 text-cyan-400">
                <Circle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-zinc-500 font-mono text-sm">#{a.n}</span>
                  {a.baslik}
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">{a.aciklama}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-900/80 border-emerald-900/40 max-w-3xl">
        <CardContent className="pt-6 flex gap-3 text-sm text-emerald-200/90">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>
            Her adımı kayıt altına alın; yayınlanan içerik <strong className="font-medium text-emerald-100">coo_depo_published</strong>{' '}
            ile uyumlu olmalıdır.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
