'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react'

type StaffItem = {
  id: string
  name: string
  surname?: string | null
  email?: string | null
  phone?: string | null
  role?: string | null
  branch?: string | null
  is_active?: boolean | null
  created_at?: string | null
}

const ROL_LABEL: Record<string, string> = {
  admin: 'Admin',
  manager: 'Tesis Müdürü',
  trainer: 'Antrenör',
  receptionist: 'Kayıt',
  cleaning: 'Temizlik',
  other: 'Diğer',
}

function getRolLabel(role: string | null | undefined): string {
  if (!role) return '—'
  return ROL_LABEL[role] ?? role
}

export default function FranchisePersonelPage() {
  const [staff, setStaff] = useState<StaffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [sending, setSending] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    role: 'trainer' as string,
    branch: '',
  })

  const fetchStaff = useCallback(async () => {
    const res = await fetch('/api/franchise/staff')
    const data = await res.json()
    setStaff(Array.isArray(data?.items) ? data.items : [])
  }, [])

  useEffect(() => {
    fetchStaff().finally(() => setLoading(false))
  }, [fetchStaff])

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending || !inviteForm.name.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/franchise/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteForm.name.trim(),
          surname: inviteForm.surname.trim() || undefined,
          email: inviteForm.email.trim() || undefined,
          phone: inviteForm.phone.trim() || undefined,
          role: inviteForm.role,
          branch: inviteForm.branch.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        setInviteForm({ name: '', surname: '', email: '', phone: '', role: 'trainer', branch: '' })
        setShowInvite(false)
        fetchStaff()
      } else {
        alert(data?.error ?? 'Kayıt başarısız')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/franchise"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Personel</h1>
              <p className="text-sm text-zinc-400">Personel listesi ve davet</p>
            </div>
          </div>
          <Button
            onClick={() => setShowInvite(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white border-0"
          >
            <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Davet
          </Button>
        </div>

        {showInvite && (
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-white">Personel Ekle (Davet)</CardTitle>
                <CardDescription className="text-zinc-400">
                  Ad zorunlu; diğer alanlar isteğe bağlı
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
                onClick={() => setShowInvite(false)}
              >
                İptal
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-name" className="text-zinc-300">Ad *</Label>
                  <Input
                    id="invite-name"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ad"
                    required
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-surname" className="text-zinc-300">Soyad</Label>
                  <Input
                    id="invite-surname"
                    value={inviteForm.surname}
                    onChange={(e) => setInviteForm((f) => ({ ...f, surname: e.target.value }))}
                    placeholder="Soyad"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role" className="text-zinc-300">Rol</Label>
                  <select
                    id="invite-role"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white"
                  >
                    <option value="trainer">Antrenör</option>
                    <option value="manager">Tesis Müdürü</option>
                    <option value="admin">Admin</option>
                    <option value="receptionist">Kayıt</option>
                    <option value="cleaning">Temizlik</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-branch" className="text-zinc-300">Branş</Label>
                  <Input
                    id="invite-branch"
                    value={inviteForm.branch}
                    onChange={(e) => setInviteForm((f) => ({ ...f, branch: e.target.value }))}
                    placeholder="Örn. Artistik Cimnastik"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-phone" className="text-zinc-300">Telefon</Label>
                  <Input
                    id="invite-phone"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Telefon"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-zinc-300">E-posta</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="E-posta"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button
                    type="submit"
                    disabled={sending}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white border-0"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
                  </Button>
                  <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => setShowInvite(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-white">Personel Listesi</CardTitle>
            <CardDescription className="text-zinc-400">
              {staff.length} kişi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : staff.length === 0 ? (
              <p className="py-8 text-center text-zinc-500">Henüz personel kaydı yok. Davet butonu ile ekleyin.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Ad</TableHead>
                    <TableHead className="text-zinc-400">Soyad</TableHead>
                    <TableHead className="text-zinc-400">Rol</TableHead>
                    <TableHead className="text-zinc-400">Branş</TableHead>
                    <TableHead className="text-zinc-400">Telefon</TableHead>
                    <TableHead className="text-zinc-400">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-medium text-white">{s.name}</TableCell>
                      <TableCell className="text-zinc-300">{s.surname ?? '—'}</TableCell>
                      <TableCell className="text-zinc-300">{getRolLabel(s.role ?? null)}</TableCell>
                      <TableCell className="text-zinc-300">{s.branch ?? '—'}</TableCell>
                      <TableCell className="text-zinc-300">{s.phone ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={
                            s.is_active !== false
                              ? 'rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400'
                              : 'rounded-full bg-zinc-600/30 px-2 py-0.5 text-xs text-zinc-500'
                          }
                        >
                          {s.is_active !== false ? 'Aktif' : 'Pasif'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
