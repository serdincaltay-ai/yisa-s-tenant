'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import type { MarketProductRow } from '@/app/api/franchise/market/route'
import type { StockMovementRow } from '@/app/api/franchise/market/stok-hareketleri/route'

const KATEGORILER = ['icecek', 'gida', 'ekipman', 'aksesuar'] as const
const KATEGORI_LABEL: Record<string, string> = { icecek: 'İçecek', gida: 'Gıda', ekipman: 'Ekipman', aksesuar: 'Aksesuar' }

export default function MarketPage() {
  const [tab, setTab] = useState<'urunler' | 'hareketler' | 'satis'>('urunler')
  const [products, setProducts] = useState<MarketProductRow[]>([])
  const [movements, setMovements] = useState<StockMovementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    kategori: 'gida' as (typeof KATEGORILER)[number],
    urun_adi: '',
    barkod: '',
    stok_miktari: 0,
    satis_fiyati: 0,
    alis_fiyati: '',
  })

  const [satisProductId, setSatisProductId] = useState('')
  const [satisMiktar, setSatisMiktar] = useState(1)
  const [satisMusteriId, setSatisMusteriId] = useState('')
  const [satisLoading, setSatisLoading] = useState(false)
  const [kategoriFilter, setKategoriFilter] = useState<string>('')

  const fetchProducts = useCallback(async () => {
    const url = kategoriFilter ? `/api/franchise/market?kategori=${encodeURIComponent(kategoriFilter)}` : '/api/franchise/market'
    const res = await fetch(url)
    const data = (await res.json()) as { items?: MarketProductRow[] }
    setProducts(Array.isArray(data?.items) ? data.items : [])
  }, [kategoriFilter])

  const fetchMovements = useCallback(async () => {
    const res = await fetch('/api/franchise/market/stok-hareketleri?son_gun=30')
    const data = (await res.json()) as { items?: StockMovementRow[] }
    setMovements(Array.isArray(data?.items) ? data.items : [])
  }, [])

  useEffect(() => {
    setLoading(true)
    if (tab === 'urunler') fetchProducts().finally(() => setLoading(false))
    else if (tab === 'hareketler') fetchMovements().finally(() => setLoading(false))
    else setLoading(false)
  }, [tab, fetchProducts, fetchMovements])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleCreateProduct = async () => {
    if (!form.urun_adi.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori: form.kategori,
          urun_adi: form.urun_adi.trim(),
          barkod: form.barkod.trim() || null,
          stok_miktari: form.stok_miktari,
          satis_fiyati: form.satis_fiyati,
          alis_fiyati: form.alis_fiyati === '' ? null : parseFloat(form.alis_fiyati),
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        setNewProductOpen(false)
        setForm({ kategori: 'gida', urun_adi: '', barkod: '', stok_miktari: 0, satis_fiyati: 0, alis_fiyati: '' })
        fetchProducts()
        setToast({ message: 'Ürün eklendi', type: 'success' })
      } else setToast({ message: data?.error ?? 'Kayıt başarısız', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSatis = async () => {
    if (!satisProductId || satisMiktar < 1) return
    setSatisLoading(true)
    try {
      const res = await fetch('/api/franchise/market/satis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: satisProductId,
          miktar: satisMiktar,
          musteri_id: satisMusteriId.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; toplam_tutar?: number; error?: string }
      if (data?.ok) {
        setSatisProductId('')
        setSatisMiktar(1)
        setSatisMusteriId('')
        fetchProducts()
        fetchMovements()
        setToast({ message: `Satış tamamlandı: ${(data.toplam_tutar ?? 0).toLocaleString('tr-TR')} ₺`, type: 'success' })
      } else setToast({ message: data?.error ?? 'Satış başarısız', type: 'error' })
    } finally {
      setSatisLoading(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === satisProductId)
  const stokYeterli = selectedProduct ? selectedProduct.stok_miktari >= satisMiktar : false

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-zinc-100">Market</h1>
      </header>

      <div className="p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
          <TabsList className="bg-zinc-800/80">
            <TabsTrigger value="urunler" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Ürünler</TabsTrigger>
            <TabsTrigger value="hareketler" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Stok Hareketleri</TabsTrigger>
            <TabsTrigger value="satis" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Satış Yap</TabsTrigger>
          </TabsList>

          <TabsContent value="urunler" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
              >
                <option value="">Tüm kategoriler</option>
                {KATEGORILER.map((k) => (
                  <option key={k} value={k}>{KATEGORI_LABEL[k] ?? k}</option>
                ))}
              </select>
              <Button size="sm" onClick={() => setNewProductOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Ürün
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
            ) : (
              <Card className="border-zinc-700 bg-zinc-900">
                <CardHeader>
                  <CardTitle>Ürün listesi</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                        <TableHead className="text-zinc-300">Ürün</TableHead>
                        <TableHead className="text-zinc-300">Kategori</TableHead>
                        <TableHead className="text-right text-zinc-300">Stok</TableHead>
                        <TableHead className="text-right text-zinc-300">Fiyat</TableHead>
                        <TableHead className="text-zinc-300">Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id} className="border-zinc-700 hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-zinc-100">{p.urun_adi}</TableCell>
                          <TableCell className="text-zinc-400">{KATEGORI_LABEL[p.kategori] ?? p.kategori}</TableCell>
                          <TableCell className="text-right text-zinc-300">{p.stok_miktari}</TableCell>
                          <TableCell className="text-right text-cyan-400">{Number(p.satis_fiyati).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</TableCell>
                          <TableCell className="text-zinc-400">{p.is_active ? 'Aktif' : 'Pasif'}</TableCell>
                        </TableRow>
                      ))}
                      {products.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-zinc-500">Ürün yok</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hareketler" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
            ) : (
              <Card className="border-zinc-700 bg-zinc-900">
                <CardHeader>
                  <CardTitle>Stok hareketleri (son 30 gün)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                        <TableHead className="text-zinc-300">Tarih</TableHead>
                        <TableHead className="text-zinc-300">Ürün</TableHead>
                        <TableHead className="text-zinc-300">Tip</TableHead>
                        <TableHead className="text-right text-zinc-300">Miktar</TableHead>
                        <TableHead className="text-right text-zinc-300">Tutar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((m) => (
                        <TableRow key={m.id} className="border-zinc-700 hover:bg-zinc-800/50">
                          <TableCell className="text-zinc-400">{new Date(m.created_at).toLocaleString('tr-TR')}</TableCell>
                          <TableCell className="text-zinc-100">{m.urun_adi}</TableCell>
                          <TableCell className="text-zinc-400">{m.hareket_tipi}</TableCell>
                          <TableCell className="text-right text-zinc-300">{m.miktar}</TableCell>
                          <TableCell className="text-right text-cyan-400">{m.toplam_tutar != null ? m.toplam_tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '—'}</TableCell>
                        </TableRow>
                      ))}
                      {movements.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-zinc-500">Hareket yok</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="satis" className="mt-4">
            <Card className="border-zinc-700 bg-zinc-900 max-w-md">
              <CardHeader>
                <CardTitle>Satış yap</CardTitle>
                <CardDescription>Ürün seçin, miktar ve isteğe bağlı müşteri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-300">Ürün</Label>
                  <select
                    className="mt-1 w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                    value={satisProductId}
                    onChange={(e) => setSatisProductId(e.target.value)}
                  >
                    <option value="">Seçin</option>
                    {products.filter((p) => p.is_active).map((p) => (
                      <option key={p.id} value={p.id}>{p.urun_adi} (Stok: {p.stok_miktari})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-zinc-300">Miktar</Label>
                  <Input
                    type="number"
                    min={1}
                    className="mt-1 border-zinc-600 bg-zinc-800 text-zinc-100"
                    value={satisMiktar}
                    onChange={(e) => setSatisMiktar(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Müşteri ID (opsiyonel)</Label>
                  <Input
                    className="mt-1 border-zinc-600 bg-zinc-800 text-zinc-100"
                    value={satisMusteriId}
                    onChange={(e) => setSatisMusteriId(e.target.value)}
                    placeholder="UUID veya boş bırakın"
                  />
                </div>
                {selectedProduct && (
                  <p className="text-sm text-zinc-400">
                    Toplam: {(selectedProduct.satis_fiyati * satisMiktar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    {!stokYeterli && <span className="text-destructive ml-2">Yetersiz stok</span>}
                  </p>
                )}
                <Button onClick={handleSatis} disabled={!satisProductId || satisMiktar < 1 || !stokYeterli || satisLoading}>
                  {satisLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Satış Yap
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
        <DialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Yeni ürün</DialogTitle>
            <DialogDescription className="text-zinc-400">Kategori, ad, stok ve fiyat</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-300">Kategori</Label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                value={form.kategori}
                onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value as (typeof KATEGORILER)[number] }))}
              >
                {KATEGORILER.map((k) => (
                  <option key={k} value={k}>{KATEGORI_LABEL[k] ?? k}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-zinc-300">Ürün adı *</Label>
              <Input className="mt-1 border-zinc-600 bg-zinc-800" value={form.urun_adi} onChange={(e) => setForm((f) => ({ ...f, urun_adi: e.target.value }))} placeholder="Örn. Protein Bar" />
            </div>
            <div>
              <Label className="text-zinc-300">Barkod</Label>
              <Input className="mt-1 border-zinc-600 bg-zinc-800" value={form.barkod} onChange={(e) => setForm((f) => ({ ...f, barkod: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-zinc-300">Stok</Label>
                <Input type="number" min={0} className="mt-1 border-zinc-600 bg-zinc-800" value={form.stok_miktari} onChange={(e) => setForm((f) => ({ ...f, stok_miktari: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div>
                <Label className="text-zinc-300">Satış fiyatı (₺)</Label>
                <Input type="number" min={0} step={0.01} className="mt-1 border-zinc-600 bg-zinc-800" value={form.satis_fiyati} onChange={(e) => setForm((f) => ({ ...f, satis_fiyati: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300">Alış fiyatı (₺, opsiyonel)</Label>
              <Input type="number" min={0} step={0.01} className="mt-1 border-zinc-600 bg-zinc-800" value={form.alis_fiyati} onChange={(e) => setForm((f) => ({ ...f, alis_fiyati: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProductOpen(false)}>İptal</Button>
            <Button onClick={handleCreateProduct} disabled={saving || !form.urun_adi.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${toast.type === 'success' ? 'bg-green-600/90' : 'bg-destructive/90'} text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
