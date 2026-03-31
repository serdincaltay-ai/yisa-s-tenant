'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { DersDetayResponse, DersDetayParticipant } from '@/app/api/franchise/ders-detay/[scheduleId]/route'

const STATUS_LABEL: Record<string, string> = {
  present: 'Geldi',
  absent: 'Gelmedi',
  late: 'Geç',
  excused: 'İzinli',
  penalized: 'Cezalı',
}

type AthleteOption = { id: string; name: string; surname: string | null }
type TrainerOption = { id: string; user_id: string | null; name: string; surname: string | null }

export type DersDetayModalProps = {
  scheduleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function DersDetayModal({ scheduleId, open, onOpenChange, onSaved }: DersDetayModalProps) {
  const [data, setData] = useState<DersDetayResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patching, setPatching] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [athletes, setAthletes] = useState<AthleteOption[]>([])
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')
  const [adding, setAdding] = useState(false)
  const [penalizeId, setPenalizeId] = useState<string | null>(null)
  const [trainers, setTrainers] = useState<TrainerOption[]>([])
  const [selectedCoachUserId, setSelectedCoachUserId] = useState<string>('')
  const [patchingCoach, setPatchingCoach] = useState(false)
  const [editingKontenjan, setEditingKontenjan] = useState(false)
  const [kontenjanInput, setKontenjanInput] = useState('')
  const [patchingKontenjan, setPatchingKontenjan] = useState(false)
  const [onaylaLoading, setOnaylaLoading] = useState(false)
  const [onayConfirmOpen, setOnayConfirmOpen] = useState(false)
  const [cezaliConfirmOpen, setCezaliConfirmOpen] = useState(false)
  const [cezaliSubmitting, setCezaliSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [demoOpen, setDemoOpen] = useState(false)
  const [demoForm, setDemoForm] = useState({ ad: '', soyad: '', telefon: '', email: '' })
  const [demoAdding, setDemoAdding] = useState(false)

  const fetchDetay = useCallback(async () => {
    if (!scheduleId || !open) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/franchise/ders-detay/${scheduleId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError((err as { error?: string }).error ?? 'Yüklenemedi')
        setData(null)
        return
      }
      const json = await res.json() as DersDetayResponse
      setData(json)
    } catch {
      setError('Sunucu hatası')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [scheduleId, open])

  useEffect(() => {
    fetchDetay()
  }, [fetchDetay])

  useEffect(() => {
    if (data?.ders) setSelectedCoachUserId(data.ders.coach_user_id ?? '')
  }, [data?.ders?.coach_user_id])

  const fetchTrainers = useCallback(async () => {
    const res = await fetch('/api/franchise/staff?role=trainer')
    const json = await res.json()
    const items = Array.isArray((json as { items?: TrainerOption[] }).items) ? (json as { items: TrainerOption[] }).items : []
    setTrainers(items)
  }, [])

  useEffect(() => {
    if (open) fetchTrainers()
  }, [open, fetchTrainers])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleCoachChange = useCallback(async (newUserId: string) => {
    if (!scheduleId) return
    setSelectedCoachUserId(newUserId)
    setPatchingCoach(true)
    try {
      const res = await fetch(`/api/franchise/schedule/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ antrenor_user_id: newUserId || null }),
      })
      if (res.ok) {
        await fetchDetay()
        onSaved?.()
      }
    } finally {
      setPatchingCoach(false)
    }
  }, [scheduleId, fetchDetay, onSaved])

  const updateStatus = useCallback(async (attendanceId: string, status: string) => {
    setPatching(attendanceId)
    try {
      const res = await fetch('/api/franchise/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [{ id: attendanceId, status }] }),
      })
      if (res.ok) await fetchDetay()
      onSaved?.()
    } finally {
      setPatching(null)
    }
  }, [fetchDetay, onSaved])

  const handlePenalize = useCallback(async (attendanceId: string) => {
    setPenalizeId(attendanceId)
    try {
      await updateStatus(attendanceId, 'penalized')
    } finally {
      setPenalizeId(null)
    }
  }, [updateStatus])

  const loadAthletes = useCallback(async () => {
    const res = await fetch('/api/franchise/athletes?status=active')
    const json = await res.json()
    const items = Array.isArray((json as { items?: AthleteOption[] }).items) ? (json as { items: AthleteOption[] }).items : []
    setAthletes(items)
    setSelectedAthleteId('')
  }, [])

  useEffect(() => {
    if (addOpen) loadAthletes()
  }, [addOpen, loadAthletes])

  const handleAddParticipant = useCallback(async () => {
    if (!selectedAthleteId || !data) return
    setAdding(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch('/api/franchise/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{
            athlete_id: selectedAthleteId,
            lesson_date: today,
            lesson_time: data.ders.saat,
            status: 'present',
          }],
        }),
      })
      if (res.ok) {
        setAddOpen(false)
        await fetchDetay()
        onSaved?.()
      }
    } finally {
      setAdding(false)
    }
  }, [selectedAthleteId, data, fetchDetay, onSaved])

  const participantIds = new Set((data?.participants ?? []).map((p) => p.athlete_id))
  const availableAthletes = athletes.filter((a) => !participantIds.has(a.id))

  const isOnaylandi = data?.ders?.ders_durumu === 'onaylandi'

  useEffect(() => {
    if (data?.kontenjan != null) setKontenjanInput(String(data.kontenjan))
  }, [data?.kontenjan])

  const handleKontenjanSave = useCallback(async () => {
    if (!scheduleId || !data) return
    const num = Math.min(999, Math.max(1, parseInt(kontenjanInput, 10) || 20))
    setPatchingKontenjan(true)
    try {
      const res = await fetch(`/api/franchise/schedule/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kontenjan: num }),
      })
      if (res.ok) {
        setEditingKontenjan(false)
        await fetchDetay()
        onSaved?.()
      }
    } finally {
      setPatchingKontenjan(false)
    }
  }, [scheduleId, data, kontenjanInput, fetchDetay, onSaved])

  const lessonDateToday = new Date().toISOString().slice(0, 10)

  const handleDersOnayla = useCallback(async () => {
    if (!scheduleId) return
    setOnayConfirmOpen(false)
    setOnaylaLoading(true)
    try {
      const res = await fetch('/api/franchise/ders-onayla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, tip: 'normal', lesson_date: lessonDateToday }),
      })
      const json = await res.json().catch(() => ({})) as { ok?: boolean; krediDusenSporcu?: number; toplamIslem?: number; error?: string }
      if (res.ok && json.ok) {
        setToast({ message: `Ders onaylandı. ${json.krediDusenSporcu ?? 0} sporcunun kredisi düşürüldü.`, type: 'success' })
        await fetchDetay()
        onSaved?.()
      } else {
        setToast({ message: (json as { error?: string }).error ?? 'Onaylama başarısız', type: 'error' })
      }
    } finally {
      setOnaylaLoading(false)
    }
  }, [scheduleId, fetchDetay, onSaved])

  const handleCezaliOnayla = useCallback(async () => {
    if (!scheduleId) return
    setCezaliSubmitting(true)
    try {
      const res = await fetch('/api/franchise/ders-onayla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, tip: 'cezali', lesson_date: lessonDateToday }),
      })
      const json = await res.json().catch(() => ({})) as { ok?: boolean; krediDusenSporcu?: number; error?: string }
      if (res.ok && json.ok) {
        setCezaliConfirmOpen(false)
        setToast({ message: `Cezalı onay tamamlandı. ${json.krediDusenSporcu ?? 0} sporcunun kredisi düşürüldü.`, type: 'success' })
        await fetchDetay()
        onSaved?.()
      } else {
        setToast({ message: (json as { error?: string }).error ?? 'Onaylama başarısız', type: 'error' })
      }
    } finally {
      setCezaliSubmitting(false)
    }
  }, [scheduleId, fetchDetay, onSaved])

  const handleDemoSubmit = useCallback(async () => {
    if (!scheduleId || !demoForm.ad.trim() || !demoForm.telefon.trim()) return
    setDemoAdding(true)
    try {
      const res = await fetch(`/api/franchise/ders-detay/${scheduleId}/demo-katilimci`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: demoForm.ad.trim(),
          soyad: demoForm.soyad.trim() || undefined,
          telefon: demoForm.telefon.trim(),
          email: demoForm.email.trim() || undefined,
        }),
      })
      if (res.ok) {
        setDemoOpen(false)
        setDemoForm({ ad: '', soyad: '', telefon: '', email: '' })
        await fetchDetay()
        onSaved?.()
      }
    } finally {
      setDemoAdding(false)
    }
  }, [scheduleId, demoForm, fetchDetay, onSaved])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ders detayı</DialogTitle>
          <DialogDescription>
            Yoklama ve katılımcı bilgisi
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive py-2">{error}</p>
        )}

        {!loading && data && (
          <>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{data.ders.ders_adi}</p>
              <p className="text-muted-foreground">
                {data.ders.brans ?? '—'} · {data.ders.saat} · {data.ders.gun}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-muted-foreground">
                  Kontenjan: <span className="font-medium text-foreground">{data.katilimciSayisi}/{data.kontenjan}</span> dolu
                </p>
                {editingKontenjan ? (
                  <span className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      className="w-16 h-7 text-xs"
                      value={kontenjanInput}
                      onChange={(e) => setKontenjanInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleKontenjanSave()}
                    />
                    <Button size="sm" className="h-7 text-xs" disabled={patchingKontenjan} onClick={handleKontenjanSave}>
                      {patchingKontenjan ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tamam'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingKontenjan(false)}>İptal</Button>
                  </span>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingKontenjan(true)}>
                    Kontenjan Düzenle
                  </Button>
                )}
              </div>
              {(() => {
                const currentCoach = data.ders.coach_user_id ? trainers.find((t) => t.user_id === data.ders.coach_user_id) : null
                const currentCoachName = currentCoach ? `${currentCoach.name} ${currentCoach.surname ?? ''}`.trim() : '—'
                return data.ders.coach_user_id ? (
                  <p className="text-muted-foreground text-xs">
                    Mevcut antrenör: <span className="font-medium text-foreground">{currentCoachName}</span>
                  </p>
                ) : null
              })()}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-muted-foreground whitespace-nowrap">Antrenör:</span>
                <select
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
                  value={selectedCoachUserId}
                  onChange={(e) => handleCoachChange(e.target.value)}
                  disabled={patchingCoach}
                >
                  <option value="">Seçin…</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.user_id ?? ''}>
                      {t.name} {t.surname ?? ''}
                    </option>
                  ))}
                </select>
                {patchingCoach && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Sadece bu ders etkilenir, diğer dersler değişmez.
              </p>
              {data.ders.coach_changed_at && (() => {
                const prevCoach = data.ders.previous_coach_user_id ? trainers.find((t) => t.user_id === data.ders.previous_coach_user_id) : null
                const currCoach = data.ders.coach_user_id ? trainers.find((t) => t.user_id === data.ders.coach_user_id) : null
                const prevName = prevCoach ? `${prevCoach.name} ${prevCoach.surname ?? ''}`.trim() : '—'
                const currName = currCoach ? `${currCoach.name} ${currCoach.surname ?? ''}`.trim() : '—'
                return (
                  <p className="text-xs text-muted-foreground">
                    Son değişiklik: {new Date(data.ders.coach_changed_at).toLocaleString('tr-TR')} — {prevName} → {currName}
                  </p>
                )
              })()}
            </div>

            <div className="flex-1 min-h-0 overflow-auto border rounded-md">
              <ul className="divide-y p-2">
                {data.participants.length === 0 ? (
                  <li className="py-4 text-center text-muted-foreground text-sm">Henüz katılımcı yok</li>
                ) : (
                  data.participants.map((p: DersDetayParticipant) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 py-2">
                      <span className="flex-1 min-w-0 font-medium truncate">{p.athlete_name}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant={p.status === 'present' ? 'default' : 'outline'}
                          className="h-7 text-xs"
                          disabled={patching === p.id}
                          onClick={() => updateStatus(p.id, 'present')}
                        >
                          {patching === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Geldi'}
                        </Button>
                        <Button
                          size="sm"
                          variant={p.status === 'absent' ? 'destructive' : 'outline'}
                          className="h-7 text-xs"
                          disabled={patching === p.id}
                          onClick={() => updateStatus(p.id, 'absent')}
                        >
                          Gelmedi
                        </Button>
                        <Button
                          size="sm"
                          variant={p.status === 'excused' ? 'secondary' : 'outline'}
                          className="h-7 text-xs"
                          disabled={patching === p.id}
                          onClick={() => updateStatus(p.id, 'excused')}
                        >
                          İzinli
                        </Button>
                        <Button
                          size="sm"
                          variant={p.status === 'penalized' ? 'default' : 'outline'}
                          className="h-7 text-xs"
                          disabled={patching === p.id || penalizeId === p.id}
                          onClick={() => handlePenalize(p.id)}
                        >
                          {penalizeId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
                          <span className="ml-0.5">Cezalı</span>
                        </Button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Katılımcı Ekle
              </Button>
              <Button type="button" variant="outline" onClick={() => setDemoOpen(true)}>
                Demo Katılımcı
              </Button>
              {!isOnaylandi && (
                <>
                  <Button
                    type="button"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setOnayConfirmOpen(true)}
                    disabled={onaylaLoading}
                  >
                    {onaylaLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Dersi Onayla
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setCezaliConfirmOpen(true)}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Cezalı Onayla
                  </Button>
                </>
              )}
              {isOnaylandi && (
                <Badge variant="secondary">Bu ders onaylandı</Badge>
              )}
            </DialogFooter>
          </>
        )}

        {addOpen && (
          <div className="absolute inset-0 z-10 bg-background/95 flex flex-col justify-center p-4 rounded-lg border">
            <p className="text-sm font-medium mb-2">Sporcu seçin</p>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={selectedAthleteId}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
            >
              <option value="">Seçin…</option>
              {availableAthletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.surname ?? ''}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setAddOpen(false)}>İptal</Button>
              <Button disabled={!selectedAthleteId || adding} onClick={handleAddParticipant}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Ekle
              </Button>
            </div>
          </div>
        )}

        {toast && (
          <div
            className={`fixed bottom-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg text-sm text-white ${
              toast.type === 'success' ? 'bg-green-600 dark:bg-green-700' : 'bg-destructive'
            }`}
            role="status"
          >
            {toast.message}
          </div>
        )}

        <AlertDialog open={onayConfirmOpen} onOpenChange={setOnayConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dersi onayla</AlertDialogTitle>
              <AlertDialogDescription>
                Gelenlerin kredisi 1 düşecek. Onaylıyor musunuz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); void handleDersOnayla() }}
                disabled={onaylaLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {onaylaLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Onayla
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={cezaliConfirmOpen} onOpenChange={setCezaliConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cezalı onay</AlertDialogTitle>
              <AlertDialogDescription>
                Gelmeyenlerin de kredisi düşecek. Emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cezaliSubmitting}>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); void handleCezaliOnayla() }}
                disabled={cezaliSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cezaliSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Onayla
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {demoOpen && (
          <div className="absolute inset-0 z-10 bg-background/95 flex flex-col justify-center p-4 rounded-lg border">
            <p className="text-sm font-medium text-foreground mb-2">Demo katılımcı (ad, soyad, telefon)</p>
            <div className="space-y-2">
              <div>
                <Label htmlFor="demo-ad" className="text-xs">Ad *</Label>
                <Input id="demo-ad" className="mt-0.5" value={demoForm.ad} onChange={(e) => setDemoForm((f) => ({ ...f, ad: e.target.value }))} placeholder="Ad" />
              </div>
              <div>
                <Label htmlFor="demo-soyad" className="text-xs">Soyad</Label>
                <Input id="demo-soyad" className="mt-0.5" value={demoForm.soyad} onChange={(e) => setDemoForm((f) => ({ ...f, soyad: e.target.value }))} placeholder="Soyad" />
              </div>
              <div>
                <Label htmlFor="demo-telefon" className="text-xs">Telefon *</Label>
                <Input id="demo-telefon" className="mt-0.5" value={demoForm.telefon} onChange={(e) => setDemoForm((f) => ({ ...f, telefon: e.target.value }))} placeholder="Telefon" />
              </div>
              <div>
                <Label htmlFor="demo-email" className="text-xs">E-posta (opsiyonel)</Label>
                <Input id="demo-email" type="email" className="mt-0.5" value={demoForm.email} onChange={(e) => setDemoForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-posta" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setDemoOpen(false)}>İptal</Button>
              <Button disabled={!demoForm.ad.trim() || !demoForm.telefon.trim() || demoAdding} onClick={handleDemoSubmit}>
                {demoAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Ekle
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
