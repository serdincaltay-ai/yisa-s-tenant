'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Plus, Save, Trash2, Dumbbell } from 'lucide-react'

type AntrenmanPlani = {
  id: string
  baslik: string
  brans: string
  seviye: string
  sure_dk: number
  hareketler: Array<{ ad: string; set: number; tekrar: string; aciklama: string }>
  created_at: string
}

type YeniHareket = { ad: string; set: number; tekrar: string; aciklama: string }

const bosHareket: YeniHareket = { ad: '', set: 3, tekrar: '10', aciklama: '' }

export default function AntrenmanPlaniPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [planlar, setPlanlar] = useState<AntrenmanPlani[]>([])
  const [showForm, setShowForm] = useState(false)
  const [baslik, setBaslik] = useState('')
  const [brans, setBrans] = useState('')
  const [seviye, setSeviye] = useState('')
  const [sureDk, setSureDk] = useState(60)
  const [hareketler, setHareketler] = useState<YeniHareket[]>([{ ...bosHareket }])
  const [toast, setToast] = useState<string | null>(null)

  const fetchPlanlar = useCallback(() => {
    fetch('/api/antrenor/antrenman-plani')
      .then((r) => r.json())
      .then((d) => setPlanlar(d.planlar ?? []))
      .catch(() => setPlanlar([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchPlanlar() }, [fetchPlanlar])

  const handleHareketEkle = () => {
    setHareketler((prev) => [...prev, { ...bosHareket }])
  }

  const handleHareketSil = (idx: number) => {
    setHareketler((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateHareket = (idx: number, field: keyof YeniHareket, value: string | number) => {
    setHareketler((prev) => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h))
  }

  const handleKaydet = async () => {
    if (!baslik.trim()) {
      setToast('Plan başlığı zorunludur')
      setTimeout(() => setToast(null), 3000)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/antrenor/antrenman-plani', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baslik: baslik.trim(),
          brans,
          seviye,
          sure_dk: sureDk,
          hareketler: hareketler.filter((h) => h.ad.trim()),
        }),
      })
      const d = await res.json()
      if (d.ok) {
        setToast('Antrenman planı kaydedildi!')
        setBaslik('')
        setBrans('')
        setSeviye('')
        setSureDk(60)
        setHareketler([{ ...bosHareket }])
        setShowForm(false)
        fetchPlanlar()
      } else {
        setToast(d.error || 'Kayıt başarısız')
      }
    } catch {
      setToast('Bağlantı hatası')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
          Antrenman Planları
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-2 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Plan
        </button>
      </div>

      {toast && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm text-cyan-400">
          {toast}
        </div>
      )}

      {/* Yeni Plan Formu */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Yeni Antrenman Planı</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-400">Plan Başlığı *</label>
              <input
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="örn: Temel Cimnastik Programı"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">Branş</label>
              <input
                value={brans}
                onChange={(e) => setBrans(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="örn: Artistik Cimnastik"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">Seviye</label>
              <input
                value={seviye}
                onChange={(e) => setSeviye(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="örn: Başlangıç"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">Süre (dk)</label>
              <input
                type="number"
                value={sureDk}
                onChange={(e) => setSureDk(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Hareketler */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400">Hareketler</label>
              <button
                onClick={handleHareketEkle}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                + Hareket Ekle
              </button>
            </div>
            <div className="space-y-2">
              {hareketler.map((h, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid gap-2 sm:grid-cols-4">
                    <input
                      value={h.ad}
                      onChange={(e) => updateHareket(i, 'ad', e.target.value)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      placeholder="Hareket adı"
                    />
                    <input
                      type="number"
                      value={h.set}
                      onChange={(e) => updateHareket(i, 'set', Number(e.target.value))}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      placeholder="Set"
                    />
                    <input
                      value={h.tekrar}
                      onChange={(e) => updateHareket(i, 'tekrar', e.target.value)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      placeholder="Tekrar"
                    />
                    <input
                      value={h.aciklama}
                      onChange={(e) => updateHareket(i, 'aciklama', e.target.value)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                      placeholder="Açıklama"
                    />
                  </div>
                  {hareketler.length > 1 && (
                    <button onClick={() => handleHareketSil(i)} className="text-red-400 hover:text-red-300 mt-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleKaydet}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 text-zinc-950 px-4 py-2 text-sm font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Planı Kaydet
          </button>
        </div>
      )}

      {/* Mevcut Planlar */}
      {planlar.length === 0 && !showForm ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-zinc-400 text-sm">Henüz antrenman planı oluşturulmamış.</p>
        </div>
      ) : (
        planlar.map((p) => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">{p.baslik}</h3>
              <div className="flex items-center gap-2">
                {p.brans && (
                  <span className="rounded-full bg-cyan-400/10 text-cyan-400 text-xs px-2 py-0.5">{p.brans}</span>
                )}
                {p.seviye && (
                  <span className="rounded-full bg-purple-400/10 text-purple-400 text-xs px-2 py-0.5">{p.seviye}</span>
                )}
                <span className="text-xs text-zinc-500">{p.sure_dk} dk</span>
              </div>
            </div>
            {p.hareketler && p.hareketler.length > 0 && (
              <div className="mt-2 space-y-1">
                {p.hareketler.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-zinc-800 py-1.5 last:border-0">
                    <span className="text-white">{h.ad}</span>
                    <span className="text-zinc-400">{h.set}x{h.tekrar} {h.aciklama ? `— ${h.aciklama}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </main>
  )
}
