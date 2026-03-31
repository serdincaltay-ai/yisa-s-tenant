'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, Package, ShoppingCart, Loader2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

type MagazaData = {
  tokenBalance: number
  purchases: { id: string; product_name?: string; item_name?: string; token_cost?: number; created_at: string }[]
  paketler: { id: string; name: string; token: number; icerik: string }[]
  ekUrunler: { id: string; name: string; token: number }[]
  tokenYukle: { miktar: number; fiyat: number }[]
}

export default function MagazaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MagazaData | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const fetchData = async () => {
    const res = await fetch('/api/franchise/magaza')
    const d = await res.json()
    if (res.status === 401) {
      router.push('/auth/login?redirect=/magaza')
      return
    }
    if (res.status === 403) {
      router.push('/franchise')
      return
    }
    setData(d)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleYukle = async (miktar: number) => {
    setActing(`yukle-${miktar}`)
    try {
      const res = await fetch('/api/franchise/magaza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'yukle', miktar }),
      })
      const d = await res.json()
      if (d?.ok) {
        setData((prev) => (prev ? { ...prev, tokenBalance: d.tokenBalance } : null))
      } else {
        alert(d?.error ?? 'İşlem başarısız')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setActing(null)
    }
  }

  const handleSatinAl = async (productId: string, productName: string, tokenCost: number, itemType: string) => {
    if ((data?.tokenBalance ?? 0) < tokenCost) {
      alert('Yetersiz token bakiyesi')
      return
    }
    setActing(productId)
    try {
      const res = await fetch('/api/franchise/magaza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'satin_al',
          productId,
          productName,
          tokenCost,
          itemType,
        }),
      })
      const d = await res.json()
      if (d?.ok) {
        setData((prev) => (prev ? { ...prev, tokenBalance: d.tokenBalance } : null))
        fetchData()
      } else {
        alert(d?.error ?? 'Satın alma başarısız')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/franchise" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" />
            Panele Dön
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              Token Mağazası
            </h1>
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Coins className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Mevcut Bakiye</p>
                  <p className="text-2xl font-bold">{data?.tokenBalance ?? 0} token</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Paketler</CardTitle>
            <CardDescription>Abonelik paketleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {(data?.paketler ?? []).map((p) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-2xl font-bold text-primary mt-2">{p.token} token</p>
                  <p className="text-sm text-muted-foreground mt-1">{p.icerik}</p>
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    disabled={(data?.tokenBalance ?? 0) < p.token || acting === p.id}
                    onClick={() => handleSatinAl(p.id, p.name, p.token, 'paket')}
                  >
                    {acting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Satın Al'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ek Robotlar / Şablonlar</CardTitle>
            <CardDescription>Token ile satın alın</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(data?.ekUrunler ?? []).map((p) => (
                <div key={p.id} className="rounded-lg border p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="text-lg font-bold text-primary">{p.token} token</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={(data?.tokenBalance ?? 0) < p.token || acting === p.id}
                    onClick={() => handleSatinAl(p.id, p.name, p.token, 'robot')}
                  >
                    {acting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Satın Al'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Yükle</CardTitle>
            <CardDescription>MVP: Direkt bakiye artırılır (ödeme entegrasyonu sonra)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {(data?.tokenYukle ?? []).map((t) => (
                <div key={t.miktar} className="rounded-lg border p-4">
                  <p className="font-semibold">{t.miktar} token</p>
                  <p className="text-sm text-muted-foreground">${t.fiyat}</p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    size="sm"
                    disabled={!!acting}
                    onClick={() => handleYukle(t.miktar)}
                  >
                    {acting === `yukle-${t.miktar}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yükle'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {data?.purchases && data.purchases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Satın Alma Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.purchases.map((p) => (
                  <div key={p.id} className="flex justify-between py-2 border-b last:border-0">
                    <span>{p.item_name ?? p.product_name ?? p.id}</span>
                    <span className="text-muted-foreground">{p.token_cost ?? 0} token</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
