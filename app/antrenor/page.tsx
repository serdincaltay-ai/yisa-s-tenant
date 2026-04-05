'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Calendar, CheckCircle, XCircle, TrendingUp, ClipboardCheck, Ruler, Loader2, Clock, User, CalendarDays, Wallet, Dumbbell } from 'lucide-react'

type Ogrenci = { id: string; name: string; level?: string; group?: string }
type BugunDers = { id: string; gun: string; saat: string; ders_adi: string; brans?: string; ogrenciler?: Ogrenci[] }
type YoklamaOzet = { tarih: string; geldi: number; gelmedi: number }
type StudentItem = { id: string; name: string; surname?: string; branch?: string; level?: string }
type TodayStudent = { id: string; ad_soyad: string }

export default function AntrenorDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    bugunDersleri: BugunDers[]
    sporcuSayisi: number
    today_athletes: TodayStudent[]
    sonYoklamalar: YoklamaOzet[]
    bugunTarih: string
    haftalikDersSayisi?: number
    toplamYoklama?: number
    devamOrani?: number
    todayStudents: StudentItem[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/antrenor/dashboard')
      .then((r) => r.json())
      .then((d) => {
        const yoklamalar: YoklamaOzet[] = d.sonYoklamalar ?? []
        const toplamGeldi = yoklamalar.reduce((s: number, y: YoklamaOzet) => s + y.geldi, 0)
        const toplamHepsi = yoklamalar.reduce((s: number, y: YoklamaOzet) => s + y.geldi + y.gelmedi, 0)
        setData({
          bugunDersleri: d.bugunDersleri ?? [],
          sporcuSayisi: d.sporcuSayisi ?? 0,
          today_athletes: d.today_athletes ?? [],
          sonYoklamalar: yoklamalar,
          bugunTarih: d.bugunTarih ?? '',
          haftalikDersSayisi: d.haftalikDersSayisi ?? 0,
          toplamYoklama: toplamHepsi,
          devamOrani: toplamHepsi > 0 ? Math.round((toplamGeldi / toplamHepsi) * 100) : 0,
          todayStudents: d.todayStudents ?? [],
        })
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  const d = data ?? { bugunDersleri: [], sporcuSayisi: 0, today_athletes: [], sonYoklamalar: [], bugunTarih: '', haftalikDersSayisi: 0, toplamYoklama: 0, devamOrani: 0, todayStudents: [] as StudentItem[] }

  return (
    <main className="p-4 space-y-4">
      {/* Hos geldiniz */}
      <div className="bg-zinc-900 border border-cyan-400/20 rounded-2xl p-4 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                <p className="text-sm text-zinc-400">Hoş geldiniz</p>
                <h1 className="text-xl font-bold text-white">Antrenör Paneli</h1>
                <p className="text-sm text-zinc-400">
                  Bugün {d.bugunDersleri.length} ders, {d.sporcuSayisi} sporcu
        </p>
      </div>

      {/* Istatistik Kartlari */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <Users className="h-5 w-5 text-cyan-400 mb-2" strokeWidth={1.5} />
          <p className="text-2xl font-bold text-white">{d.sporcuSayisi}</p>
          <p className="text-xs text-zinc-500">Atanan Sporcu</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <Calendar className="h-5 w-5 text-cyan-400 mb-2" strokeWidth={1.5} />
          <p className="text-2xl font-bold text-white">{d.bugunDersleri.length}</p>
          <p className="text-xs text-zinc-500">Bugünün Dersleri</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <ClipboardCheck className="h-5 w-5 text-cyan-400 mb-2" strokeWidth={1.5} />
          <p className="text-2xl font-bold text-white">{d.haftalikDersSayisi ?? 0}</p>
          <p className="text-xs text-zinc-500">Haftalık Ders</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <TrendingUp className="h-5 w-5 text-cyan-400 mb-2" strokeWidth={1.5} />
          <p className="text-2xl font-bold text-white">%{d.devamOrani ?? 0}</p>
          <p className="text-xs text-zinc-500">Devam Oranı</p>
        </div>
      </div>

      {/* Hızlı Erişim */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/antrenor/yoklama">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <ClipboardCheck className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Yoklama Al</p>
          </div>
        </Link>
        <Link href="/antrenor/sporcular">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <Users className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Sporcularım</p>
          </div>
        </Link>
        <Link href="/antrenor/olcum">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <Ruler className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Ölçüm Girişi</p>
          </div>
        </Link>
      </div>

      {/* Yeni Hızlı Erişim */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/antrenor/bugunku-dersler">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <Calendar className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Bugünkü Dersler</p>
          </div>
        </Link>
        <Link href="/antrenor/calisma-saatleri">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <Clock className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Çalışma Saatleri</p>
          </div>
        </Link>
        <Link href="/antrenor/profil">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <User className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Profilim</p>
          </div>
        </Link>
        <Link href="/antrenor/izin-talebi">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <CalendarDays className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">İzin Talebi</p>
          </div>
        </Link>
        <Link href="/antrenor/avans-talebi">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <Wallet className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Avans Talebi</p>
          </div>
        </Link>
        <Link href="/antrenor/ders-programi">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <Calendar className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Ders Programı</p>
          </div>
        </Link>
        <Link href="/antrenor/antrenman-plani">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-400/30 transition-all duration-300 text-center">
            <Dumbbell className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-white">Antrenman Planı</p>
          </div>
        </Link>
      </div>

      {/* Profil'e git butonu */}
      <Link
        href="/antrenor/profil"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 font-medium hover:bg-cyan-400/20 transition-colors"
      >
        <User className="h-5 w-5" strokeWidth={1.5} />
        Profil&apos;e git
      </Link>

      {/* Bugünün Dersleri */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
          <Calendar className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
          Bugünün Dersleri
        </h3>
                <p className="text-xs text-zinc-500 mb-3">{d.bugunTarih}</p>
                {d.bugunDersleri.length === 0 ? (
                  <p className="text-sm text-zinc-500">Bugün ders yok.</p>
        ) : (
          <div className="space-y-2">
            {d.bugunDersleri.map((ders) => (
              <div key={ders.id} className="rounded-xl border border-zinc-700 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{ders.ders_adi}</p>
                    <p className="text-xs text-zinc-400">{ders.saat} {ders.brans ? `· ${ders.brans}` : ''}</p>
                  </div>
                  <span className="rounded-full bg-cyan-400/10 text-cyan-400 text-xs px-3 py-1">
                    {ders.ogrenciler?.length ?? 0} öğrenci
                  </span>
                </div>
                {ders.ogrenciler && ders.ogrenciler.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <p className="text-[10px] text-zinc-500 mb-1.5">Öğrenci Listesi</p>
                    <div className="space-y-1">
                      {ders.ogrenciler.map((o) => (
                        <div key={o.id} className="flex items-center gap-2 text-xs">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 text-[9px] font-bold shrink-0">
                            {o.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-white">{o.name}</span>
                          {o.level && <span className="text-zinc-500">· {o.level}</span>}
                          {o.group && <span className="text-zinc-600">({o.group})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bugünün Öğrencileri */}
      {d.todayStudents.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
            Bugünün Öğrencileri
          </h3>
          <p className="text-xs text-zinc-500 mb-3">{d.todayStudents.length} sporcu</p>
          <div className="space-y-2">
            {d.todayStudents.map((s) => (
              <Link key={s.id} href={`/antrenor/sporcular/${s.id}`}>
                <div className="flex items-center gap-3 rounded-xl border border-zinc-700 p-3 hover:border-cyan-400/30 transition-all">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 text-xs font-semibold">
                    {(s.name?.[0] ?? '') + (s.surname?.[0] ?? '')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name} {s.surname ?? ''}</p>
                    <p className="text-xs text-zinc-400">{s.branch ?? '—'} · {s.level ?? '—'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Son Yoklamalar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-1">Son Yoklamalar Özeti</h3>
                <p className="text-xs text-zinc-500 mb-3">Son günlerin geldi / gelmedi sayıları</p>
                {d.sonYoklamalar.length === 0 ? (
                  <p className="text-sm text-zinc-500">Henüz yoklama yok.</p>
        ) : (
          <div className="space-y-2">
            {d.sonYoklamalar.map((y) => (
              <div key={y.tarih} className="flex items-center justify-between rounded-xl border border-zinc-700 p-3">
                <span className="text-sm font-medium text-white">{y.tarih}</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
                    {y.geldi}
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="h-4 w-4" strokeWidth={1.5} />
                    {y.gelmedi}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
