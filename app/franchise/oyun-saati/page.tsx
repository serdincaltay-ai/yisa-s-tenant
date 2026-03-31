'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Gamepad2 } from 'lucide-react'

/**
 * GRUP C11 — Oyun saati: kayıtsız / misafir kullanım için ücret kuralı özeti.
 * Tam kayıt ve tahsilat entegrasyonu ileride payments / attendance ile bağlanabilir.
 */
export default function FranchiseOyunSaatiPage() {
  const [dersUcreti, setDersUcreti] = useState<string>('')

  const oyunUcreti = useMemo(() => {
    const n = parseFloat(dersUcreti.replace(',', '.'))
    if (Number.isNaN(n) || n < 0) return null
    return Math.round(n * 0.5 * 100) / 100
  }, [dersUcreti])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
        <Link href="/franchise">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Panele dön
        </Link>
      </Button>

      <header className="flex items-start gap-3">
        <Gamepad2 className="h-8 w-8 text-violet-400 shrink-0 mt-1" />
        <div>
          <h1 className="text-2xl font-bold">Oyun saati</h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Kayıtsız veya misafir &quot;oyun saati&quot; kullanımında referans kural: normal ders ücretinin{' '}
            <strong className="text-zinc-200">%50&apos;si</strong>. Kesin fiyat ve kayıt için işletme politikası geçerlidir.
          </p>
        </div>
      </header>

      <Card className="bg-zinc-900 border-zinc-800 max-w-md">
        <CardHeader>
          <CardTitle>Hızlı hesap</CardTitle>
          <CardDescription className="text-zinc-400">Tek ders ücreti girildiğinde önerilen oyun saati tutarı</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Standart ders ücreti (TL)</Label>
            <Input
              className="mt-1 bg-zinc-800 border-zinc-700"
              inputMode="decimal"
              placeholder="Örn. 400"
              value={dersUcreti}
              onChange={(e) => setDersUcreti(e.target.value)}
            />
          </div>
          {oyunUcreti != null && (
            <p className="text-lg text-violet-200">
              Önerilen oyun saati: <strong>{oyunUcreti.toLocaleString('tr-TR')} TL</strong>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
