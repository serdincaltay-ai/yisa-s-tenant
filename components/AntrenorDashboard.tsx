'use client'

import * as React from 'react'

export interface AntrenorDashboardProps {
  antrenorAdi?: string
  grupAdi?: string
}

const GRUP = [
  { id: 1, ad: 'Ada Y.',     yas: 8, durum: 'mevcut' },
  { id: 2, ad: 'Mert K.',    yas: 9, durum: 'mevcut' },
  { id: 3, ad: 'Elif S.',    yas: 8, durum: 'gec' },
  { id: 4, ad: 'Burak A.',   yas: 9, durum: 'mevcut' },
  { id: 5, ad: 'Defne T.',   yas: 8, durum: 'yok' },
  { id: 6, ad: 'Kerem Ö.',   yas: 9, durum: 'mevcut' },
] as const

const DURUM_RENK: Record<typeof GRUP[number]['durum'], string> = {
  mevcut: 'bg-emerald-400/20 text-emerald-300',
  gec:    'bg-amber-400/20 text-amber-300',
  yok:    'bg-rose-400/20 text-rose-300',
}

const PLAN = [
  { saat: '17:00', baslik: 'Isınma + esneklik (15 dk)' },
  { saat: '17:15', baslik: 'Temel cimnastik formu (25 dk)' },
  { saat: '17:40', baslik: 'Denge & koordinasyon istasyonu (20 dk)' },
  { saat: '18:00', baslik: 'Ölçüm + soğuma (15 dk)' },
]

export function AntrenorDashboard({
  antrenorAdi = 'Antr. Mert',
  grupAdi = 'BJK Tuzla · 8-9 Yaş Grubu',
}: AntrenorDashboardProps) {
  const [secili, setSecili] = React.useState<number | null>(GRUP[0]?.id ?? null)
  const [boy, setBoy] = React.useState('')
  const [kilo, setKilo] = React.useState('')
  const [esneklik, setEsneklik] = React.useState('')
  const [denge, setDenge] = React.useState('')
  const [not, setNot] = React.useState('')

  const handleKaydet = (e: React.FormEvent) => {
    e.preventDefault()
    // Gercek implementasyon: Patron API -> /api/measurements
    console.log('Kaydet:', { secili, boy, kilo, esneklik, denge })
    setBoy(''); setKilo(''); setEsneklik(''); setDenge('')
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
      {/* HEADER */}
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{antrenorAdi}</h2>
          <p className="text-sm text-slate-400">{grupAdi}</p>
        </div>
        <div className="text-xs text-slate-500">
          Bugün · {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        {/* GRUP LİSTESİ */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Grup ({GRUP.length})</h3>
          <ul className="space-y-2">
            {GRUP.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSecili(s.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    secili === s.id
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <span>
                    <span className="font-medium">{s.ad}</span>
                    <span className="ml-2 text-xs text-slate-500">{s.yas}y</span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DURUM_RENK[s.durum]}`}>
                    {s.durum}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* SAĞ KOLON: ÖLÇÜM FORM + PLAN + NOT */}
        <div className="space-y-5">
          {/* ÖLÇÜM FORMU */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Ölçüm Ekle {secili && <span className="text-cyan-300">· {GRUP.find(g => g.id === secili)?.ad}</span>}
            </h3>
            <form onSubmit={handleKaydet} className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-400">
                Boy (cm)
                <input value={boy} onChange={(e) => setBoy(e.target.value)} type="number" inputMode="decimal"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none" />
              </label>
              <label className="text-xs text-slate-400">
                Kilo (kg)
                <input value={kilo} onChange={(e) => setKilo(e.target.value)} type="number" inputMode="decimal"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none" />
              </label>
              <label className="text-xs text-slate-400">
                Esneklik (cm)
                <input value={esneklik} onChange={(e) => setEsneklik(e.target.value)} type="number" inputMode="decimal"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none" />
              </label>
              <label className="text-xs text-slate-400">
                Denge (sn)
                <input value={denge} onChange={(e) => setDenge(e.target.value)} type="number" inputMode="decimal"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none" />
              </label>
              <button type="submit" className="col-span-2 mt-1 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                Kaydet ve veliye bildirim gönder
              </button>
            </form>
          </section>

          {/* BUGÜNÜN PLANI */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Bugünün Antrenman Planı</h3>
            <ul className="space-y-2">
              {PLAN.map((p) => (
                <li key={p.saat} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                  <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">{p.saat}</span>
                  <span className="text-slate-200">{p.baslik}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* HIZLI NOT */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Hızlı Not (gruba)</h3>
            <textarea
              value={not}
              onChange={(e) => setNot(e.target.value)}
              rows={3}
              placeholder="Veliye gidecek kısa mesaj..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => { console.log('Not gonderildi:', not); setNot('') }}
              disabled={!not.trim()}
              className="mt-2 w-full rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-40"
            >
              Tüm gruba gönder
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AntrenorDashboard
