'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Plus, Zap, UserPlus, UserMinus } from 'lucide-react'
import { BRANS_RENK, DEFAULT_BRANS_RENK } from '@/lib/tenant-template-config'
import type { RoutineLessonItem } from '@/app/api/franchise/rutin-dersler/route'
import type { RoutineLessonDetail } from '@/app/api/franchise/rutin-dersler/[id]/route'

const GUNLER = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar'] as const
const BRANS_LIST = Object.keys(BRANS_RENK)

type TrainerOption = { id: string; user_id?: string | null; name: string; surname?: string | null }
type AthleteOption = { id: string; name: string; surname: string | null }
type GroupOption = { id: string; grup_adi: string }

function bransStyle(brans: string | null): { bg: string; text: string; border: string } {
  if (!brans) return DEFAULT_BRANS_RENK
  return BRANS_RENK[brans] ?? DEFAULT_BRANS_RENK
}

export default function RutinDerslerPage() {
  const [items, setItems] = useState<RoutineLessonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RoutineLessonDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [uretLoading, setUretLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    gun: 'Pazartesi',
    saat: '09:00',
    ders_adi: '',
    brans: '',
    seviye: '',
    coach_user_id: '',
    kontenjan: 20,
    oda: '',
    grup_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [trainers, setTrainers] = useState<TrainerOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [athletes, setAthletes] = useState<AthleteOption[]>([])
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [selectedAthleteId, setSelectedAthleteId] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)
  const [patchingCoach, setPatchingCoach] = useState(false)

  const fetchList = useCallback(async () => {
    const res = await fetch('/api/franchise/rutin-dersler')
    const data = (await res.json()) as { items?: RoutineLessonItem[] }
    setItems(Array.isArray(data?.items) ? data.items : [])
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchList().finally(() => setLoading(false))
  }, [fetchList])

  useEffect(() => {
    if (newOpen) {
      setForm({ gun: 'Pazartesi', saat: '09:00', ders_adi: '', brans: '', seviye: '', coach_user_id: '', kontenjan: 20, oda: '', grup_id: '' })
      fetch('/api/franchise/staff?role=trainer')
        .then((r) => r.json())
        .then((d: { items?: TrainerOption[] }) => setTrainers(Array.isArray(d?.items) ? d.items : []))
      fetch('/api/franchise/gruplar')
        .then((r) => r.json())
        .then((d: { items?: GroupOption[] }) => setGroups(Array.isArray(d?.items) ? d.items : []))
    }
  }, [newOpen])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/franchise/rutin-dersler/${id}`)
      const data = (await res.json()) as RoutineLessonDetail
      setDetail(res.ok ? data : null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (detailId) {
      fetchDetail(detailId)
      fetch('/api/franchise/staff?role=trainer')
        .then((r) => r.json())
        .then((d: { items?: TrainerOption[] }) => setTrainers(Array.isArray(d?.items) ? d.items : []))
    } else setDetail(null)
  }, [detailId, fetchDetail])

  useEffect(() => {
    if (detail && addStudentOpen) {
      fetch('/api/franchise/athletes?status=active')
        .then((r) => r.json())
        .then((d: { items?: AthleteOption[] }) => setAthletes(Array.isArray(d?.items) ? d.items : []))
      setSelectedAthleteId('')
    }
  }, [detail, addStudentOpen])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleCreate = async () => {
    if (!form.ders_adi.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/rutin-dersler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gun: form.gun,
          saat: form.saat,
          ders_adi: form.ders_adi.trim() || 'Ders',
          brans: form.brans.trim() || null,
          seviye: form.seviye.trim() || null,
          coach_user_id: form.coach_user_id.trim() || null,
          kontenjan: form.kontenjan,
          oda: form.oda.trim() || null,
          grup_id: form.grup_id.trim() || null,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        setNewOpen(false)
        fetchList()
        setToast({ message: 'Rutin ders eklendi', type: 'success' })
      } else {
        setToast({ message: data?.error ?? 'Kayıt başarısız', type: 'error' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUret = async () => {
    setUretLoading(true)
    try {
      const res = await fetch('/api/franchise/rutin-dersler/uret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = (await res.json()) as { ok?: boolean; uretilenDers?: number; uretilenYoklama?: number; error?: string }
      if (data?.ok) {
        setToast({
          message: `Üretim tamamlandı: ${data.uretilenDers ?? 0} ders, ${data.uretilenYoklama ?? 0} yoklama kaydı`,
          type: 'success',
        })
        fetchList()
      } else {
        setToast({ message: data?.error ?? 'Üretim başarısız', type: 'error' })
      }
    } finally {
      setUretLoading(false)
    }
  }

  const handleAddStudent = async () => {
    if (!detailId || !selectedAthleteId) return
    setAddingStudent(true)
    try {
      const res = await fetch(`/api/franchise/rutin-dersler/${detailId}/ogrenciler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athlete_id: selectedAthleteId }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        setAddStudentOpen(false)
        fetchDetail(detailId)
        fetchList()
        setToast({ message: 'Öğrenci eklendi', type: 'success' })
      } else setToast({ message: data?.error ?? 'Eklenemedi', type: 'error' })
    } finally {
      setAddingStudent(false)
    }
  }

  const handleRemoveStudent = async (athleteId: string) => {
    if (!detailId) return
    try {
      const res = await fetch(`/api/franchise/rutin-dersler/${detailId}/ogrenciler/${athleteId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchDetail(detailId)
        fetchList()
      }
    } catch {
      // ignore
    }
  }

  const handleCoachChange = async (coach_user_id: string) => {
    if (!detailId) return
    setPatchingCoach(true)
    try {
      const res = await fetch(`/api/franchise/rutin-dersler/${detailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach_user_id: coach_user_id || null }),
      })
      if (res.ok) {
        fetchDetail(detailId)
        fetchList()
      }
    } finally {
      setPatchingCoach(false)
    }
  }

  const byDay = React.useMemo(() => {
    const map: Record<string, RoutineLessonItem[]> = {}
    for (const g of GUNLER) map[g] = []
    for (const item of items) {
      if (map[item.gun]) map[item.gun].push(item)
    }
    for (const g of GUNLER) map[g].sort((a, b) => a.saat.localeCompare(b.saat))
    return map
  }, [items])

  const existingStudentIds = new Set(detail?.ogrenciler?.map((s) => s.id) ?? [])
  const availableAthletes = athletes.filter((a) => !existingStudentIds.has(a.id))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b bg-card px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Rutin Dersler</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Rutin Ders
          </Button>
          <Button size="sm" onClick={handleUret} disabled={uretLoading}>
            {uretLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Otomatik Üret
          </Button>
        </div>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">Henüz rutin ders tanımlanmamış</p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${GUNLER.length}, minmax(0, 1fr))` }}>
            {GUNLER.map((gun) => (
              <div key={gun} className="rounded-lg border bg-card p-2">
                <h2 className="text-sm font-medium text-foreground mb-2 sticky top-14 bg-card py-1">{gun}</h2>
                <div className="space-y-2">
                  {byDay[gun]?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Rutin yok</p>
                  ) : (
                    (byDay[gun] ?? []).map((lesson) => {
                      const style = bransStyle(lesson.brans)
                      return (
                        <Card
                          key={lesson.id}
                          className={`cursor-pointer transition-colors hover:opacity-90 ${style.border} border`}
                          onClick={() => setDetailId(lesson.id)}
                        >
                          <CardContent className="p-2">
                            <p className={`font-medium text-xs truncate ${style.text}`}>{lesson.ders_adi}</p>
                            <p className="text-[10px] text-muted-foreground">{lesson.saat}</p>
                            {lesson.coach_name && <p className="text-[10px] text-muted-foreground truncate">{lesson.coach_name}</p>}
                            <p className="text-[10px] text-muted-foreground">
                              {lesson.student_count}/{lesson.kontenjan}
                            </p>
                            {lesson.oda && <p className="text-[10px] text-muted-foreground truncate">{lesson.oda}</p>}
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yeni Rutin Ders modal */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni rutin ders</DialogTitle>
            <DialogDescription>Haftalık tekrarlayan ders tanımı</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Gün</Label>
                <select
                  className="w-full mt-0.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                  value={form.gun}
                  onChange={(e) => setForm((f) => ({ ...f, gun: e.target.value }))}
                >
                  {GUNLER.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Saat</Label>
                <Input
                  type="text"
                  className="mt-0.5"
                  value={form.saat}
                  onChange={(e) => setForm((f) => ({ ...f, saat: e.target.value }))}
                  placeholder="09:00"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Ders adı *</Label>
              <Input
                className="mt-0.5"
                value={form.ders_adi}
                onChange={(e) => setForm((f) => ({ ...f, ders_adi: e.target.value }))}
                placeholder="Örn. Mini Cimnastik"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Branş</Label>
                <select
                  className="w-full mt-0.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                  value={form.brans}
                  onChange={(e) => setForm((f) => ({ ...f, brans: e.target.value }))}
                >
                  <option value="">Seçin</option>
                  {BRANS_LIST.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Kontenjan</Label>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  className="mt-0.5"
                  value={form.kontenjan}
                  onChange={(e) => setForm((f) => ({ ...f, kontenjan: parseInt(e.target.value, 10) || 20 }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Antrenör</Label>
              <select
                className="w-full mt-0.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                value={form.coach_user_id}
                onChange={(e) => setForm((f) => ({ ...f, coach_user_id: e.target.value }))}
              >
                <option value="">Seçin</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.user_id ?? ''}>{t.name} {t.surname ?? ''}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Oda</Label>
              <Input
                className="mt-0.5"
                value={form.oda}
                onChange={(e) => setForm((f) => ({ ...f, oda: e.target.value }))}
                placeholder="Salon A"
              />
            </div>
            <div>
              <Label className="text-xs">Grup</Label>
              <select
                className="w-full mt-0.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                value={form.grup_id}
                onChange={(e) => setForm((f) => ({ ...f, grup_id: e.target.value }))}
              >
                <option value="">Seçin</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.grup_adi}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>İptal</Button>
            <Button onClick={handleCreate} disabled={saving || !form.ders_adi.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detay modal */}
      <Dialog open={detailId !== null} onOpenChange={(open) => { if (!open) { setDetailId(null); setAddStudentOpen(false) } }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Rutin ders detayı</DialogTitle>
            <DialogDescription>Öğrenci listesi ve antrenör</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <>
              <p className="font-medium text-foreground">{detail.ders.ders_adi}</p>
              <p className="text-sm text-muted-foreground">{detail.ders.gun} · {detail.ders.saat}</p>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Antrenör</Label>
                <select
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
                  value={detail.ders.coach_user_id ?? ''}
                  onChange={(e) => handleCoachChange(e.target.value)}
                  disabled={patchingCoach}
                >
                  <option value="">Seçin</option>
                  {trainers.length === 0 && (detail.ders.coach_user_id ? <option value={detail.ders.coach_user_id}>{detail.ders.coach_name ?? '—'}</option> : null)}
                  {trainers.map((t) => (
                    <option key={t.id} value={t.user_id ?? ''}>{t.name} {t.surname ?? ''}</option>
                  ))}
                </select>
                {patchingCoach && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {addStudentOpen ? (
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-foreground">Öğrenci seçin</p>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={selectedAthleteId}
                    onChange={(e) => setSelectedAthleteId(e.target.value)}
                  >
                    <option value="">Seçin</option>
                    {availableAthletes.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} {a.surname ?? ''}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAddStudentOpen(false)}>İptal</Button>
                    <Button size="sm" disabled={!selectedAthleteId || addingStudent} onClick={handleAddStudent}>
                      {addingStudent ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Ekle
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="flex-1 min-h-0 overflow-auto border rounded-md p-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Öğrenciler ({detail.ogrenciler?.length ?? 0})</p>
                {detail.ogrenciler?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Henüz öğrenci yok</p>
                ) : (
                  <ul className="space-y-1">
                    {detail.ogrenciler?.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{s.name} {s.surname ?? ''}</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleRemoveStudent(s.id)}>
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                {!addStudentOpen && (
                  <Button variant="outline" size="sm" onClick={() => setAddStudentOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Öğrenci ekle
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${
            toast.type === 'success' ? 'bg-green-600/90' : 'bg-destructive/90'
          } text-white`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
