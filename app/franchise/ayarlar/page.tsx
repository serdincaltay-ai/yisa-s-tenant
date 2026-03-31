'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Upload,
  Palette,
  Share2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  MessageCircle,
  Facebook,
  Loader2,
  Check,
  ImageIcon,
  Layout,
} from 'lucide-react'

type TenantSettings = {
  id: string
  name: string
  slug: string
  package_type: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  instagram_url: string | null
  whatsapp_number: string | null
  google_maps_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  phone: string | null
  email: string | null
  address: string | null
  working_hours: Record<string, string> | string | null
}

const DEFAULT_COLORS = {
  primary_color: '#06b6d4',
  secondary_color: '#0e7490',
  accent_color: '#22d3ee',
}

export default function FranchiseAyarlarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tenant, setTenant] = useState<TenantSettings | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    primary_color: DEFAULT_COLORS.primary_color,
    secondary_color: DEFAULT_COLORS.secondary_color,
    accent_color: DEFAULT_COLORS.accent_color,
    instagram_url: '',
    whatsapp_number: '',
    google_maps_url: '',
    facebook_url: '',
    twitter_url: '',
    phone: '',
    email: '',
    address: '',
    working_hours: '',
  })

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/franchise/settings')
      const data = await res.json()
      if (data?.tenant) {
        const t = data.tenant as TenantSettings
        setTenant(t)
        setForm({
          primary_color: t.primary_color || DEFAULT_COLORS.primary_color,
          secondary_color: t.secondary_color || DEFAULT_COLORS.secondary_color,
          accent_color: t.accent_color || DEFAULT_COLORS.accent_color,
          instagram_url: t.instagram_url ?? '',
          whatsapp_number: t.whatsapp_number ?? '',
          google_maps_url: t.google_maps_url ?? '',
          facebook_url: t.facebook_url ?? '',
          twitter_url: t.twitter_url ?? '',
          phone: t.phone ?? '',
          email: t.email ?? '',
          address: t.address ?? '',
          working_hours: typeof t.working_hours === 'object' && t.working_hours !== null
            ? Object.entries(t.working_hours as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join('\n')
            : typeof t.working_hours === 'string' ? t.working_hours : '',
        })
      }
    } catch (e) {
      console.error('[ayarlar] Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/franchise/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data?.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert(data?.error ?? 'Kayıt başarısız')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/franchise/logo', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data?.ok && data.logo_url) {
        // Cache-busting: tarayıcı önbelleği atlasın diye timestamp ekle (sadece client-side)
        const freshUrl = `${data.logo_url}?t=${Date.now()}`
        setTenant((prev) => prev ? { ...prev, logo_url: freshUrl } : prev)
      } else {
        alert(data?.error ?? 'Logo yüklenemedi')
      }
    } catch {
      alert('Logo yükleme hatası')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/franchise')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Tesis Ayarları</h1>
              <p className="text-sm text-muted-foreground">{tenant?.name ?? 'Tesisim'}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor…
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Kaydedildi
              </>
            ) : (
              'Kaydet'
            )}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* 1. Logo Yükleme */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle>Logo</CardTitle>
            </div>
            <CardDescription>Tesis logonuzu yükleyin (PNG, JPEG, WebP — maks. 2 MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted">
                {tenant?.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt="Logo"
                    className="h-full w-full rounded-2xl object-contain"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yükleniyor…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Logo Yükle
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPEG veya WebP · Maksimum 2 MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Renk Paleti */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Renk Paleti</CardTitle>
            </div>
            <CardDescription>Tesis sitenizin renk temasını özelleştirin (CSS değişkenleri)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Ana Renk (Primary)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => updateForm('primary_color', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={form.primary_color}
                    onChange={(e) => updateForm('primary_color', e.target.value)}
                    placeholder="#06b6d4"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>İkincil Renk (Secondary)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) => updateForm('secondary_color', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={form.secondary_color}
                    onChange={(e) => updateForm('secondary_color', e.target.value)}
                    placeholder="#0e7490"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vurgu Renk (Accent)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => updateForm('accent_color', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={form.accent_color}
                    onChange={(e) => updateForm('accent_color', e.target.value)}
                    placeholder="#22d3ee"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            {/* Renk önizleme */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Önizleme:</span>
              <div
                className="h-8 w-16 rounded"
                style={{ backgroundColor: form.primary_color }}
                title="Ana Renk"
              />
              <div
                className="h-8 w-16 rounded"
                style={{ backgroundColor: form.secondary_color }}
                title="İkincil Renk"
              />
              <div
                className="h-8 w-16 rounded"
                style={{ backgroundColor: form.accent_color }}
                title="Vurgu Renk"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Sosyal Medya Bağlantıları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <CardTitle>Sosyal Medya</CardTitle>
            </div>
            <CardDescription>Sosyal medya hesaplarınızı bağlayın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram URL
                </Label>
                <Input
                  value={form.instagram_url}
                  onChange={(e) => updateForm('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/tesisim"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Numarası
                </Label>
                <Input
                  value={form.whatsapp_number}
                  onChange={(e) => updateForm('whatsapp_number', e.target.value)}
                  placeholder="905xxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Google Maps Link
                </Label>
                <Input
                  value={form.google_maps_url}
                  onChange={(e) => updateForm('google_maps_url', e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook URL
                </Label>
                <Input
                  value={form.facebook_url}
                  onChange={(e) => updateForm('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/tesisim"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Twitter / X URL
                </Label>
                <Input
                  value={form.twitter_url}
                  onChange={(e) => updateForm('twitter_url', e.target.value)}
                  placeholder="https://x.com/tesisim"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. İletişim Bilgileri */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle>İletişim Bilgileri</CardTitle>
            </div>
            <CardDescription>Tesisinizin iletişim bilgilerini düzenleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefon
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="0530 000 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-posta
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder="info@tesisim.com"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adres
                </Label>
                <Input
                  value={form.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  placeholder="Mahalle, Cadde No:X, İlçe/İl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Çalışma Saatleri
                </Label>
                <Input
                  value={form.working_hours}
                  onChange={(e) => updateForm('working_hours', e.target.value)}
                  placeholder="Hafta içi 09:00-21:00 · Cumartesi 09:00-18:00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Şablon Seçimi (sadece görüntüleme) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              <CardTitle>Şablon Seçimi</CardTitle>
            </div>
            <CardDescription>Site şablonunuzu görüntüleyin. Değiştirmek için Patron onayı gereklidir.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {(['standard', 'medium', 'premium'] as const).map((tmpl) => {
                const isActive = (tenant?.package_type ?? 'standard') === tmpl
                const labels: Record<string, { title: string; desc: string }> = {
                  standard: { title: 'Standart', desc: 'Temel tesis sayfası: hakkımızda, branşlar, ders programı, fiyatlar' },
                  medium: { title: 'Orta', desc: 'Standart + galeri, antrenörler, başarı hikayeleri, duyurular' },
                  premium: { title: 'Premium', desc: 'Orta + robot karşılama, randevu sistemi, SSS, video, yorumlar' },
                }
                const info = labels[tmpl]
                return (
                  <div
                    key={tmpl}
                    className={`relative rounded-2xl border-2 p-4 transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border opacity-60'
                    }`}
                  >
                    {isActive && (
                      <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground">
                        Aktif
                      </Badge>
                    )}
                    <h3 className="font-semibold text-foreground">{info.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{info.desc}</p>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Şablon değişikliği için Patron panelinden onay talep edin.
            </p>
          </CardContent>
        </Card>

        {/* Alt kaydet butonu */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor…
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Kaydedildi
              </>
            ) : (
              'Tüm Ayarları Kaydet'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
