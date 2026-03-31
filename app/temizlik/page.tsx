'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle,
  Save,
  Sparkles,
  Sun,
  CloudSun,
  Moon,
} from 'lucide-react'

/* ---------- checklist tanimlari ---------- */
type Vardiya = 'sabah' | 'ogle' | 'aksam'

interface ChecklistItem {
  vardiya: Vardiya
  alan: string
  checked: boolean
  not: string
}

const ALANLAR = ['Salon', 'Soyunma Odası', 'Tuvalet', 'Giriş']

const VARSAYILAN_ITEMS: ChecklistItem[] = (['sabah', 'ogle', 'aksam'] as Vardiya[]).flatMap(
  (vardiya) =>
    ALANLAR.map((alan) => ({
      vardiya,
      alan,
      checked: false,
      not: '',
    }))
)

const VARDIYA_BILGI: Record<Vardiya, { label: string; icon: React.ReactNode }> = {
  sabah: { label: 'Sabah', icon: <Sun className="h-5 w-5 text-amber-500" /> },
  ogle: { label: 'Öğle', icon: <CloudSun className="h-5 w-5 text-blue-500" /> },
  aksam: { label: 'Akşam', icon: <Moon className="h-5 w-5 text-indigo-500" /> },
}

export default function TemizlikChecklistPage() {
  const router = useRouter()
  const [items, setItems] = useState<ChecklistItem[]>(VARSAYILAN_ITEMS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [tarih] = useState(() => new Date().toISOString().slice(0, 10))

  /* auth kontrolu + mevcut checklist yukle */
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/temizlik&from=temizlik')
        return
      }
      try {
        const res = await fetch(`/api/temizlik/checklist?tarih=${tarih}`)
        const data = await res.json()
        if (data.checklist?.items && Array.isArray(data.checklist.items)) {
          setItems(data.checklist.items as ChecklistItem[])
        }
      } catch {
        /* bos checklist ile basla */
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router, tarih])

  /* item guncelle */
  const updateItem = useCallback(
    (vardiya: Vardiya, alan: string, field: 'checked' | 'not', value: boolean | string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.vardiya === vardiya && item.alan === alan
            ? { ...item, [field]: value }
            : item
        )
      )
    },
    []
  )

  /* kaydet */
  const handleSave = async () => {
    setSaving(true)
    setToast(null)
    try {
      const res = await fetch('/api/temizlik/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarih, items }),
      })
      const data = await res.json()
      if (data.ok) {
        setToast({ message: 'Kontrol listesi kaydedildi!', type: 'success' })
        if (data.checklist?.items) {
          setItems(data.checklist.items as ChecklistItem[])
        }
      } else {
        setToast({ message: data.error || 'Kayıt başarısız', type: 'error' })
      }
    } catch {
      setToast({ message: 'Bağlantı hatası', type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  /* tamamlanma orani */
  const tamamlanan = items.filter((i) => i.checked).length
  const toplam = items.length
  const oran = toplam > 0 ? Math.round((tamamlanan / toplam) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
        {/* baslik */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Temizlik Kontrol Listesi
            </h1>
            <p className="text-muted-foreground">
              {new Date(tarih + 'T12:00:00').toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={oran === 100 ? 'default' : 'secondary'} className="text-sm px-3 py-1">
              %{oran} tamamlandı
            </Badge>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Kaydet
            </Button>
          </div>
        </header>

        {/* ilerleme cubugu */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${oran}%` }}
          />
        </div>

        {/* toast */}
        {toast && (
          <div
            className={`rounded-lg p-3 text-sm ${
              toast.type === 'success'
                ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                : 'bg-red-500/10 text-red-600 border border-red-500/30'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* vardiyalar */}
        {(['sabah', 'ogle', 'aksam'] as Vardiya[]).map((vardiya) => {
          const vardiyaItems = items.filter((i) => i.vardiya === vardiya)
          const vardiyaTamamlanan = vardiyaItems.filter((i) => i.checked).length
          const bilgi = VARDIYA_BILGI[vardiya]

          return (
            <Card key={vardiya}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {bilgi.icon}
                    {bilgi.label}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {vardiyaTamamlanan}/{vardiyaItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vardiyaItems.map((item) => (
                  <div
                    key={`${vardiya}-${item.alan}`}
                    className={`flex flex-col gap-2 sm:flex-row sm:items-center rounded-lg border p-3 transition-colors ${
                      item.checked ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) =>
                          updateItem(vardiya, item.alan, 'checked', e.target.checked)
                        }
                        className="h-5 w-5 rounded border-muted-foreground/50 accent-primary"
                      />
                      <span
                        className={`font-medium ${
                          item.checked ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.alan}
                      </span>
                      {item.checked && (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                    </label>
                    <Input
                      placeholder="Not ekle..."
                      value={item.not}
                      onChange={(e) =>
                        updateItem(vardiya, item.alan, 'not', e.target.value)
                      }
                      className="sm:max-w-[200px] h-8 text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
