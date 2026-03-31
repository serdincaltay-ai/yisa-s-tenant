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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { BRANS_RENK } from '@/lib/tenant-template-config'

const BRANS_LIST = Object.keys(BRANS_RENK)
const GUN_TR: Record<number, string> = {
  0: 'Pazar',
  1: 'Pazartesi',
  2: 'Sali',
  3: 'Carsamba',
  4: 'Persembe',
  5: 'Cuma',
  6: 'Cumartesi',
}

type StaffItem = { id: string; name: string; surname?: string | null }

export type YeniRandevuModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStart: Date | null
  initialEnd: Date | null
  onSaved?: () => void
}

function formatTime(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Saat karşılaştırması için normalize (9:00 ve 09:00 aynı sayılır) */
function normalizeSaat(s: string): string {
  const parts = String(s).trim().split(/[:\s]/)
  const h = Math.min(23, Math.max(0, parseInt(parts[0] ?? '0', 10) || 0))
  const m = Math.min(59, Math.max(0, parseInt(parts[1] ?? '0', 10) || 0))
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function dateToGun(d: Date): string {
  return GUN_TR[d.getDay()] ?? 'Pazartesi'
}

export function YeniRandevuModal({
  open,
  onOpenChange,
  initialStart,
  initialEnd,
  onSaved,
}: YeniRandevuModalProps) {
  const [staff, setStaff] = useState<StaffItem[]>([])
  const [dersAdi, setDersAdi] = useState('')
  const [brans, setBrans] = useState('')
  const [antrenorId, setAntrenorId] = useState<string>('')
  const [kontenjan, setKontenjan] = useState<string>('')
  const [tekrar, setTekrar] = useState<'haftalik' | 'tek'>('haftalik')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingSlots, setExistingSlots] = useState<Array<{ gun: string; saat: string }>>([])

  const startDate = initialStart ?? new Date()
  const gun = dateToGun(startDate)
  const saat = formatTime(startDate)

  useEffect(() => {
    if (open) {
      setDersAdi('')
      setBrans('')
      setAntrenorId('')
      setKontenjan('20')
      setTekrar('haftalik')
      setError(null)
    }
  }, [open])

  const fetchStaff = useCallback(async () => {
    const res = await fetch('/api/franchise/staff?role=trainer')
    const data = (await res.json()) as { items?: StaffItem[] }
    setStaff(Array.isArray(data?.items) ? data.items : [])
  }, [])

  useEffect(() => {
    if (open) fetchStaff()
  }, [open, fetchStaff])

  useEffect(() => {
    if (!open) return
    fetch('/api/franchise/schedule')
      .then((r) => r.json())
      .then((data: { items?: Array<{ gun: string; saat: string }> }) => {
        const items = Array.isArray(data?.items) ? data.items : []
        setExistingSlots(items.map((row) => ({ gun: row.gun, saat: row.saat })))
      })
      .catch(() => setExistingSlots([]))
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const ders = dersAdi.trim() || 'Ders'
    const kontenjanNum = Math.min(999, Math.max(1, parseInt(kontenjan, 10) || 20))
    const conflict = existingSlots.some((s) => s.gun === gun && normalizeSaat(s.saat) === normalizeSaat(saat))
    if (conflict) {
      setError('Bu gün ve saatte zaten bir ders var!')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/franchise/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gun,
          saat,
          ders_adi: ders,
          brans: brans.trim() || null,
          antrenor_id: antrenorId || null,
          seviye: null,
          kontenjan: kontenjanNum,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (data?.ok) {
        onOpenChange(false)
        onSaved?.()
      } else {
        setError(data?.error ?? 'Kayıt başarısız')
      }
    } catch {
      setError('İstek gönderilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni randevu / ders</DialogTitle>
          <DialogDescription>
            Tarih: {startDate.toLocaleDateString('tr-TR')} · Saat: {saat} · Gün: {gun}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ders_adi">Ders adı</Label>
            <Input
              id="ders_adi"
              value={dersAdi}
              onChange={(e) => setDersAdi(e.target.value)}
              placeholder="Örn. Temel Cimnastik"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brans">Branş</Label>
            <select
              id="brans"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={brans}
              onChange={(e) => setBrans(e.target.value)}
            >
              <option value="">Seçin…</option>
              {BRANS_LIST.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="antrenor">Antrenör</Label>
            <select
              id="antrenor"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={antrenorId}
              onChange={(e) => setAntrenorId(e.target.value)}
            >
              <option value="">Seçin…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.surname ?? ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kontenjan">Kontenjan</Label>
            <Input
              id="kontenjan"
              type="number"
              min={1}
              max={999}
              value={kontenjan}
              onChange={(e) => setKontenjan(e.target.value)}
              placeholder="20"
            />
          </div>

          <div className="space-y-2">
            <Label>Tekrar</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tekrar"
                  checked={tekrar === 'haftalik'}
                  onChange={() => setTekrar('haftalik')}
                  className="rounded-full"
                />
                <span className="text-sm">Haftalık</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tekrar"
                  checked={tekrar === 'tek'}
                  onChange={() => setTekrar('tek')}
                  className="rounded-full"
                />
                <span className="text-sm">Tek seferlik</span>
              </label>
            </div>
            {tekrar === 'tek' && (
              <p className="text-xs text-muted-foreground">
                Tek seferlik kayıt şu an haftalık slota eklenir; ileride ayrı desteklenebilir.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
