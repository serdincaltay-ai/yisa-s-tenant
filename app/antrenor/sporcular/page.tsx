'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

type Sporcu = {
  id: string
  name: string
  surname?: string
  branch?: string
  level?: string
  group?: string
  status?: string
  sonYoklama: { tarih: string; durum: string } | null
}

export default function AntrenorSporcularPage() {
  const [items, setItems] = useState<Sporcu[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/antrenor/sporcular')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <main className="p-4 space-y-4">
      <div>
                <h1 className="text-xl font-bold text-white">Sporcularım</h1>
                <p className="text-sm text-zinc-400">Size atanan sporcuların listesi.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
          Sporcular ({items.length})
        </h3>
        <p className="text-xs text-zinc-500 mb-3">Detay ve yoklama geçmişi için tıklayın</p>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4">Henüz atanmış sporcu yok.</p>
        ) : (
          <div className="space-y-2">
            {items.map((s) => (
              <Link
                key={s.id}
                href={`/antrenor/sporcular/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-700 p-3 hover:border-cyan-400/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 font-semibold text-sm">
                    {(s.name?.[0] ?? '') + (s.surname?.[0] ?? '')}
                  </div>
                  <div>
                    <p className="font-medium text-white">{s.name} {s.surname ?? ''}</p>
                    <p className="text-xs text-zinc-500">
                      {[s.branch, s.level, s.group].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.sonYoklama && (
                    <>
                      {s.sonYoklama.durum === 'geldi' && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1">
                          <CheckCircle className="h-3 w-3" strokeWidth={1.5} />
                          {s.sonYoklama.tarih}
                        </span>
                      )}
                      {s.sonYoklama.durum === 'gelmedi' && (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/20 text-red-400 text-xs px-2.5 py-1">
                          <XCircle className="h-3 w-3" strokeWidth={1.5} />
                          {s.sonYoklama.tarih}
                        </span>
                      )}
                      {s.sonYoklama.durum === 'izinli' && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1">
                          <Clock className="h-3 w-3" strokeWidth={1.5} />
                          {s.sonYoklama.tarih}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
