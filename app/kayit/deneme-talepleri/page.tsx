'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TrialStatus = 'bekliyor' | 'onaylandi' | 'tamamlandi' | 'iptal'

interface TrialRequestItem {
  id: string
  cocuk_adi: string
  cocuk_yasi: number | null
  veli_adi: string
  veli_telefon: string
  brans: string | null
  tercih_gun: string | null
  tercih_saat: string | null
  durum: TrialStatus
  notlar: string | null
  created_at: string
}

const STATUS_OPTIONS: TrialStatus[] = ['bekliyor', 'onaylandi', 'tamamlandi', 'iptal']

export default function TrialRequestsPage() {
  const [items, setItems] = useState<TrialRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    cocuk_adi: '',
    cocuk_yasi: '',
    veli_adi: '',
    veli_telefon: '',
    brans: '',
    tercih_gun: '',
    tercih_saat: '',
    notlar: '',
  })

  const stats = useMemo(() => {
    return {
      toplam: items.length,
      bekliyor: items.filter((x) => x.durum === 'bekliyor').length,
      onaylandi: items.filter((x) => x.durum === 'onaylandi').length,
      tamamlandi: items.filter((x) => x.durum === 'tamamlandi').length,
    }
  }, [items])

  async function fetchItems() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/kayit/trial-requests', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Liste alınamadı')
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  async function createItem() {
    if (!newItem.cocuk_adi.trim() || !newItem.veli_adi.trim() || !newItem.veli_telefon.trim()) {
      setError('Çocuk adı, veli adı ve veli telefonu zorunludur.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/kayit/trial-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cocuk_adi: newItem.cocuk_adi.trim(),
          cocuk_yasi: newItem.cocuk_yasi ? Number(newItem.cocuk_yasi) : null,
          veli_adi: newItem.veli_adi.trim(),
          veli_telefon: newItem.veli_telefon.trim(),
          brans: newItem.brans.trim() || null,
          tercih_gun: newItem.tercih_gun.trim() || null,
          tercih_saat: newItem.tercih_saat.trim() || null,
          notlar: newItem.notlar.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Kayıt başarısız')
      setItems((prev) => [data.item as TrialRequestItem, ...prev])
      setNewItem({
        cocuk_adi: '',
        cocuk_yasi: '',
        veli_adi: '',
        veli_telefon: '',
        brans: '',
        tercih_gun: '',
        tercih_saat: '',
        notlar: '',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id: string, durum: TrialStatus) {
    try {
      const res = await fetch('/api/kayit/trial-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, durum }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Durum güncellenemedi')
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, durum } : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Deneme Dersi Talepleri</h1>
        <p className="text-sm text-muted-foreground">Trial request oluştur, takip et ve sonuçlandır.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Toplam</p><p className="text-2xl font-bold">{stats.toplam}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Bekliyor</p><p className="text-2xl font-bold">{stats.bekliyor}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Onaylı</p><p className="text-2xl font-bold">{stats.onaylandi}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tamamlandı</p><p className="text-2xl font-bold">{stats.tamamlandi}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Yeni Deneme Talebi</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div><Label>Çocuk Adı *</Label><Input value={newItem.cocuk_adi} onChange={(e) => setNewItem((p) => ({ ...p, cocuk_adi: e.target.value }))} /></div>
          <div><Label>Çocuk Yaşı</Label><Input type="number" value={newItem.cocuk_yasi} onChange={(e) => setNewItem((p) => ({ ...p, cocuk_yasi: e.target.value }))} /></div>
          <div><Label>Branş</Label><Input value={newItem.brans} onChange={(e) => setNewItem((p) => ({ ...p, brans: e.target.value }))} /></div>
          <div><Label>Veli Adı *</Label><Input value={newItem.veli_adi} onChange={(e) => setNewItem((p) => ({ ...p, veli_adi: e.target.value }))} /></div>
          <div><Label>Veli Telefon *</Label><Input value={newItem.veli_telefon} onChange={(e) => setNewItem((p) => ({ ...p, veli_telefon: e.target.value }))} /></div>
          <div><Label>Tercih Gün</Label><Input value={newItem.tercih_gun} onChange={(e) => setNewItem((p) => ({ ...p, tercih_gun: e.target.value }))} /></div>
          <div><Label>Tercih Saat</Label><Input value={newItem.tercih_saat} onChange={(e) => setNewItem((p) => ({ ...p, tercih_saat: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Notlar</Label><Input value={newItem.notlar} onChange={(e) => setNewItem((p) => ({ ...p, notlar: e.target.value }))} /></div>
          <div className="flex items-end"><Button disabled={saving} onClick={createItem}>{saving ? 'Kaydediliyor...' : 'Talep Oluştur'}</Button></div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader><CardTitle>Talep Listesi</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kayıt yok.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.cocuk_adi} {item.cocuk_yasi ? `(${item.cocuk_yasi})` : ''}</p>
                      <p className="text-xs text-muted-foreground">
                        Veli: {item.veli_adi} · {item.veli_telefon}
                        {item.brans ? ` · Branş: ${item.brans}` : ''}
                      </p>
                    </div>
                    <select
                      value={item.durum}
                      onChange={(e) => updateStatus(item.id, e.target.value as TrialStatus)}
                      className="h-9 rounded border px-2 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
