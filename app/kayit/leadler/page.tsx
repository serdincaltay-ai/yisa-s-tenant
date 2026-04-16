'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react'

type LeadStatus = 'yeni' | 'iletisimde' | 'demo_yapildi' | 'kazanildi' | 'kaybedildi'

interface LeadItem {
  id: string
  ad_soyad: string
  telefon: string | null
  email: string | null
  kaynak: string | null
  notlar: string | null
  durum: LeadStatus
  created_at: string
}

const STATUS_OPTIONS: LeadStatus[] = ['yeni', 'iletisimde', 'demo_yapildi', 'kazanildi', 'kaybedildi']

export default function KayitLeadlerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<LeadItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    ad_soyad: '',
    telefon: '',
    email: '',
    kaynak: 'manuel',
    notlar: '',
  })

  const durumOzet = useMemo(
    () =>
      STATUS_OPTIONS.map((s) => ({
        status: s,
        count: items.filter((i) => i.durum === s).length,
      })),
    [items]
  )

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/kayit/leads')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lead listesi alınamadı')
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/kayit/leadler')
        return
      }
      await load()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleCreate = async () => {
    if (!form.ad_soyad.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/kayit/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lead kaydı oluşturulamadı')
      setForm({ ad_soyad: '', telefon: '', email: '', kaynak: 'manuel', notlar: '' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (id: string, durum: LeadStatus) => {
    try {
      const res = await fetch('/api/kayit/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, durum }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Durum güncellenemedi')
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, durum } : item)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Lead Havuzu</h1>
            <p className="text-sm text-muted-foreground">Potansiyel veli/sporcu kayıtlarını yönetin.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/kayit/deneme-talepleri">Deneme Talepleri</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/kayit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kayıt Ekranı
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Yeni Lead Ekle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ad Soyad *</Label>
              <Input value={form.ad_soyad} onChange={(e) => setForm((p) => ({ ...p, ad_soyad: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={form.telefon} onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Kaynak</Label>
              <Input value={form.kaynak} onChange={(e) => setForm((p) => ({ ...p, kaynak: e.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notlar</Label>
              <Input value={form.notlar} onChange={(e) => setForm((p) => ({ ...p, notlar: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreate} disabled={saving || !form.ad_soyad.trim()}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                Lead Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {durumOzet.map((d) => (
            <Badge key={d.status} variant="outline">{d.status}: {d.count}</Badge>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lead Listesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz lead yok.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.ad_soyad}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.telefon || '—'} · {item.email || '—'} · {item.kaynak || '—'}
                    </p>
                    {item.notlar && <p className="text-xs text-muted-foreground mt-1">{item.notlar}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={item.durum}
                      onChange={(e) => handleStatusUpdate(item.id, e.target.value as LeadStatus)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/kayit/deneme-talepleri?lead_id=${item.id}`}>Deneme Talebi Aç</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
