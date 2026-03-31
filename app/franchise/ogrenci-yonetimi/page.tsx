'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Plus,
  Search,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  X,
} from 'lucide-react'
import { HizliKayitModal } from '@/components/franchise/HizliKayitModal'

const BRANSLAR = [
  'Artistik Cimnastik',
  'Ritmik Cimnastik',
  'Trampolin',
  'Genel Jimnastik',
  'Temel Hareket Egitimi',
  'Diger',
]

const YAS_GRUPLARI = [
  { label: 'Tumu', min: 0, max: 99 },
  { label: '5-7 yas', min: 5, max: 7 },
  { label: '8-10 yas', min: 8, max: 10 },
  { label: '11-13 yas', min: 11, max: 13 },
  { label: '14+ yas', min: 14, max: 99 },
]

type Athlete = {
  id: string
  name: string
  surname?: string | null
  birth_date?: string | null
  gender?: string | null
  branch?: string | null
  level?: string | null
  status?: string
  parent_name?: string | null
  parent_phone?: string | null
  parent_email?: string | null
  notes?: string | null
  created_at?: string
}

function ageFromBirth(d: string | null | undefined): number | null {
  if (!d) return null
  const diff = new Date().getTime() - new Date(d).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

export default function OgrenciYonetimiPage() {
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter') ?? ''
  const [items, setItems] = useState<Athlete[]>([])
  const [krediFilterIds, setKrediFilterIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [ageGroup, setAgeGroup] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [hizliKayitOpen, setHizliKayitOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Athlete | null>(null)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    name: '', surname: '', birth_date: '', gender: '',
    branch: '', level: '', parent_name: '', parent_phone: '',
    parent_email: '', notes: '',
  })

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (statusFilter) params.set('status', statusFilter)
      if (branchFilter) params.set('branch', branchFilter)
      const res = await fetch(`/api/franchise/athletes?${params}`)
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
      setToast({ message: 'Liste yuklenemedi', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [q, statusFilter, branchFilter])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    if (filterParam !== 'borclu' && filterParam !== 'bitmek-uzere') {
      setKrediFilterIds(new Set())
      return
    }
    fetch('/api/franchise/kredi-ozet?threshold=3')
      .then((r) => r.json())
      .then((data: { borcluHesaplar?: Array<{ id: string }>; bitmekUzere?: Array<{ id: string }> }) => {
        const ids = filterParam === 'borclu'
          ? (data.borcluHesaplar ?? []).map((x) => x.id)
          : (data.bitmekUzere ?? []).map((x) => x.id)
        setKrediFilterIds(new Set(ids))
      })
      .catch(() => setKrediFilterIds(new Set()))
  }, [filterParam])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const filteredByKredi = krediFilterIds.size > 0
    ? items.filter((a) => krediFilterIds.has(a.id))
    : items

  const filteredByAge = filteredByKredi.filter((a) => {
    if (ageGroup === 0) return true
    const age = ageFromBirth(a.birth_date)
    if (age === null) return false
    const g = YAS_GRUPLARI[ageGroup]
    return age >= g.min && age <= g.max
  })

  const openAdd = () => {
    setEditTarget(null)
    setForm({ name: '', surname: '', birth_date: '', gender: '', branch: '', level: '', parent_name: '', parent_phone: '', parent_email: '', notes: '' })
    setShowForm(true)
  }

  const openEdit = (a: Athlete) => {
    setEditTarget(a)
    setForm({
      name: a.name ?? '',
      surname: a.surname ?? '',
      birth_date: a.birth_date ?? '',
      gender: a.gender ?? '',
      branch: a.branch ?? '',
      level: a.level ?? '',
      parent_name: a.parent_name ?? '',
      parent_phone: a.parent_phone ?? '',
      parent_email: a.parent_email ?? '',
      notes: a.notes ?? '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || sending) return
    setSending(true)
    try {
      const url = editTarget ? `/api/franchise/athletes/${editTarget.id}` : '/api/franchise/athletes'
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname || null,
          birth_date: form.birth_date || null,
          gender: form.gender || null,
          branch: form.branch || null,
          level: form.level || null,
          parent_name: form.parent_name || null,
          parent_phone: form.parent_phone || null,
          parent_email: form.parent_email || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setToast({ message: editTarget ? 'Ogrenci guncellendi' : 'Ogrenci eklendi', type: 'success' })
        setShowForm(false)
        fetchList()
      } else {
        setToast({ message: data.error ?? 'Islem basarisiz', type: 'error' })
      }
    } catch {
      setToast({ message: 'Baglanti hatasi', type: 'error' })
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ogrenciyi pasife almak istediginize emin misiniz?')) return
    try {
      const res = await fetch(`/api/franchise/athletes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.ok) {
        setToast({ message: 'Ogrenci pasife alindi', type: 'success' })
        fetchList()
      } else {
        setToast({ message: data.error ?? 'Silme basarisiz', type: 'error' })
      }
    } catch {
      setToast({ message: 'Baglanti hatasi', type: 'error' })
    }
  }

  const statusBadge = (s?: string) => {
    if (s === 'active') return <Badge className="bg-green-500/20 text-green-400">Aktif</Badge>
    if (s === 'inactive') return <Badge className="bg-red-500/20 text-red-400">Pasif</Badge>
    if (s === 'trial') return <Badge className="bg-amber-500/20 text-amber-400">Deneme</Badge>
    return <Badge className="bg-zinc-500/20 text-zinc-400">{s ?? '—'}</Badge>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
          <Link href="/franchise"><ArrowLeft className="h-4 w-4 mr-1" />Tesis paneline don</Link>
        </Button>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-400" />
            Ogrenci Yonetimi
          </h1>
          <p className="text-zinc-400">
            {filterParam === 'borclu' && 'Sadece borçlu hesaplar listeleniyor.'}
            {filterParam === 'bitmek-uzere' && 'Sadece kredisi ≤3 ders kalan sporcular listeleniyor.'}
            {filterParam !== 'borclu' && filterParam !== 'bitmek-uzere' && 'Sporcu listesi, ekle/duzenle, filtrele — Supabase CRUD'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10" onClick={() => setHizliKayitOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Hızlı Kayıt
          </Button>
          <Button onClick={openAdd} className="bg-cyan-600 hover:bg-cyan-500 text-white">
            <Plus className="h-4 w-4 mr-2" />Yeni Öğrenci
          </Button>
        </div>
      </header>
      <HizliKayitModal
        open={hizliKayitOpen}
        onOpenChange={setHizliKayitOpen}
        onSuccess={() => {
          setToast({ message: 'Sporcu kaydedildi', type: 'success' })
          fetchList()
        }}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Ad veya soyad ile ara..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500"
          />
        </div>
        <select
          className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
        >
          <option value="">Tum Branslar</option>
          {BRANSLAR.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          value={ageGroup}
          onChange={(e) => setAgeGroup(Number(e.target.value))}
        >
          {YAS_GRUPLARI.map((g, i) => <option key={i} value={i}>{g.label}</option>)}
        </select>
        <select
          className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tum Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="trial">Deneme</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
      ) : filteredByAge.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center text-zinc-400">
            Henuz ogrenci kaydi yok. &quot;Yeni Ogrenci&quot; butonuyla ekleyin.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-zinc-400 text-sm font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 text-zinc-400 text-sm font-medium">Yas</th>
                  <th className="px-4 py-3 text-zinc-400 text-sm font-medium">Brans</th>
                  <th className="px-4 py-3 text-zinc-400 text-sm font-medium">Seviye</th>
                  <th className="px-4 py-3 text-zinc-400 text-sm font-medium">Durum</th>
                  <th className="px-4 py-3 text-zinc-400 text-sm font-medium">Islem</th>
                </tr>
              </thead>
              <tbody>
                {filteredByAge.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-white font-medium">{a.name} {a.surname ?? ''}</td>
                    <td className="px-4 py-3 text-zinc-300">{ageFromBirth(a.birth_date) ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-300">{a.branch ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-300">{a.level ?? '—'}</td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 items-center">
                        <Button variant="outline" size="sm" asChild className="h-8 border-cyan-700 text-cyan-300 hover:bg-cyan-950">
                          <Link href={`/franchise/athletes/${a.id}`}>Gelişim</Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)} className="text-cyan-400 hover:text-cyan-300 h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">Toplam {filteredByAge.length} ogrenci</p>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <Card className="bg-zinc-900 border-zinc-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">{editTarget ? 'Ogrenci Duzenle' : 'Yeni Ogrenci Ekle'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div><Label className="text-zinc-300">Ad *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="bg-zinc-800 border-zinc-700 text-white" /></div>
                <div><Label className="text-zinc-300">Soyad</Label><Input value={form.surname} onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
                <div><Label className="text-zinc-300">Dogum Tarihi</Label><Input type="date" value={form.birth_date} onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
                <div>
                  <Label className="text-zinc-300">Cinsiyet</Label>
                  <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                    <option value="">Seciniz</option>
                    <option value="E">Erkek</option>
                    <option value="K">Kiz</option>
                  </select>
                </div>
                <div>
                  <Label className="text-zinc-300">Brans</Label>
                  <select value={form.branch} onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))} className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                    <option value="">Seciniz</option>
                    {BRANSLAR.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-zinc-300">Seviye</Label>
                  <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                    <option value="">Seciniz</option>
                    <option value="Baslangic">Baslangic</option>
                    <option value="Orta">Orta</option>
                    <option value="Ileri">Ileri</option>
                  </select>
                </div>
                <div><Label className="text-zinc-300">Veli Adi</Label><Input value={form.parent_name} onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
                <div><Label className="text-zinc-300">Veli Telefon</Label><Input value={form.parent_phone} onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
                <div className="md:col-span-2"><Label className="text-zinc-300">Veli E-posta</Label><Input type="email" value={form.parent_email} onChange={(e) => setForm((f) => ({ ...f, parent_email: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
                <div className="md:col-span-2"><Label className="text-zinc-300">Notlar</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={sending} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editTarget ? 'Guncelle' : 'Kaydet'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-zinc-700 text-zinc-300">Iptal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'} text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
