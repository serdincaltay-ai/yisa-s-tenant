'use client'

/**
 * Geniş Ekran — YİSA-S sisteminden üretilen içeriklerin özeti
 * Site, Sayfa, Video, Logo ve patron panel verileri. Gereksiz alan yok.
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Globe,
  LayoutTemplate,
  Video,
  ImageIcon,
  ExternalLink,
  RefreshCw,
  Play,
  FileText,
} from 'lucide-react'

const SITELER = [
  { ad: 'Tanıtım', url: 'https://yisa-s.com', subdomain: 'yisa-s.com' },
  { ad: 'Patron Paneli', url: 'https://app.yisa-s.com', subdomain: 'app.yisa-s.com' },
  { ad: 'Franchise Paneli', url: 'https://franchise.yisa-s.com', subdomain: 'franchise.yisa-s.com' },
  { ad: 'Veli Paneli', url: 'https://veli.yisa-s.com', subdomain: 'veli.yisa-s.com' },
]

type Stats = {
  franchiseRevenueMonth: number
  expensesMonth: number
  activeFranchises: number
  pendingApprovals: number
  newFranchiseApplications: number
}

type Franchise = { id: string; name: string; region?: string; status: string }

export default function GenisEkranPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [templateCount, setTemplateCount] = useState<number>(0)
  const [pendingItems, setPendingItems] = useState<{ id: string; title: string; displayText?: string }[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/stats').then((r) => r.json()),
      fetch('/api/franchises').then((r) => r.json()),
      fetch('/api/templates').then((r) => r.json()),
      fetch('/api/approvals').then((r) => r.json()),
    ])
      .then(([s, f, t, a]) => {
        setStats(s)
        setFranchises(Array.isArray(f?.items) ? f.items : Array.isArray(f) ? f : [])
        const sablonlar = t?.sablonlar ?? t?.coo_templates ?? t?.templates ?? []
        setTemplateCount(Array.isArray(sablonlar) ? sablonlar.length : 0)
        const items = Array.isArray(a?.items) ? a.items : []
        setPendingItems(
          items
            .filter((i: { status?: string }) => i.status === 'pending')
            .slice(0, 5)
            .map((i: { id: string; title?: string; displayText?: string }) => ({
              id: i.id,
              title: i.title ?? '-',
              displayText: i.displayText,
            }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Logo + Başlık */}
      <header className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border border-white/10">
            <Image src="/logo.png" alt="YİSA-S" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">YİSA-S Geniş Ekran</h1>
            <p className="text-sm text-white/60">Sistem özeti — site, sayfa, video, logo</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Yenile"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Çalıştırılacaklar — Neyi çalıştıracağınızı burada görün */}
      {pendingItems.length > 0 && (
        <section className="mb-8 bg-pink-500/10 border border-pink-500/30 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-pink-300">
            <Play size={20} />
            Çalıştırılacaklar ({pendingItems.length})
          </h2>
          <p className="text-sm text-white/70 mb-4">
            Oyna&apos;ya basmadan önce burada görün — neyin deploy edileceğini kontrol edin.
          </p>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/onay-kuyrugu?preview=${item.id}`}
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:border-pink-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-pink-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.title}</p>
                    {item.displayText && (
                      <p className="text-xs text-white/60 mt-1 line-clamp-2">{item.displayText.slice(0, 150)}…</p>
                    )}
                  </div>
                  <ExternalLink size={14} className="text-white/40 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/dashboard/ozel-araclar"
            className="inline-flex items-center gap-2 mt-4 text-sm text-pink-400 hover:text-pink-300"
          >
            <Play size={14} />
            Oyna — Deploy
          </Link>
        </section>
      )}

      {/* Patron Panel Verileri */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Gelir (ay)</p>
              <p className="text-lg font-mono font-semibold">₺{stats.franchiseRevenueMonth.toLocaleString('tr-TR')}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Gider (ay)</p>
              <p className="text-lg font-mono font-semibold">₺{stats.expensesMonth.toLocaleString('tr-TR')}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Onay bekleyen</p>
              <p className="text-lg font-mono font-semibold">{stats.pendingApprovals}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Başvuru</p>
              <p className="text-lg font-mono font-semibold">{stats.newFranchiseApplications}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/50 mb-1">Aktif Franchise</p>
              <p className="text-lg font-mono font-semibold">{stats.activeFranchises}</p>
            </div>
          </>
        )}
        {!stats && !loading && (
          <div className="col-span-5 text-center text-white/50 py-8">Veri yüklenemedi.</div>
        )}
      </section>

      {/* Site / Sayfa / Video / Logo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Siteler */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Globe size={20} className="text-emerald-400" />
            Siteler
          </h2>
          <div className="space-y-3">
            {SITELER.map((s) => (
              <a
                key={s.subdomain}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors group"
              >
                <div>
                  <p className="font-medium">{s.ad}</p>
                  <p className="text-xs text-white/50 font-mono">{s.subdomain}</p>
                </div>
                <ExternalLink size={16} className="text-white/40 group-hover:text-emerald-400" />
              </a>
            ))}
          </div>
        </section>

        {/* Sayfalar (Şablonlar) */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <LayoutTemplate size={20} className="text-cyan-400" />
            Sayfalar / Şablonlar
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Toplam şablon</span>
              <span className="text-2xl font-mono font-semibold">{templateCount}</span>
            </div>
            <Link
              href="/dashboard/sablonlar"
              className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Şablon havuzu
              <ExternalLink size={14} />
            </Link>
          </div>
        </section>

        {/* Videolar / Instagram */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Video size={20} className="text-amber-400" />
            Videolar / Instagram Paylaşımları
          </h2>
          <p className="text-sm text-white/60">
            Franchise tesislerinin sosyal medya paylaşımları — ManyChat / Instagram entegrasyonu ile.
          </p>
          <Link
            href="/dashboard/franchises"
            className="inline-flex items-center gap-2 mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Franchise listesi
            <ExternalLink size={14} />
          </Link>
        </section>

        {/* Logo */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <ImageIcon size={20} className="text-violet-400" />
            Logo
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 bg-white/5">
              <Image src="/logo.png" alt="YİSA-S Logo" fill className="object-contain p-2" />
            </div>
            <div>
              <p className="font-medium">YİSA-S</p>
              <p className="text-xs text-white/50">Yönetici İşletmeci Sporcu Antrenör Sistemi</p>
            </div>
          </div>
        </section>
      </div>

      {/* Franchise Listesi (kısa) */}
      {franchises.length > 0 && (
        <section className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Franchise Tesisleri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {franchises.slice(0, 9).map((f) => (
              <Link
                key={f.id}
                href={`/dashboard/franchises/${f.id}`}
                className="p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              >
                <p className="font-medium truncate">{f.name}</p>
                <p className="text-xs text-white/50">{f.region ?? f.status}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
