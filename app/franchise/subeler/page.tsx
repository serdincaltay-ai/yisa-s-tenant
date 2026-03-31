'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2, Loader2, ArrowLeft, Plus, Pencil, Trash2, Star, MapPin, Phone, Mail,
  Users, Dumbbell, ArrowRightLeft, BarChart3, TrendingUp, TrendingDown, AlertCircle
} from 'lucide-react'

type Sube = {
  id: string
  tenant_id: string
  ad: string
  slug: string
  adres?: string | null
  telefon?: string | null
  email?: string | null
  sehir?: string | null
  ilce?: string | null
  renk?: string | null
  ikon?: string | null
  calisma_saatleri?: Record<string, unknown> | null
  aktif: boolean
  varsayilan: boolean
  personel_sayisi?: number
  ogrenci_sayisi?: number
  created_at?: string | null
  updated_at?: string | null
}

type StaffItem = {
  id: string
  name: string
  surname?: string | null
  role?: string
  branch_id?: string | null
  is_active?: boolean
}

type AthleteItem = {
  id: string
  name: string
  surname?: string | null
  status?: string
  branch_id?: string | null
}

type BranchReport = {
  id: string
  ad: string
  renk?: string | null
  personel_sayisi: number
  ogrenci_sayisi: number
  aktif_ogrenci: number
}

type ReportOzet = {
  toplam_sube: number
  toplam_personel: number
  toplam_ogrenci: number
  atanmamis_personel: number
  atanmamis_ogrenci: number
  en_iyi_sube: { ad: string; ogrenci: number } | null
  en_kotu_sube: { ad: string; ogrenci: number } | null
}

const EMPTY_FORM = {
  ad: '',
  adres: '',
  telefon: '',
  email: '',
  sehir: '',
  ilce: '',
  renk: '#06b6d4',
}

const RENK_OPTIONS = [
  { value: '#06b6d4', label: 'Camgöbeği', cls: 'bg-cyan-500' },
  { value: '#f59e0b', label: 'Kehribar', cls: 'bg-amber-500' },
  { value: '#10b981', label: 'Zümrüt', cls: 'bg-emerald-500' },
  { value: '#8b5cf6', label: 'Mor', cls: 'bg-violet-500' },
  { value: '#ef4444', label: 'Kırmızı', cls: 'bg-red-500' },
  { value: '#3b82f6', label: 'Mavi', cls: 'bg-blue-500' },
  { value: '#ec4899', label: 'Pembe', cls: 'bg-pink-500' },
  { value: '#f97316', label: 'Turuncu', cls: 'bg-orange-500' },
]

export default function SubelerPage() {
  const [subeler, setSubeler] = useState<Sube[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState('subeler')

  // Transfer state
  const [staffList, setStaffList] = useState<StaffItem[]>([])
  const [athleteList, setAthleteList] = useState<AthleteItem[]>([])
  const [transferType, setTransferType] = useState<'staff' | 'athlete'>('staff')
  const [transferEntityId, setTransferEntityId] = useState('')
  const [transferHedefId, setTransferHedefId] = useState('')
  const [transferNeden, setTransferNeden] = useState('')
  const [transferSending, setTransferSending] = useState(false)

  // Report state
  const [report, setReport] = useState<BranchReport[]>([])
  const [reportOzet, setReportOzet] = useState<ReportOzet | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const fetchSubeler = useCallback(async () => {
    try {
      const res = await fetch('/api/franchise/branches')
      const data = await res.json()
      setSubeler(Array.isArray(data?.subeler) ? data.subeler : [])
    } catch {
      setSubeler([])
    }
  }, [])

  const fetchStaffAndAthletes = useCallback(async () => {
    try {
      const [staffRes, athleteRes] = await Promise.all([
        fetch('/api/franchise/staff'),
        fetch('/api/franchise/athletes'),
      ])
      const staffData = await staffRes.json()
      const athleteData = await athleteRes.json()
      setStaffList(Array.isArray(staffData?.items) ? staffData.items : [])
      setAthleteList(Array.isArray(athleteData?.items) ? athleteData.items : [])
    } catch {
      setStaffList([])
      setAthleteList([])
    }
  }, [])

  const fetchReport = useCallback(async () => {
    setReportLoading(true)
    try {
      const res = await fetch('/api/franchise/branches/report')
      const data = await res.json()
      setReport(Array.isArray(data?.subeler) ? data.subeler : [])
      setReportOzet(data?.ozet ?? null)
    } catch {
      setReport([])
      setReportOzet(null)
    } finally {
      setReportLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubeler().finally(() => setLoading(false))
  }, [fetchSubeler])

  useEffect(() => {
    if (activeTab === 'transfer') fetchStaffAndAthletes()
    if (activeTab === 'rapor') fetchReport()
  }, [activeTab, fetchStaffAndAthletes, fetchReport])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending || !form.ad.trim()) return
    setSending(true)
    try {
      const method = editId ? 'PUT' : 'POST'
      const payload = editId
        ? { id: editId, ad: form.ad.trim(), adres: form.adres.trim() || undefined, telefon: form.telefon.trim() || undefined, email: form.email.trim() || undefined, sehir: form.sehir.trim() || undefined, ilce: form.ilce.trim() || undefined, renk: form.renk }
        : { ad: form.ad.trim(), adres: form.adres.trim() || undefined, telefon: form.telefon.trim() || undefined, email: form.email.trim() || undefined, sehir: form.sehir.trim() || undefined, ilce: form.ilce.trim() || undefined, renk: form.renk }

      const res = await fetch('/api/franchise/branches', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data?.ok) {
        resetForm()
        fetchSubeler()
      } else {
        alert(data?.error ?? 'Kayit basarisiz')
      }
    } catch {
      alert('Baglanti hatasi')
    } finally {
      setSending(false)
    }
  }

  const handleEdit = (sube: Sube) => {
    setEditId(sube.id)
    setForm({
      ad: sube.ad,
      adres: sube.adres ?? '',
      telefon: sube.telefon ?? '',
      email: sube.email ?? '',
      sehir: sube.sehir ?? '',
      ilce: sube.ilce ?? '',
      renk: sube.renk ?? '#06b6d4',
    })
    setShowForm(true)
    setActiveTab('subeler')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu subeyi silmek istediginize emin misiniz?')) return
    try {
      const res = await fetch(`/api/franchise/branches?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data?.ok) {
        fetchSubeler()
      } else {
        alert(data?.error ?? 'Silme basarisiz')
      }
    } catch {
      alert('Baglanti hatasi')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/franchise/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, varsayilan: true }),
      })
      const data = await res.json()
      if (data?.ok) {
        fetchSubeler()
      }
    } catch {
      alert('Baglanti hatasi')
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (transferSending || !transferEntityId || !transferHedefId) return
    setTransferSending(true)
    try {
      const res = await fetch('/api/franchise/branches/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: transferType,
          entity_id: transferEntityId,
          hedef_branch_id: transferHedefId,
          neden: transferNeden.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        alert('Transfer basarili!')
        setTransferEntityId('')
        setTransferHedefId('')
        setTransferNeden('')
        fetchStaffAndAthletes()
        fetchSubeler()
      } else {
        alert(data?.error ?? 'Transfer basarisiz')
      }
    } catch {
      alert('Baglanti hatasi')
    } finally {
      setTransferSending(false)
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(false)
  }

  const getSubeAd = (branchId: string | null | undefined) => {
    if (!branchId) return 'Atanmamis'
    return subeler.find((s) => s.id === branchId)?.ad ?? 'Bilinmiyor'
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/franchise"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Sube Yonetimi</h1>
              <p className="text-sm text-zinc-400">Tum subelerinizi yonetin, transfer yapin, raporlari goruntuleyin</p>
            </div>
          </div>
          <Button
            onClick={() => { resetForm(); setShowForm(true); setActiveTab('subeler') }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white border-0"
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Yeni Sube
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="subeler" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              <Building2 className="mr-2 h-4 w-4" />
              Subeler
            </TabsTrigger>
            <TabsTrigger value="transfer" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfer
            </TabsTrigger>
            <TabsTrigger value="rapor" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              <BarChart3 className="mr-2 h-4 w-4" />
              Karsilastirma
            </TabsTrigger>
          </TabsList>

          {/* SUBELER TAB */}
          <TabsContent value="subeler" className="space-y-4">
            {showForm && (
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-white">
                      {editId ? 'Sube Duzenle' : 'Yeni Sube Ekle'}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Sube adi zorunludur; diger alanlar istege baglidir
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={resetForm}>
                    Iptal
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sube-ad" className="text-zinc-300">Sube Adi *</Label>
                      <Input
                        id="sube-ad"
                        value={form.ad}
                        onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))}
                        placeholder="Ornegin: Merkez Sube"
                        required
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Sube Rengi</Label>
                      <div className="flex gap-2">
                        {RENK_OPTIONS.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            className={`h-8 w-8 rounded-full border-2 transition-all ${r.cls} ${form.renk === r.value ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            onClick={() => setForm((f) => ({ ...f, renk: r.value }))}
                            title={r.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sube-sehir" className="text-zinc-300">Sehir</Label>
                      <Input
                        id="sube-sehir"
                        value={form.sehir}
                        onChange={(e) => setForm((f) => ({ ...f, sehir: e.target.value }))}
                        placeholder="Istanbul"
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sube-ilce" className="text-zinc-300">Ilce</Label>
                      <Input
                        id="sube-ilce"
                        value={form.ilce}
                        onChange={(e) => setForm((f) => ({ ...f, ilce: e.target.value }))}
                        placeholder="Tuzla"
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sube-telefon" className="text-zinc-300">Telefon</Label>
                      <Input
                        id="sube-telefon"
                        value={form.telefon}
                        onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
                        placeholder="+90 5XX XXX XXXX"
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sube-email" className="text-zinc-300">E-posta</Label>
                      <Input
                        id="sube-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="sube@tesis.com"
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="sube-adres" className="text-zinc-300">Adres</Label>
                      <Textarea
                        id="sube-adres"
                        value={form.adres}
                        onChange={(e) => setForm((f) => ({ ...f, adres: e.target.value }))}
                        placeholder="Acik adres"
                        rows={2}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <Button type="submit" disabled={sending} className="bg-cyan-600 hover:bg-cyan-500 text-white border-0">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? 'Guncelle' : 'Kaydet'}
                      </Button>
                      <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300" onClick={resetForm}>
                        Iptal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-white">Sube Listesi</CardTitle>
                <CardDescription className="text-zinc-400">{subeler.length} sube</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  </div>
                ) : subeler.length === 0 ? (
                  <p className="py-8 text-center text-zinc-500">Henuz sube kaydi yok. Yeni Sube butonu ile ekleyin.</p>
                ) : (
                  <div className="space-y-3">
                    {subeler.map((sube) => (
                      <div
                        key={sube.id}
                        className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: (sube.renk ?? '#06b6d4') + '33' }}
                          >
                            <Building2 className="h-5 w-5" style={{ color: sube.renk ?? '#06b6d4' }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-white">{sube.ad}</h3>
                              {sube.varsayilan && (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                                  <Star className="mr-1 h-3 w-3" />
                                  Varsayilan
                                </Badge>
                              )}
                              <Badge className={sube.aktif ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]' : 'bg-zinc-600/30 text-zinc-500 border-zinc-600/30 text-[10px]'}>
                                {sube.aktif ? 'Aktif' : 'Pasif'}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                              {(sube.sehir || sube.ilce) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {[sube.ilce, sube.sehir].filter(Boolean).join(', ')}
                                </span>
                              )}
                              {sube.telefon && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {sube.telefon}
                                </span>
                              )}
                              {sube.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {sube.email}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {sube.personel_sayisi ?? 0} personel
                              </span>
                              <span className="flex items-center gap-1">
                                <Dumbbell className="h-3 w-3" />
                                {sube.ogrenci_sayisi ?? 0} ogrenci
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {!sube.varsayilan && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              onClick={() => handleSetDefault(sube.id)}
                              title="Varsayilan yap"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                            onClick={() => handleEdit(sube)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleDelete(sube.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRANSFER TAB */}
          <TabsContent value="transfer" className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-white">
                  <ArrowRightLeft className="inline mr-2 h-5 w-5" />
                  Subelararasi Transfer
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Personel veya ogrenciyi bir subeden digerine transfer edin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Transfer Tipi</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={transferType === 'staff' ? 'default' : 'outline'}
                        size="sm"
                        className={transferType === 'staff' ? 'bg-cyan-600 text-white' : 'border-zinc-700 text-zinc-300'}
                        onClick={() => { setTransferType('staff'); setTransferEntityId('') }}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        Personel
                      </Button>
                      <Button
                        type="button"
                        variant={transferType === 'athlete' ? 'default' : 'outline'}
                        size="sm"
                        className={transferType === 'athlete' ? 'bg-cyan-600 text-white' : 'border-zinc-700 text-zinc-300'}
                        onClick={() => { setTransferType('athlete'); setTransferEntityId('') }}
                      >
                        <Dumbbell className="mr-1 h-3 w-3" />
                        Ogrenci
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">
                      {transferType === 'staff' ? 'Personel Sec' : 'Ogrenci Sec'}
                    </Label>
                    <select
                      value={transferEntityId}
                      onChange={(e) => setTransferEntityId(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white"
                      required
                    >
                      <option value="">Secin...</option>
                      {transferType === 'staff'
                        ? staffList.filter((s) => s.is_active !== false).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.surname ?? ''} — {getSubeAd(s.branch_id)}
                            </option>
                          ))
                        : athleteList.filter((a) => a.status === 'active').map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} {a.surname ?? ''} — {getSubeAd(a.branch_id)}
                            </option>
                          ))
                      }
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Hedef Sube</Label>
                    <select
                      value={transferHedefId}
                      onChange={(e) => setTransferHedefId(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white"
                      required
                    >
                      <option value="">Secin...</option>
                      {subeler.filter((s) => s.aktif).map((s) => (
                        <option key={s.id} value={s.id}>{s.ad}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Neden (istege bagli)</Label>
                    <Input
                      value={transferNeden}
                      onChange={(e) => setTransferNeden(e.target.value)}
                      placeholder="Transfer nedeni"
                      className="bg-zinc-800/50 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={transferSending} className="bg-cyan-600 hover:bg-cyan-500 text-white border-0">
                      {transferSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                      Transfer Et
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-white text-sm">Sube Bazli Personel Dagilimi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subeler.filter((s) => s.aktif).map((sube) => {
                    const staffInBranch = staffList.filter((st) => st.branch_id === sube.id)
                    const athletesInBranch = athleteList.filter((at) => at.branch_id === sube.id)
                    return (
                      <div key={sube.id} className="flex items-center gap-3 rounded-md border border-zinc-800 p-3">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: sube.renk ?? '#06b6d4' }} />
                        <span className="text-sm font-medium text-white flex-1">{sube.ad}</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                          <Users className="mr-1 h-3 w-3" />
                          {staffInBranch.length}
                        </Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          <Dumbbell className="mr-1 h-3 w-3" />
                          {athletesInBranch.length}
                        </Badge>
                      </div>
                    )
                  })}
                  {(staffList.some((s) => !s.branch_id) || athleteList.some((a) => !a.branch_id)) && (
                    <div className="flex items-center gap-3 rounded-md border border-zinc-800 border-dashed p-3">
                      <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="text-sm text-zinc-400 flex-1">Atanmamis</span>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                        <Users className="mr-1 h-3 w-3" />
                        {staffList.filter((s) => !s.branch_id).length}
                      </Badge>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                        <Dumbbell className="mr-1 h-3 w-3" />
                        {athleteList.filter((a) => !a.branch_id).length}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RAPOR TAB */}
          <TabsContent value="rapor" className="space-y-4">
            {reportLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <>
                {reportOzet && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-zinc-800 bg-zinc-900/80">
                      <CardContent className="pt-6">
                        <p className="text-xs text-zinc-500">Toplam Sube</p>
                        <p className="text-2xl font-bold text-white">{reportOzet.toplam_sube}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-900/80">
                      <CardContent className="pt-6">
                        <p className="text-xs text-zinc-500">Toplam Personel</p>
                        <p className="text-2xl font-bold text-white">{reportOzet.toplam_personel}</p>
                        {reportOzet.atanmamis_personel > 0 && (
                          <p className="text-[10px] text-amber-400">{reportOzet.atanmamis_personel} atanmamis</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-900/80">
                      <CardContent className="pt-6">
                        <p className="text-xs text-zinc-500">Toplam Ogrenci</p>
                        <p className="text-2xl font-bold text-white">{reportOzet.toplam_ogrenci}</p>
                        {reportOzet.atanmamis_ogrenci > 0 && (
                          <p className="text-[10px] text-amber-400">{reportOzet.atanmamis_ogrenci} atanmamis</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-900/80">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <p className="text-xs text-zinc-500">En Iyi Sube</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-400">{reportOzet.en_iyi_sube?.ad ?? '-'}</p>
                        <p className="text-[10px] text-zinc-500">{reportOzet.en_iyi_sube?.ogrenci ?? 0} aktif ogrenci</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card className="border-zinc-800 bg-zinc-900/80">
                  <CardHeader>
                    <CardTitle className="text-white">Sube Karsilastirma Tablosu</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Tum subelerin performans karsilastirmasi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.length === 0 ? (
                      <p className="py-8 text-center text-zinc-500">Rapor verisi bulunamadi</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-800">
                              <th className="py-3 px-4 text-left text-zinc-400 font-medium">Sube</th>
                              <th className="py-3 px-4 text-center text-zinc-400 font-medium">Personel</th>
                              <th className="py-3 px-4 text-center text-zinc-400 font-medium">Toplam Ogrenci</th>
                              <th className="py-3 px-4 text-center text-zinc-400 font-medium">Aktif Ogrenci</th>
                              <th className="py-3 px-4 text-center text-zinc-400 font-medium">Performans</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.map((r) => {
                              const maxOgrenci = Math.max(...report.map((x) => x.aktif_ogrenci), 1)
                              const pct = Math.round((r.aktif_ogrenci / maxOgrenci) * 100)
                              const isEnIyi = reportOzet?.en_iyi_sube?.ad === r.ad
                              const isEnKotu = reportOzet?.en_kotu_sube?.ad === r.ad && report.length > 1
                              return (
                                <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="h-3 w-3 rounded-full shrink-0"
                                        style={{ backgroundColor: r.renk ?? '#06b6d4' }}
                                      />
                                      <span className="font-medium text-white">{r.ad}</span>
                                      {isEnIyi && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                                      {isEnKotu && <TrendingDown className="h-3 w-3 text-red-400" />}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center text-zinc-300">{r.personel_sayisi}</td>
                                  <td className="py-3 px-4 text-center text-zinc-300">{r.ogrenci_sayisi}</td>
                                  <td className="py-3 px-4 text-center text-zinc-300">{r.aktif_ogrenci}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all"
                                          style={{ width: `${pct}%`, backgroundColor: r.renk ?? '#06b6d4' }}
                                        />
                                      </div>
                                      <span className="text-xs text-zinc-500 w-8 text-right">{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
