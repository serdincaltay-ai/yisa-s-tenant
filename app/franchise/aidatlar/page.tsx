'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, ArrowLeft, Bell, CheckSquare, Square, CreditCard } from 'lucide-react'

type Athlete = { id: string; name: string; surname?: string | null }
type PaymentItem = {
  id: string
  athlete_id: string
  athlete_name: string
  amount: number
  payment_type: string
  period_month?: number | null
  period_year?: number | null
  due_date?: string | null
  paid_date?: string | null
  status: string
  payment_method?: string | null
  notes?: string | null
  created_at: string
}

export default function FranchiseAidatlarPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [hasTenant, setHasTenant] = useState(false)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    athlete_id: '',
    amount: '',
    payment_type: 'aidat',
    due_date: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    payment_method: '' as '' | 'nakit' | 'kart' | 'havale' | 'eft',
    notes: '',
  })
  const [markPaidMethod, setMarkPaidMethod] = useState<'nakit' | 'kart' | 'havale' | 'eft'>('nakit')
  const [bulkForm, setBulkForm] = useState({
    amount: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [remindLoading, setRemindLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const fetchTenantAndAthletes = useCallback(async () => {
    const [tenantRes, athletesRes] = await Promise.all([
      fetch('/api/franchise/tenant'),
      fetch('/api/franchise/athletes'),
    ])
    const tenantData = await tenantRes.json()
    const athletesData = await athletesRes.json()
    setHasTenant(!!tenantData?.tenant?.id)
    setAthletes(Array.isArray(athletesData.items) ? athletesData.items : [])
  }, [])

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const url = filter === 'all' ? '/api/franchise/payments' : `/api/franchise/payments?status=${filter}`
    const res = await fetch(url)
    const data = await res.json()
    setPayments(Array.isArray(data?.items) ? data.items : [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchTenantAndAthletes()
  }, [fetchTenantAndAthletes])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.athlete_id || !form.amount || sending || !hasTenant) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: form.athlete_id,
          amount: parseFloat(form.amount),
          payment_type: form.payment_type,
          due_date: form.due_date || undefined,
          period_month: form.period_month,
          period_year: form.period_year,
          payment_method: form.payment_method || undefined,
          notes: form.notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        setForm({
          athlete_id: '',
          amount: '',
          payment_type: 'aidat',
          due_date: '',
          period_month: new Date().getMonth() + 1,
          period_year: new Date().getFullYear(),
          payment_method: '',
          notes: '',
        })
        setShowForm(false)
        fetchPayments()
      } else {
        alert(data?.error ?? 'Kayıt başarısız')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkForm.amount || sending || !hasTenant) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, amount: parseFloat(bulkForm.amount), period_month: bulkForm.period_month, period_year: bulkForm.period_year }),
      })
      const data = await res.json()
      if (data?.ok) {
        setShowBulk(false)
        fetchPayments()
        alert(data?.message ?? 'Aidatlar oluşturuldu')
      } else {
        alert(data?.error ?? 'İşlem başarısız')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    if (sending) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'paid', payment_method: markPaidMethod }),
      })
      const data = await res.json()
      if (data?.ok) {
        fetchPayments()
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
      } else alert(data?.error ?? 'Güncelleme başarısız')
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    const pendingOrOverdue = payments.filter((p) => p.status === 'pending' || p.status === 'overdue')
    if (selectedIds.size >= pendingOrOverdue.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingOrOverdue.map((p) => p.id)))
    }
  }

  const handleBulkMarkPaid = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0 || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, ids, status: 'paid', payment_method: markPaidMethod }),
      })
      const data = await res.json()
      if (data?.ok) {
        fetchPayments()
        setSelectedIds(new Set())
        alert(data?.message ?? `${data?.count ?? ids.length} kayıt ödendi yapıldı`)
      } else alert(data?.error ?? 'Toplu güncelleme başarısız')
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const handleRemind = async (paymentIds?: string[]) => {
    if (remindLoading) return
    setRemindLoading(true)
    try {
      const res = await fetch('/api/franchise/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_ids: paymentIds ?? [] }),
      })
      const data = await res.json()
      if (data?.ok) {
        alert(data?.message ?? 'Hatırlatma tetiklendi. app-yisa-s SMS/aidat-reminder API çağrıldı.')
      } else {
        alert(data?.error ?? 'Hatırlatma gönderilemedi')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setRemindLoading(false)
    }
  }

  const handleStripeCheckout = async (overrideIds?: string[]) => {
    const ids = overrideIds ?? Array.from(selectedIds)
    if (ids.length === 0) {
      alert('Lütfen online ödeme yapılacak aidatları seçin.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_ids: ids }),
      })
      const data = await res.json()
      if (data?.url) {
        window.open(data.url, '_blank')
      } else {
        alert(data?.error ?? 'Stripe checkout oluşturulamadı')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const statusBadge = (s: string) => {
    if (s === 'paid') return <Badge className="bg-green-500/20 text-green-600">Ödendi</Badge>
    if (s === 'overdue') return <Badge className="bg-red-500/20 text-red-600">Gecikmiş</Badge>
    if (s === 'cancelled') return <Badge variant="secondary">İptal</Badge>
    return <Badge className="bg-amber-500/20 text-amber-600">Bekliyor</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tesis paneline dön
          </Link>
        </Button>
      </div>

      <header>
        <h1 className="text-2xl font-bold text-foreground">Aidat Yönetimi</h1>
        <p className="text-muted-foreground">Hatırlatma, liste, toplu düzenleme — Üye aidatları ve ödeme geçmişi</p>
      </header>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">Ödeme türleri:</strong> Nakit kayıtta yasal kesinti yoktur; kart ve havale/EFT
            işlemlerinde banka/ödeme kuruluşu kesintileri dekontta veya not alanında belirtilmelidir.
          </p>
          <p>Veli taksit tarihini veli panelinden seçebilir (ayrı modül). Son ödeme tarihi alanı tesis tarafı vade takibi içindir.</p>
        </CardContent>
      </Card>

      {!hasTenant && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Aidat işlemleri için önce tesis atanması gerekiyor. Patron onayından sonra kullanabilirsiniz.
          </CardContent>
        </Card>
      )}

      {hasTenant && (
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant="outline" onClick={() => setShowBulk(!showBulk)}>Toplu Aidat Oluştur</Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />Yeni Ödeme</Button>
          <Button size="sm" variant="outline" onClick={() => handleRemind()} disabled={remindLoading} title="Bekleyen ve gecikmiş tüm aidatlar için app-yisa-s hatırlatma tetiklenir">
            {remindLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="mr-2 h-4 w-4" />}
            Hatırlatma gönder (tümü)
          </Button>
          <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-700 hover:bg-purple-50" onClick={() => handleStripeCheckout()} disabled={sending || selectedIds.size === 0} title="Seçili bekleyen aidatlar için Stripe ile online ödeme linki oluştur">
            <CreditCard className="mr-2 h-4 w-4" />
            Online Ödeme (Stripe)
          </Button>
        </div>
      )}

      {showBulk && hasTenant && (
        <Card>
          <CardHeader>
            <CardTitle>Toplu Aidat Oluştur</CardTitle>
            <CardDescription>Aktif tüm üyeler için seçilen ay/yıl aidatı</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkCreate} className="flex flex-wrap gap-4 items-end">
              <div><Label>Tutar (TL)</Label><Input type="number" step="0.01" min={0} value={bulkForm.amount} onChange={(e) => setBulkForm((f) => ({ ...f, amount: e.target.value }))} required /></div>
              <div><Label>Ay</Label><Input type="number" min={1} max={12} value={bulkForm.period_month} onChange={(e) => setBulkForm((f) => ({ ...f, period_month: parseInt(e.target.value, 10) }))} /></div>
              <div><Label>Yıl</Label><Input type="number" min={2020} max={2030} value={bulkForm.period_year} onChange={(e) => setBulkForm((f) => ({ ...f, period_year: parseInt(e.target.value, 10) }))} /></div>
              <Button type="submit" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Oluştur'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showForm && hasTenant && (
        <Card>
          <CardHeader><CardTitle>Yeni Ödeme Ekle</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddPayment} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Öğrenci</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" value={form.athlete_id} onChange={(e) => setForm((f) => ({ ...f, athlete_id: e.target.value }))} required>
                  <option value="">Seçin</option>
                  {athletes.map((a) => <option key={a.id} value={a.id}>{a.name} {a.surname ?? ''}</option>)}
                </select>
              </div>
              <div><Label>Tutar (TL)</Label><Input type="number" step="0.01" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required /></div>
              <div><Label>Dönem (Ay/Yıl)</Label><div className="flex gap-2"><Input type="number" min={1} max={12} placeholder="Ay" value={form.period_month} onChange={(e) => setForm((f) => ({ ...f, period_month: parseInt(e.target.value, 10) }))} /><Input type="number" min={2020} max={2030} placeholder="Yıl" value={form.period_year} onChange={(e) => setForm((f) => ({ ...f, period_year: parseInt(e.target.value, 10) }))} /></div></div>
              <div><Label>Son Ödeme Tarihi</Label><Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} /></div>
              <div>
                <Label>Ödeme yöntemi (opsiyonel)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.payment_method}
                  onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value as typeof form.payment_method }))}
                >
                  <option value="">Belirtilmedi</option>
                  <option value="nakit">Nakit</option>
                  <option value="kart">Kart</option>
                  <option value="havale">Havale</option>
                  <option value="eft">EFT</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Not (kesinti / dekont)</Label>
                <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Örn. kart komisyon oranı, havale referansı" />
              </div>
              <div className="md:col-span-2 flex gap-2"><Button type="submit" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {(['all', 'pending', 'paid', 'overdue'] as const).map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : f === 'paid' ? 'Ödendi' : 'Gecikmiş'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : payments.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Henüz ödeme kaydı yok. Yeni ödeme ekleyin veya toplu aidat oluşturun.</CardContent></Card>
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg bg-muted/50 border">
              <span className="text-sm font-medium">{selectedIds.size} kayıt seçili</span>
              <div className="flex items-center gap-2 text-sm">
                <Label className="whitespace-nowrap text-muted-foreground">Toplu ödeme yöntemi</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={markPaidMethod}
                  onChange={(e) => setMarkPaidMethod(e.target.value as typeof markPaidMethod)}
                >
                  <option value="nakit">Nakit</option>
                  <option value="kart">Kart</option>
                  <option value="havale">Havale</option>
                  <option value="eft">EFT</option>
                </select>
              </div>
              <Button size="sm" onClick={handleBulkMarkPaid} disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Seçilenleri ödendi yap'}</Button>
              <Button size="sm" variant="outline" onClick={() => handleRemind(Array.from(selectedIds))} disabled={remindLoading}>{remindLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bell className="h-4 w-4 mr-1" />Seçilenlere hatırlatma</>}</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Seçimi kaldır</Button>
            </div>
          )}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-muted-foreground text-sm w-10">
                      {payments.some((p) => p.status === 'pending' || p.status === 'overdue') && (
                        <button type="button" onClick={toggleSelectAll} className="p-1 rounded hover:bg-muted" title={selectedIds.size > 0 ? 'Seçimi kaldır' : 'Bekleyen/gecikmişleri seç'}>
                          {selectedIds.size > 0 && selectedIds.size >= payments.filter((p) => p.status === 'pending' || p.status === 'overdue').length ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      )}
                    </th>
                    <th className="px-4 py-3 text-muted-foreground text-sm">Öğrenci</th>
                    <th className="px-4 py-3 text-muted-foreground text-sm">Tutar</th>
                    <th className="px-4 py-3 text-muted-foreground text-sm">Dönem</th>
                    <th className="px-4 py-3 text-muted-foreground text-sm">Durum</th>
                    <th className="px-4 py-3 text-muted-foreground text-sm">Ödeme yöntemi</th>
                    <th className="px-4 py-3 text-muted-foreground text-sm">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="px-4 py-3">
                        {(p.status === 'pending' || p.status === 'overdue') && (
                          <button type="button" onClick={() => toggleSelect(p.id)} className="p-1 rounded hover:bg-muted">
                            {selectedIds.has(p.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{p.athlete_name}</td>
                      <td className="px-4 py-3">{p.amount.toLocaleString('tr-TR')} TL</td>
                      <td className="px-4 py-3">{p.period_month}/{p.period_year}</td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {p.payment_method === 'nakit'
                          ? 'Nakit'
                          : p.payment_method === 'kart'
                            ? 'Kart'
                            : p.payment_method === 'havale' || p.payment_method === 'eft'
                              ? 'Havale/EFT'
                              : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'pending' || p.status === 'overdue' ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleMarkPaid(p.id)} disabled={sending}>Ödendi Yap</Button>
                            <Button size="sm" onClick={() => handleStripeCheckout([p.id])} disabled={sending}>
                              <CreditCard className="h-3 w-3 mr-1" />
                              Online Ödeme
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">{p.paid_date ? new Date(p.paid_date).toLocaleDateString('tr-TR') : '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
