'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, ArrowLeft, Pencil, Trash2, Power, PowerOff } from 'lucide-react'

type RecurringExpense = {
  id: string
  tenant_id: string
  title: string
  category: string
  amount: number
  currency: string
  frequency: string
  due_day: number
  start_date: string
  end_date: string | null
  is_active: boolean
  last_generated_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: 'kira', label: 'Kira' },
  { value: 'elektrik', label: 'Elektrik' },
  { value: 'su', label: 'Su' },
  { value: 'dogalgaz', label: 'Doğalgaz' },
  { value: 'internet', label: 'İnternet' },
  { value: 'sigorta', label: 'Sigorta' },
  { value: 'personel', label: 'Personel' },
  { value: 'diger', label: 'Diğer' },
] as const

const FREQUENCIES = [
  { value: 'monthly', label: 'Aylık' },
  { value: 'quarterly', label: 'Üç Aylık' },
  { value: 'yearly', label: 'Yıllık' },
] as const

const categoryLabel = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.label ?? cat
const frequencyLabel = (freq: string) => FREQUENCIES.find((f) => f.value === freq)?.label ?? freq

const categoryColor = (cat: string) => {
  const colors: Record<string, string> = {
    kira: 'bg-blue-500/20 text-blue-700',
    elektrik: 'bg-yellow-500/20 text-yellow-700',
    su: 'bg-cyan-500/20 text-cyan-700',
    dogalgaz: 'bg-orange-500/20 text-orange-700',
    internet: 'bg-purple-500/20 text-purple-700',
    sigorta: 'bg-green-500/20 text-green-700',
    personel: 'bg-pink-500/20 text-pink-700',
    diger: 'bg-gray-500/20 text-gray-700',
  }
  return colors[cat] ?? 'bg-gray-500/20 text-gray-700'
}

type FormState = {
  title: string
  category: string
  amount: string
  currency: string
  frequency: string
  due_day: string
  start_date: string
  end_date: string
  notes: string
}

const emptyForm: FormState = {
  title: '',
  category: 'kira',
  amount: '',
  currency: 'TRY',
  frequency: 'monthly',
  due_day: '1',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  notes: '',
}

export default function SabitOdemelerPage() {
  const [items, setItems] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [sending, setSending] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const url = showAll ? '/api/franchise/recurring-expenses?active=false' : '/api/franchise/recurring-expenses'
      const res = await fetch(url)
      const data = await res.json()
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [showAll])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openCreateForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEditForm = (item: RecurringExpense) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      category: item.category,
      amount: String(item.amount),
      currency: item.currency,
      frequency: item.frequency,
      due_day: String(item.due_day),
      start_date: item.start_date,
      end_date: item.end_date ?? '',
      notes: item.notes ?? '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setSending(true)

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        title: form.title,
        category: form.category,
        amount: parseFloat(form.amount),
        currency: form.currency,
        frequency: form.frequency,
        due_day: parseInt(form.due_day, 10),
        start_date: form.start_date,
        end_date: form.end_date || null,
        notes: form.notes || null,
      }

      const res = await fetch('/api/franchise/recurring-expenses', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data?.ok) {
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
        fetchItems()
      } else {
        alert(data?.error ?? 'İşlem başarısız')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const handleToggleActive = async (item: RecurringExpense) => {
    if (sending) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/recurring-expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
      })
      const data = await res.json()
      if (data?.ok) fetchItems()
      else alert(data?.error ?? 'Güncelleme başarısız')
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu sabit ödemeyi silmek istediğinize emin misiniz?')) return
    if (sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/franchise/recurring-expenses?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data?.ok) fetchItems()
      else alert(data?.error ?? 'Silme başarısız')
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const totalMonthly = items
    .filter((i) => i.is_active)
    .reduce((sum, i) => {
      if (i.frequency === 'monthly') return sum + Number(i.amount)
      if (i.frequency === 'quarterly') return sum + Number(i.amount) / 3
      if (i.frequency === 'yearly') return sum + Number(i.amount) / 12
      return sum
    }, 0)

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
        <h1 className="text-2xl font-bold text-foreground">Sabit Ödemeler</h1>
        <p className="text-muted-foreground">Kira, faturalar ve diğer tekrarlayan giderlerinizi yönetin</p>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktif Sabit Ödeme</CardDescription>
            <CardTitle className="text-3xl">{items.filter((i) => i.is_active).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aylık Tahmini Gider</CardDescription>
            <CardTitle className="text-3xl">{totalMonthly.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Kayıt</CardDescription>
            <CardTitle className="text-3xl">{items.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Sabit Ödeme
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Sadece Aktifler' : 'Tümünü Göster'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Sabit Ödeme Düzenle' : 'Yeni Sabit Ödeme Ekle'}</CardTitle>
            <CardDescription>Tekrarlayan gider bilgilerini girin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Başlık</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Örneğin: Tesis Kirası"
                  required
                />
              </div>
              <div>
                <Label>Kategori</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tutar</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Para Birimi</Label>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                />
              </div>
              <div>
                <Label>Tekrar Sıklığı</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Ödeme Günü (1-28)</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.due_day}
                  onChange={(e) => setForm((f) => ({ ...f, due_day: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Bitiş Tarihi (opsiyonel)</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Notlar</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Opsiyonel açıklama"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit" disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Güncelle' : 'Kaydet'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Henüz sabit ödeme kaydı yok. Yeni sabit ödeme ekleyin.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-muted-foreground text-sm">Başlık</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm">Kategori</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm">Tutar</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm">Sıklık</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm">Ödeme Günü</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm">Durum</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm">Son Üretim</th>
                  <th className="px-4 py-3 text-muted-foreground text-sm">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={`border-b hover:bg-muted/50 ${!item.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td className="px-4 py-3">
                      <Badge className={categoryColor(item.category)}>{categoryLabel(item.category)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {Number(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {item.currency}
                    </td>
                    <td className="px-4 py-3">{frequencyLabel(item.frequency)}</td>
                    <td className="px-4 py-3">Her ay {item.due_day}.</td>
                    <td className="px-4 py-3">
                      {item.is_active
                        ? <Badge className="bg-green-500/20 text-green-600">Aktif</Badge>
                        : <Badge variant="secondary">Pasif</Badge>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.last_generated_date ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditForm(item)} title="Düzenle">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(item)}
                          title={item.is_active ? 'Pasife Al' : 'Aktif Et'}
                        >
                          {item.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)} title="Sil">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
