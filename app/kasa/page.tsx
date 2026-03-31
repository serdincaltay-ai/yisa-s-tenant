'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Plus, TrendingUp, TrendingDown } from 'lucide-react'

const KATEGORI_LABEL: Record<string, string> = {
  aidat: 'Aidat',
  ders_ucreti: 'Ders Ücreti',
  kira: 'Kira',
  maas: 'Maaş',
  malzeme: 'Malzeme',
  diger: 'Diğer',
}

const ODEME_LABEL: Record<string, string> = {
  nakit: 'Nakit',
  havale: 'Havale',
  kart: 'Kart',
}

type Kayit = {
  id: string
  tarih: string
  tur: string
  kategori: string
  aciklama?: string
  tutar: number
  odeme_yontemi: string
}

type BugunOzet = { toplamGelir: number; toplamGider: number; net: number; tarih: string }

export default function KasaPage() {
  const [items, setItems] = useState<Kayit[]>([])
  const [bugunOzet, setBugunOzet] = useState<BugunOzet | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [tur, setTur] = useState('')
  const [kategori, setKategori] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ tur: 'gelir', kategori: 'aidat', aciklama: '', tutar: '', odeme_yontemi: 'nakit', tarih: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (tur) params.set('tur', tur)
    if (kategori) params.set('kategori', kategori)
    fetch(`/api/franchise/kasa?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? [])
        setBugunOzet(d.bugunOzet ?? null)
      })
      .catch(() => {
        setItems([])
        setBugunOzet(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [from, to, tur, kategori])

  const handleKaydet = async () => {
    const tutar = parseFloat(form.tutar.replace(',', '.'))
    if (!tutar || tutar <= 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/kasa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tur: form.tur,
          kategori: form.kategori,
          aciklama: form.aciklama,
          tutar,
          odeme_yontemi: form.odeme_yontemi,
          tarih: form.tarih,
        }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        setModalOpen(false)
        setForm({ tur: 'gelir', kategori: 'aidat', aciklama: '', tutar: '', odeme_yontemi: 'nakit', tarih: new Date().toISOString().slice(0, 10) })
        fetchData()
      } else {
        alert(j.error ?? 'Kaydetme başarısız')
      }
    } catch {
      alert('Kaydetme başarısız')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kasa Defteri</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kayıt
        </Button>
      </div>

      {bugunOzet && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-green-600 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                Bugün Gelir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{bugunOzet.toplamGelir.toLocaleString('tr-TR')} ₺</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400">
                <TrendingDown className="h-5 w-5" />
                Bugün Gider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{bugunOzet.toplamGider.toLocaleString('tr-TR')} ₺</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5" />
                Bugün Net
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${bugunOzet.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {bugunOzet.net.toLocaleString('tr-TR')} ₺
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kayıtlar</CardTitle>
          <CardDescription>Filtreler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Başlangıç</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="ml-2 rounded border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bitiş</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="ml-2 rounded border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tür</label>
              <select value={tur} onChange={(e) => setTur(e.target.value)} className="ml-2 rounded border border-input bg-background px-2 py-1 text-sm">
                <option value="">Tümü</option>
                <option value="gelir">Gelir</option>
                <option value="gider">Gider</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Kategori</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="ml-2 rounded border border-input bg-background px-2 py-1 text-sm">
                <option value="">Tümü</option>
                {Object.entries(KATEGORI_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Tarih</th>
                    <th className="text-left py-2 px-2">Tür</th>
                    <th className="text-left py-2 px-2">Kategori</th>
                    <th className="text-left py-2 px-2">Açıklama</th>
                    <th className="text-right py-2 px-2">Tutar</th>
                    <th className="text-left py-2 px-2">Ödeme</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 px-2">{r.tarih}</td>
                      <td className="py-2 px-2">
                        <Badge variant={r.tur === 'gelir' ? 'default' : 'destructive'} className={r.tur === 'gelir' ? 'bg-green-600' : ''}>
                          {r.tur === 'gelir' ? 'Gelir' : 'Gider'}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">{KATEGORI_LABEL[r.kategori] ?? r.kategori}</td>
                      <td className="py-2 px-2 max-w-[200px] truncate">{r.aciklama || '—'}</td>
                      <td className="py-2 px-2 text-right font-medium">{Number(r.tutar).toLocaleString('tr-TR')} ₺</td>
                      <td className="py-2 px-2">{ODEME_LABEL[r.odeme_yontemi] ?? r.odeme_yontemi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && <p className="py-8 text-center text-muted-foreground">Kayıt yok.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !saving && setModalOpen(false)}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Yeni Kasa Kaydı</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Tür</label>
                <select value={form.tur} onChange={(e) => setForm((f) => ({ ...f, tur: e.target.value }))} className="w-full mt-1 rounded border border-input bg-background px-3 py-2">
                  <option value="gelir">Gelir</option>
                  <option value="gider">Gider</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Kategori</label>
                <select value={form.kategori} onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))} className="w-full mt-1 rounded border border-input bg-background px-3 py-2">
                  {Object.entries(KATEGORI_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Açıklama</label>
                <input value={form.aciklama} onChange={(e) => setForm((f) => ({ ...f, aciklama: e.target.value }))} placeholder="Açıklama" className="w-full mt-1 rounded border border-input bg-background px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tutar</label>
                <input type="number" step="0.01" value={form.tutar} onChange={(e) => setForm((f) => ({ ...f, tutar: e.target.value }))} placeholder="0" className="w-full mt-1 rounded border border-input bg-background px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ödeme Yöntemi</label>
                <select value={form.odeme_yontemi} onChange={(e) => setForm((f) => ({ ...f, odeme_yontemi: e.target.value }))} className="w-full mt-1 rounded border border-input bg-background px-3 py-2">
                  {Object.entries(ODEME_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tarih</label>
                <input type="date" value={form.tarih} onChange={(e) => setForm((f) => ({ ...f, tarih: e.target.value }))} className="w-full mt-1 rounded border border-input bg-background px-3 py-2" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleKaydet} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
              <Button variant="outline" onClick={() => !saving && setModalOpen(false)}>İptal</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
