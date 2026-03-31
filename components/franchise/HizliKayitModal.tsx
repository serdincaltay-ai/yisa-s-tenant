'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

const BRANSLAR = [
  'Artistik Cimnastik',
  'Ritmik Cimnastik',
  'Trampolin',
  'Genel Jimnastik',
  'Temel Hareket Egitimi',
  'Diger',
]

type PaketItem = { id: string; name: string }

export type HizliKayitModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const emptyForm = {
  ad: '',
  soyad: '',
  cinsiyet: '' as '' | 'E' | 'K',
  sube: '',
  gsm: '',
  dogum_tarihi: '',
  not: '',
  paket_id: '',
}

export function HizliKayitModal({ open, onOpenChange, onSuccess }: HizliKayitModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [paketler, setPaketler] = useState<PaketItem[]>([])
  const [sending, setSending] = useState(false)
  const [loadingPaketler, setLoadingPaketler] = useState(false)

  const fetchPaketler = useCallback(async () => {
    setLoadingPaketler(true)
    try {
      const res = await fetch('/api/packages')
      const data = await res.json()
      const items = Array.isArray(data?.items) ? data.items : []
      setPaketler(items.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
    } catch {
      setPaketler([])
    } finally {
      setLoadingPaketler(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setForm(emptyForm)
      fetchPaketler()
    }
  }, [open, fetchPaketler])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    if (!form.ad.trim()) return
    if (!form.soyad.trim()) return
    if (!form.cinsiyet) return
    if (!form.sube.trim()) return
    if (!form.gsm.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/franchise/ogrenci-kayit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: form.ad.trim(),
          soyad: form.soyad.trim(),
          cinsiyet: form.cinsiyet,
          sube: form.sube.trim(),
          gsm: form.gsm.trim(),
          dogum_tarihi: form.dogum_tarihi || undefined,
          not: form.not.trim() || undefined,
          paket_id: form.paket_id || undefined,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        alert(data?.error ?? 'Kayıt başarısız')
      }
    } catch {
      alert('İstek gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Hızlı Kayıt</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Yeni sporcu kaydı — zorunlu alanları doldurun.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hizli-ad" className="text-zinc-300">Ad *</Label>
              <Input
                id="hizli-ad"
                value={form.ad}
                onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))}
                placeholder="Ad"
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hizli-soyad" className="text-zinc-300">Soyad *</Label>
              <Input
                id="hizli-soyad"
                value={form.soyad}
                onChange={(e) => setForm((f) => ({ ...f, soyad: e.target.value }))}
                placeholder="Soyad"
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Cinsiyet *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cinsiyet"
                  value="E"
                  checked={form.cinsiyet === 'E'}
                  onChange={() => setForm((f) => ({ ...f, cinsiyet: 'E' }))}
                  className="rounded-full border-zinc-600 text-primary"
                />
                <span className="text-zinc-300">Erkek</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cinsiyet"
                  value="K"
                  checked={form.cinsiyet === 'K'}
                  onChange={() => setForm((f) => ({ ...f, cinsiyet: 'K' }))}
                  className="rounded-full border-zinc-600 text-primary"
                />
                <span className="text-zinc-300">Kız</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hizli-sube" className="text-zinc-300">Şube *</Label>
            <select
              id="hizli-sube"
              value={form.sube}
              onChange={(e) => setForm((f) => ({ ...f, sube: e.target.value }))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Seçin</option>
              {BRANSLAR.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hizli-gsm" className="text-zinc-300">GSM *</Label>
            <Input
              id="hizli-gsm"
              type="tel"
              value={form.gsm}
              onChange={(e) => setForm((f) => ({ ...f, gsm: e.target.value }))}
              placeholder="05XX XXX XX XX"
              className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hizli-dogum" className="text-zinc-300">Doğum tarihi (opsiyonel)</Label>
            <Input
              id="hizli-dogum"
              type="date"
              value={form.dogum_tarihi}
              onChange={(e) => setForm((f) => ({ ...f, dogum_tarihi: e.target.value }))}
              className="border-zinc-700 bg-zinc-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hizli-not" className="text-zinc-300">Not (opsiyonel)</Label>
            <Textarea
              id="hizli-not"
              value={form.not}
              onChange={(e) => setForm((f) => ({ ...f, not: e.target.value }))}
              placeholder="Not"
              rows={2}
              className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hizli-paket" className="text-zinc-300">Paket (opsiyonel)</Label>
            <select
              id="hizli-paket"
              value={form.paket_id}
              onChange={(e) => setForm((f) => ({ ...f, paket_id: e.target.value }))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seçmeyin</option>
              {loadingPaketler ? (
                <option disabled>Yükleniyor...</option>
              ) : (
                paketler.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              )}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600 text-zinc-300"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={sending} className="bg-primary text-primary-foreground">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
