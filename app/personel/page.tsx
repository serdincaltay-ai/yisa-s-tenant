'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Plus, ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const ROL_OPTIONS = [
  { value: 'tesis_muduru', label: 'Tesis İşletme Müdürü' },
  { value: 'sportif_direktor', label: 'Sportif Direktör' },
  { value: 'antrenor', label: 'Antrenör' },
  { value: 'yardimci_antrenor', label: 'Yardımcı Antrenör' },
  { value: 'kasa', label: 'Kasa / Kayıt Personeli' },
  { value: 'sekreter', label: 'Telefon / Karşılama' },
  { value: 'temizlik', label: 'Temizlik Personeli' },
  { value: 'guvenlik', label: 'Güvenlik Personeli' },
]

type PersonelItem = {
  id: string
  user_id: string
  tenant_id: string
  role: string
  roleLabel?: string
  email?: string | null
  full_name?: string | null
  created_at: string
}

export default function PersonelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<PersonelItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ ad: '', soyad: '', email: '', rol: 'antrenor' })
  const [successMsg, setSuccessMsg] = useState('')

  const fetchData = async () => {
    const res = await fetch('/api/franchise/personel')
    const d = await res.json()
    if (res.status === 401) {
      router.push('/auth/login?redirect=/personel')
      return
    }
    if (res.status === 403) {
      router.push('/franchise')
      return
    }
    setItems(Array.isArray(d?.items) ? d.items : [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending || !form.ad?.trim() || !form.email?.trim()) return
    setSending(true)
    setSuccessMsg('')
    try {
      const res = await fetch('/api/franchise/personel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: form.ad.trim(),
          soyad: form.soyad.trim(),
          email: form.email.trim(),
          rol: form.rol,
        }),
      })
      const d = await res.json()
      if (d?.ok) {
        setSuccessMsg(d?.message ?? 'Personel eklendi.')
        setForm({ ad: '', soyad: '', email: '', rol: 'antrenor' })
        setShowModal(false)
        fetchData()
      } else {
        alert(d?.error ?? 'İşlem başarısız')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setSending(false)
    }
  }

  const handlePasifYap = async (id: string) => {
    if (!confirm('Bu personeli pasif yapmak istiyor musunuz?')) return
    const res = await fetch('/api/franchise/personel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: 'pasif' }),
    })
    const d = await res.json()
    if (d?.ok) fetchData()
    else alert(d?.error ?? 'Güncelleme başarısız')
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
              <Users className="h-8 w-8" />
              Personel Yönetimi
            </h1>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Personel Ekle
            </Button>
          </div>
          {successMsg && <p className="mt-2 text-sm text-green-500">{successMsg}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Personel Listesi</CardTitle>
            <CardDescription>user_tenants + auth.users</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">Henüz personel yok. Yeni Personel Ekle ile ekleyin.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 text-muted-foreground text-sm">Ad Soyad</th>
                      <th className="py-3 px-4 text-muted-foreground text-sm">Email</th>
                      <th className="py-3 px-4 text-muted-foreground text-sm">Rol</th>
                      <th className="py-3 px-4 text-muted-foreground text-sm">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-3 px-4 font-medium">{p.full_name || '—'}</td>
                        <td className="py-3 px-4">{p.email || '—'}</td>
                        <td className="py-3 px-4">{p.roleLabel || p.role}</td>
                        <td className="py-3 px-4">
                          {p.role !== 'pasif' && (
                            <Button variant="outline" size="sm" onClick={() => handlePasifYap(p.id)}>
                              Pasif Yap
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Yeni Personel Ekle</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>×</Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ad *</Label>
                    <Input value={form.ad} onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))} placeholder="Ad" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Soyad</Label>
                    <Input value={form.soyad} onChange={(e) => setForm((f) => ({ ...f, soyad: e.target.value }))} placeholder="Soyad" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@ornek.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.rol}
                    onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                  >
                    {ROL_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ekle'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>İptal</Button>
                </div>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">Kişiye geçici şifre ile hesap oluşturulacak. İlk girişte şifresini değiştirmeli.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
