'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, ChevronLeft, ChevronRight, Check, Loader2, Upload, Plus, Trash2 } from 'lucide-react'

const THEME_COLORS = ['#1a1a2e', '#0f172a', '#1e293b', '#0c4a6e', '#065f46', '#4c1d95', '#7c2d12', '#dc2626', '#ea580c']

const STAFF_ROLES = [
  { value: 'admin', label: 'Yönetici' },
  { value: 'manager', label: 'Tesis Müdürü' },
  { value: 'trainer', label: 'Antrenör' },
  { value: 'receptionist', label: 'Kayıt Personeli' },
  { value: 'cleaning', label: 'Temizlik Personeli' },
  { value: 'other', label: 'Diğer' },
]

type Tenant = {
  id: string
  ad?: string | null
  name?: string | null
  slug?: string | null
  sehir?: string | null
  ilce?: string | null
  logo_url?: string | null
  primary_color?: string | null
  setup_completed?: boolean
  phone?: string | null
  address?: string | null
  description?: string | null
}

type BranchEntry = { name: string }
type StaffInvite = { email: string; role: string }

export default function KurulumPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [needsSetup, setNeedsSetup] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  // Adım 1: Tesis bilgileri
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  })

  // Adım 2: Logo + Renk
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#1a1a2e')

  // Adım 3: Branş ekle
  const [branches, setBranches] = useState<BranchEntry[]>([{ name: '' }])

  // Adım 4: Personel davet
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([{ email: '', role: 'trainer' }])
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteResults, setInviteResults] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/franchise/kurulum')
      const data = await res.json()
      if (res.status === 401) {
        router.push('/auth/login?redirect=/kurulum')
        return
      }
      if (res.status === 403) {
        router.push('/franchise')
        return
      }
      if (data.tenant) {
        setTenant(data.tenant)
        setForm({
          name: data.tenant.name ?? data.tenant.ad ?? '',
          address: data.tenant.address ?? '',
          phone: data.tenant.phone ?? '',
          email: '',
        })
        setLogoUrl(data.tenant.logo_url ?? '')
        setPrimaryColor(data.tenant.primary_color ?? '#1a1a2e')
      }
      setNeedsSetup(data.needsSetup ?? true)
      setIsOwner(data.isOwner ?? false)
    } catch {
      // Network error — stay on page
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!loading && !needsSetup) {
      router.replace('/franchise')
    }
  }, [loading, needsSetup, router])

  useEffect(() => {
    if (!loading && tenant && !isOwner) {
      router.replace('/franchise')
    }
  }, [loading, tenant, isOwner, router])

  // --- Adım 1: Tesis bilgileri kaydet ---
  const saveStep1 = async () => {
    if (!form.name.trim()) {
      alert('Tesis adı zorunludur')
      return false
    }
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        alert(errData?.error ?? 'Kayıt hatası')
        return false
      }
      return true
    } catch {
      alert('Bağlantı hatası')
      return false
    } finally {
      setSaving(false)
    }
  }

  // --- Adım 2: Logo upload ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/franchise/logo', { method: 'POST', body: formData })
      const data = await res.json()
      if (data?.ok && data?.logo_url) {
        setLogoUrl(data.logo_url)
      } else {
        alert(data?.error ?? 'Logo yüklenemedi')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setLogoUploading(false)
    }
  }

  const saveStep2 = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: logoUrl || null,
          primary_color: primaryColor,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        alert(errData?.error ?? 'Kayıt hatası')
        return false
      }
      return true
    } catch {
      alert('Bağlantı hatası')
      return false
    } finally {
      setSaving(false)
    }
  }

  // --- Adım 3: Branş ekle ---
  const addBranch = () => setBranches((b) => [...b, { name: '' }])
  const removeBranch = (idx: number) => setBranches((b) => b.filter((_, i) => i !== idx))
  const updateBranch = (idx: number, field: keyof BranchEntry, value: string) => {
    setBranches((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)))
  }

  const saveStep3 = async () => {
    const validBranches = branches.filter((b) => b.name.trim())
    if (validBranches.length === 0) {
      // Allow skipping — no branches required
      return true
    }
    setSaving(true)
    let allOk = true
    for (const branch of validBranches) {
      try {
        const res = await fetch('/api/franchise/branches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenant?.id ?? '',
          },
          body: JSON.stringify({
            ad: branch.name.trim(),
          }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          alert(`Branş "${branch.name}" eklenemedi: ${errData?.error ?? 'Hata'}`)
          allOk = false
        }
      } catch {
        alert(`Branş "${branch.name}" eklenirken bağlantı hatası`)
        allOk = false
      }
    }
    setSaving(false)
    return allOk
  }

  // --- Adım 4: Personel davet ---
  const addInvite = () => setStaffInvites((s) => [...s, { email: '', role: 'trainer' }])
  const removeInvite = (idx: number) => setStaffInvites((s) => s.filter((_, i) => i !== idx))
  const updateInvite = (idx: number, field: keyof StaffInvite, value: string) => {
    setStaffInvites((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  const saveStep4 = async () => {
    const validInvites = staffInvites.filter((s) => s.email.trim())
    if (validInvites.length === 0) return true // Allow skip

    setInviteSending(true)
    const results: string[] = []
    for (const invite of validInvites) {
      try {
        const res = await fetch('/api/franchise/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: invite.email.split('@')[0],
            email: invite.email.trim(),
            role: invite.role,
          }),
        })
        const data = await res.json()
        if (data?.ok) {
          results.push(`${invite.email} — eklendi`)
        } else {
          results.push(`${invite.email} — hata: ${data?.error ?? 'Bilinmeyen'}`)
        }
      } catch {
        results.push(`${invite.email} — bağlantı hatası`)
      }
    }
    setInviteResults(results)
    setInviteSending(false)
    return true
  }

  // --- Adım 5: Tamamla ---
  const handleComplete = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/kurulum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || null,
          ad: form.name || null,
          phone: form.phone || null,
          address: form.address || null,
          logo_url: logoUrl || null,
          primary_color: primaryColor,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        router.push('/franchise')
      } else {
        alert(data?.error ?? 'Kurulum tamamlanamadı')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setSaving(false)
    }
  }

  // --- Navigation ---
  const handleNext = async () => {
    let ok = true
    if (step === 1) ok = await saveStep1()
    if (step === 2) ok = await saveStep2()
    if (step === 3) ok = await saveStep3()
    if (step === 4) ok = await saveStep4()
    if (ok && step < 5) setStep((s) => s + 1)
    if (ok && step === 5) await handleComplete()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!tenant || !needsSetup || !isOwner) {
    return null
  }

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const STEP_TITLES = [
    'Tesis Bilgileri',
    'Logo + Renk',
    'Branş Ekle',
    'Personel Davet',
    'Tamamla',
  ]

  const STEP_DESCRIPTIONS = [
    'Tesisinizin temel bilgilerini girin',
    'Logo yükleyin ve tema rengini seçin',
    'Sunacağınız branşları ekleyin',
    'Ekibinizi e-posta ile davet edin',
    'Kurulumu tamamlayın ve panele geçin',
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">YİSA-S</h1>
              <p className="text-sm text-zinc-400">Tesis Kurulum Sihirbazı</p>
            </div>
          </div>
          <Progress value={progress} className="mt-4 h-2" />
          <p className="mt-2 text-xs text-zinc-500">
            Adım {step} / {totalSteps} — {STEP_TITLES[step - 1]}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-zinc-100">{STEP_TITLES[step - 1]}</CardTitle>
            <CardDescription className="text-zinc-400">{STEP_DESCRIPTIONS[step - 1]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* === ADIM 1: Tesis Bilgileri === */}
            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Tesis Adı *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Örn. BJK Tuzla Cimnastik"
                    className="border-zinc-700 bg-zinc-800 text-zinc-100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Telefon</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="0555 123 45 67"
                    className="border-zinc-700 bg-zinc-800 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">E-posta</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="info@tesisiniz.com"
                    className="border-zinc-700 bg-zinc-800 text-zinc-100"
                    type="email"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-zinc-300">Adres</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Sokak, mahalle, bina no, şehir"
                    className="border-zinc-700 bg-zinc-800 text-zinc-100"
                  />
                </div>
              </div>
            )}

            {/* === ADIM 2: Logo + Renk === */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-zinc-300">Logo Yükle</Label>
                  <div className="flex items-center gap-4">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-16 w-16 rounded-lg object-contain border border-zinc-700 bg-zinc-800 p-1"
                      />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={logoUploading}
                      className="border-zinc-700 text-zinc-300"
                    >
                      {logoUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      {logoUrl ? 'Değiştir' : 'Logo Seç'}
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500">PNG, JPEG veya WebP. Maksimum 2 MB.</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-zinc-300">Tema Rengi</Label>
                  <div className="flex flex-wrap gap-2">
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPrimaryColor(color)}
                        className={`h-10 w-10 rounded-lg border-2 transition-all ${
                          primaryColor === color ? 'border-indigo-500 scale-110' : 'border-zinc-700'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#1a1a2e"
                    className="mt-2 w-40 border-zinc-700 bg-zinc-800 text-zinc-100"
                  />
                </div>
              </div>
            )}

            {/* === ADIM 3: Branş Ekle === */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">Tesisinizde sunacağınız branşları ekleyin. Boş bırakırsanız bu adımı atlayabilirsiniz.</p>
                {branches.map((branch, idx) => (
                  <div key={idx} className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-zinc-300 text-xs">Branş Adı</Label>
                      <Input
                        value={branch.name}
                        onChange={(e) => updateBranch(idx, 'name', e.target.value)}
                        placeholder="Örn. Artistik Cimnastik"
                        className="border-zinc-700 bg-zinc-800 text-zinc-100"
                      />
                    </div>
                    {branches.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeBranch(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addBranch} className="border-zinc-700 text-zinc-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Branş Ekle
                </Button>
              </div>
            )}

            {/* === ADIM 4: Personel Davet === */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">Ekibinizi e-posta adresi ve rol ile ekleyin. Boş bırakırsanız bu adımı atlayabilirsiniz.</p>
                {staffInvites.map((invite, idx) => (
                  <div key={idx} className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-zinc-300 text-xs">E-posta</Label>
                      <Input
                        value={invite.email}
                        onChange={(e) => updateInvite(idx, 'email', e.target.value)}
                        placeholder="personel@email.com"
                        type="email"
                        className="border-zinc-700 bg-zinc-800 text-zinc-100"
                      />
                    </div>
                    <div className="w-44 space-y-1">
                      <Label className="text-zinc-300 text-xs">Rol</Label>
                      <select
                        value={invite.role}
                        onChange={(e) => updateInvite(idx, 'role', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                      >
                        {STAFF_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    {staffInvites.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeInvite(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addInvite} className="border-zinc-700 text-zinc-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Personel Ekle
                </Button>
                {inviteResults.length > 0 && (
                  <div className="mt-4 space-y-1 rounded-lg border border-zinc-700 bg-zinc-800 p-3">
                    <p className="text-xs font-medium text-zinc-300">Sonuçlar:</p>
                    {inviteResults.map((r, i) => (
                      <p key={i} className="text-xs text-zinc-400">{r}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* === ADIM 5: Tamamla === */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tesis Adı</span>
                    <span className="text-zinc-100 font-medium">{form.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Adres</span>
                    <span className="text-zinc-100">{form.address || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Telefon</span>
                    <span className="text-zinc-100">{form.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">E-posta</span>
                    <span className="text-zinc-100">{form.email || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Tema</span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded border border-zinc-600" style={{ backgroundColor: primaryColor }} />
                      <span className="text-zinc-100">{primaryColor}</span>
                    </span>
                  </div>
                  {logoUrl && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Logo</span>
                      <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded object-contain" />
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Branşlar</span>
                    <span className="text-zinc-100">{branches.filter((b) => b.name.trim()).map((b) => b.name).join(', ') || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Personel</span>
                    <span className="text-zinc-100">{staffInvites.filter((s) => s.email.trim()).length} kişi</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  Kurulumu tamamladığınızda panele yönlendirileceksiniz. Ayarlardan daha sonra değişiklik yapabilirsiniz.
                </p>
              </div>
            )}

            {/* === Navigation === */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="border-zinc-700 text-zinc-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Önceki
              </Button>
              {step < 5 ? (
                <Button
                  onClick={handleNext}
                  disabled={saving || inviteSending || (step === 1 && !form.name.trim())}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {saving || inviteSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sonraki
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Kurulumu Tamamla
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
