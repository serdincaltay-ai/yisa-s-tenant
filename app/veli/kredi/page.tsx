'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'
import { ArrowLeft, Coins, AlertTriangle, Loader2 } from 'lucide-react'

type Paket = { isim: string; saat: number; fiyat: number }
type Child = { id: string; name: string; surname?: string; ders_kredisi?: number; toplam_kredi?: number }

export default function VeliKrediPage() {
  const [packages, setPackages] = useState<Paket[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [selectedPaket, setSelectedPaket] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/veli/kredi')
      .then((r) => r.json())
      .then((d) => {
        setPackages(d.packages ?? [])
        setChildren(d.children ?? [])
        if (d.children?.length && !selectedChild) setSelectedChild(d.children[0].id)
      })
      .catch(() => {
        setPackages([])
        setChildren([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSatinAl = async () => {
    if (!selectedChild || selectedPaket < 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/veli/kredi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athlete_id: selectedChild, paket_index: selectedPaket, odeme_yontemi: 'nakit' }),
      })
      const j = await res.json()
      if (res.ok && j.ok) {
        setChildren((prev) => prev.map((c) => (c.id === selectedChild ? { ...c, ders_kredisi: j.ders_kredisi } : c)))
      } else {
        alert(j.error ?? 'İşlem başarısız')
      }
    } catch {
      alert('İşlem başarısız')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <PanelHeader panelName="VELİ PANELİ" />

      <main className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/veli/dashboard" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
            Kredi Satın Al
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <>
            {/* Cocuk Secimi */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Çocuk Seçin</h3>
              <p className="text-xs text-zinc-500 mb-3">Hangi çocuk için kredi alacaksınız?</p>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white text-sm focus:border-cyan-400 focus:outline-none"
              >
                <option value="">Seçin</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.surname ?? ''} — Kalan: {(c.ders_kredisi ?? 0)} ders
                  </option>
                ))}
              </select>
            </div>

            {/* Paketler */}
            {packages.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                <p className="text-sm text-zinc-400">Henüz kredi paketi tanımlanmamış. Tesisinizle iletişime geçin.</p>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Paket Seçin</h3>
                <p className="text-xs text-zinc-500 mb-3">Ders kredisi paketleri</p>
                <div className="space-y-3">
                  {packages.map((p, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPaket(i)}
                      className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-300 ${
                        selectedPaket === i
                          ? 'border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-white">{p.isim}</p>
                        <p className="text-sm text-zinc-400">{p.saat} ders hakkı</p>
                      </div>
                      <p className="font-bold text-white">{p.fiyat.toLocaleString('tr-TR')} TL</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSatinAl}
                  disabled={saving || !selectedChild || selectedPaket < 0}
                  className="w-full mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 text-sm font-medium text-zinc-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'İşleniyor...' : 'Satın Al'}
                </button>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <p className="text-sm text-zinc-300">
                Kredi bittiğinde yeni paket almanız gerekir. Antrenör yoklamada &quot;Geldi&quot; işaretlendiğinde 1 ders hakkı düşer.
              </p>
            </div>
          </>
        )}
      </main>

      <VeliBottomNav />
    </div>
  )
}
