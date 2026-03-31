'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, Activity, Plus } from 'lucide-react'

type Athlete = {
  id: string
  name: string
  surname?: string
  branch?: string
  level?: string
  group?: string
  status?: string
  notes?: string
  birth_date?: string
}
type Yoklama = { id: string; tarih: string; durum: string }
type Movement = {
  id: string
  movement_id: string | null
  tamamlandi: boolean
  tamamlanma_tarihi: string | null
  antrenor_notu: string | null
  created_at: string
}

export default function AntrenorSporcuDetayPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [yoklamalar, setYoklamalar] = useState<Yoklama[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [movementSaving, setMovementSaving] = useState(false)
  const [yeniNot, setYeniNot] = useState('')
  const [showNewMovement, setShowNewMovement] = useState(false)

  const fetchMovements = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/antrenor/movements?athlete_id=${id}`)
      const d = await res.json()
      setMovements(d.items ?? [])
    } catch {
      setMovements([])
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/antrenor/sporcular/${id}`)
        .then((r) => r.json())
        .then((d) => {
          setAthlete(d.athlete ?? null)
          setNotes(d.athlete?.notes ?? '')
          setYoklamalar(d.yoklamalar ?? [])
        }),
      fetchMovements(),
    ])
      .catch(() => {
        setAthlete(null)
        setYoklamalar([])
      })
      .finally(() => setLoading(false))
  }, [id, fetchMovements])

  const handleNotKaydet = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/antrenor/sporcular/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        if (athlete) setAthlete({ ...athlete, notes })
      } else {
        alert(j.error ?? 'Kaydetme başarısız')
      }
    } catch {
      alert('Kaydetme başarısız')
    } finally {
      setSaving(false)
    }
  }

  const handleMovementTamamla = async (movId: string) => {
    setMovementSaving(true)
    try {
      const res = await fetch('/api/antrenor/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: movId,
          athlete_id: id,
          tamamlandi: true,
          tamamlanma_tarihi: new Date().toISOString().slice(0, 10),
        }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        await fetchMovements()
      } else {
        alert(j.error ?? 'İşlem başarısız')
      }
    } catch {
      alert('İşlem başarısız')
    } finally {
      setMovementSaving(false)
    }
  }

  const handleYeniHareket = async () => {
    if (!id) return
    setMovementSaving(true)
    try {
      const res = await fetch('/api/antrenor/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: id,
          tamamlandi: true,
          tamamlanma_tarihi: new Date().toISOString().slice(0, 10),
          antrenor_notu: yeniNot.trim() || null,
        }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        setYeniNot('')
        setShowNewMovement(false)
        await fetchMovements()
      } else {
        alert(j.error ?? 'Ekleme başarısız')
      }
    } catch {
      alert('Ekleme başarısız')
    } finally {
      setMovementSaving(false)
    }
  }

  if (loading || !id) {
    return (
      <div className="p-6 flex items-center justify-center">
        <span className="text-muted-foreground">Yükleniyor...</span>
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Sporcu bulunamadı.</p>
        <Link href="/antrenor/sporcular" className="text-primary hover:underline mt-2 inline-block">
          ← Sporculara dön
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/antrenor/sporcular/${id}/gelisim`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          Gelişim grafiği
        </Link>
        <Link
          href="/antrenor/sporcular"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Sporculara dön
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {athlete.name} {athlete.surname ?? ''}
          </CardTitle>
          <CardDescription>
            {[athlete.branch, athlete.level, athlete.group].filter(Boolean).join(' • ')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <p><span className="text-muted-foreground">Branş:</span> {athlete.branch ?? '—'}</p>
            <p><span className="text-muted-foreground">Seviye:</span> {athlete.level ?? '—'}</p>
            <p><span className="text-muted-foreground">Grup:</span> {athlete.group ?? '—'}</p>
            <p><span className="text-muted-foreground">Durum:</span> {athlete.status ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Not</CardTitle>
          <CardDescription>Sporcu hakkında not ekleyin veya güncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[100px] rounded-lg border border-input bg-background px-4 py-2"
            placeholder="Not yazın..."
          />
          <Button onClick={handleNotKaydet} disabled={saving} className="mt-2">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yoklama Geçmişi</CardTitle>
          <CardDescription>Son 50 yoklama kaydı</CardDescription>
        </CardHeader>
        <CardContent>
          {yoklamalar.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz yoklama kaydı yok.</p>
          ) : (
            <div className="space-y-2">
              {yoklamalar.map((y) => (
                <div
                  key={y.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <span className="text-sm">{y.tarih}</span>
                  {y.durum === 'geldi' && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" /> Geldi
                    </span>
                  )}
                  {y.durum === 'gelmedi' && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <XCircle className="h-4 w-4" /> Gelmedi
                    </span>
                  )}
                  {y.durum === 'izinli' && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
                      <Clock className="h-4 w-4" /> İzinli
                    </span>
                  )}
                  {y.durum === 'gec' && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                      Geç
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hareketler */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" /> Hareketler
              </CardTitle>
              <CardDescription>Sporcunun hareket tamamlama durumu</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewMovement(!showNewMovement)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Hareket Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNewMovement && (
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-medium">Yeni Hareket Tamamla</p>
              <textarea
                value={yeniNot}
                onChange={(e) => setYeniNot(e.target.value)}
                className="w-full min-h-[60px] rounded-lg border border-input bg-background px-4 py-2 text-sm"
                placeholder="Antrenör notu (opsiyonel)..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleYeniHareket} disabled={movementSaving}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {movementSaving ? 'Kaydediliyor...' : 'Tamamlandı Olarak Ekle'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewMovement(false)}>
                  İptal
                </Button>
              </div>
            </div>
          )}

          {movements.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz hareket kaydı yok.</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {m.tamamlandi ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                      <span className="text-sm font-medium">
                        {m.tamamlandi ? 'Tamamlandı' : 'Bekliyor'}
                      </span>
                    </div>
                    {m.tamamlanma_tarihi && (
                      <p className="text-xs text-muted-foreground">
                        Tarih: {new Date(m.tamamlanma_tarihi).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                    {m.antrenor_notu && (
                      <p className="text-xs text-muted-foreground">Not: {m.antrenor_notu}</p>
                    )}
                  </div>
                  {!m.tamamlandi && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMovementTamamla(m.id)}
                      disabled={movementSaving}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Tamamla
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
