'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'
import { ArrowLeft, TrendingUp } from 'lucide-react'

type Child = { id: string; name: string; surname?: string }
type Olcum = { id: string; olcum_tarihi: string; boy?: number; kilo?: number; esneklik?: number; genel_degerlendirme?: string }

export default function VeliGelisimPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState('')
  const [items, setItems] = useState<Olcum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/veli/children')
      .then((r) => r.json())
      .then((d) => {
        const list = d.items ?? []
        setChildren(list)
        if (list.length && !selected) setSelected(list[0].id)
      })
      .catch(() => setChildren([]))
  }, [])

  useEffect(() => {
    if (!selected) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/veli/gelisim?athlete_id=${selected}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [selected])

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <PanelHeader panelName="VELİ PANELİ" />

      <main className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/veli/dashboard" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
              Gelişim Takibi
            </h1>
          </div>
        </div>

        {/* Sporcu Seçici — pill butonlar */}
        {children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  selected === c.id
                    ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {c.name} {c.surname ?? ''}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-zinc-400">Yükleniyor...</p>
        ) : items.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <TrendingUp className="h-12 w-12 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-zinc-400">Henüz ölçüm kaydı yok.</p>
          </div>
        ) : (
          <>
            {/* Genel Puan Kartı */}
            {items[0] && (
              <div className="bg-zinc-900 border border-cyan-400/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/10">
                    <span className="text-2xl font-bold text-cyan-400">
                      {items[0].boy ?? '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Son Ölçüm</p>
                    <p className="text-white font-semibold">
                      {items[0].boy != null && `${items[0].boy} cm`}
                      {items[0].boy != null && items[0].kilo != null && ' · '}
                      {items[0].kilo != null && `${items[0].kilo} kg`}
                    </p>
                    <p className="text-xs text-zinc-500">{items[0].olcum_tarihi}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Boy & Kilo Geçmişi */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Boy & Kilo Geçmişi</h3>
              <div className="space-y-3">
                {items.slice(0, 8).map((o) => (
                  <div key={o.id} className="flex justify-between border-b border-zinc-800 pb-2 text-sm last:border-0">
                    <span className="text-zinc-400">{o.olcum_tarihi}</span>
                    <span className="text-white">
                      {o.boy != null && `${o.boy} cm`}
                      {o.boy != null && o.kilo != null && ' · '}
                      {o.kilo != null && `${o.kilo} kg`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Esneklik */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Esneklik</h3>
              <div className="space-y-2">
                {items.filter((o) => o.esneklik != null).slice(0, 8).map((o) => (
                  <div key={o.id} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{o.olcum_tarihi}</span>
                    <span className="text-white">{o.esneklik} cm</span>
                  </div>
                ))}
                {items.filter((o) => o.esneklik != null).length === 0 && (
                  <p className="text-zinc-500 text-sm">Veri yok</p>
                )}
              </div>
            </div>

            {/* Antrenör Notu / Değerlendirme */}
            {items.some((o) => o.genel_degerlendirme) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Antrenör Notu</h3>
                <p className="text-sm text-zinc-300">
                  {items.find((o) => o.genel_degerlendirme)?.genel_degerlendirme}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <VeliBottomNav />
    </div>
  )
}
