'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'
import { ArrowLeft, Loader2, Calendar, Activity, CheckCircle, Clock } from 'lucide-react'

type ChildDetail = {
  id: string
  name: string
  surname?: string | null
  birth_date?: string | null
  branch?: string | null
  level?: string | null
}

type AttendanceItem = { lesson_date: string; status: string }
type PaymentItem = { period_month?: number; period_year?: number; amount: number; status: string; due_date?: string; paid_date?: string }
type MovementItem = { name: string; status: string; date?: string; progress?: number }

const AYLAR: Record<number, string> = {
    1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan', 5: 'Mayıs', 6: 'Haziran',
    7: 'Temmuz', 8: 'Ağustos', 9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık',
}

export default function VeliCocukPage() {
  const params = useParams()
  const id = params?.id as string | undefined
  const [child, setChild] = useState<ChildDetail | null>(null)
  const [attendance, setAttendance] = useState<AttendanceItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [movements, setMovements] = useState<MovementItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!id) return
    const [childrenRes, attRes, payRes, movRes] = await Promise.all([
      fetch('/api/veli/children'),
      fetch(`/api/veli/attendance?athlete_id=${id}&days=30`),
      fetch(`/api/veli/payments?athlete_id=${id}`),
      fetch(`/api/veli/movements?athlete_id=${id}`),
    ])
    const childrenData = await childrenRes.json()
    const attData = await attRes.json()
    const payData = await payRes.json()
    const movData = await movRes.json()
    const ch = (childrenData.items ?? []).find((c: { id: string }) => c.id === id)
    setChild(ch ?? null)
    setAttendance(Array.isArray(attData.items) ? attData.items : [])
    setPayments(Array.isArray(payData.items) ? payData.items : [])
    setMovements(Array.isArray(movData.items) ? movData.items : [])
  }, [id])

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  const ageFromBirth = (d: string | null | undefined) => {
    if (!d) return null
    return Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })

  const attByDate = new Map(attendance.map((a) => [a.lesson_date, a.status]))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <Link href="/veli/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Geri
        </Link>
        <p className="text-zinc-400 mt-4">Çocuk bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <PanelHeader panelName="VELİ PANELİ" />

      <main className="p-4 space-y-4">
        {/* Ust Bilgi */}
        <div className="flex items-center gap-3">
          <Link href="/veli/dashboard" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 font-semibold">
              {(child.name?.[0] ?? '?') + (child.surname?.[0] ?? '')}
            </div>
            <div>
              <h1 className="font-bold text-white">{child.name} {child.surname ?? ''}</h1>
              <p className="text-xs text-zinc-400">{ageFromBirth(child.birth_date) ?? '—'} yaş · {child.branch ?? '—'} · {child.level ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Yoklama Takvimi */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">Yoklama Takvimi (Son 30 Gün)</h3>
          <p className="text-xs text-zinc-500 mb-3">Günlük durum: Geldi / Gelmedi / İzinli</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {last30Days.map((d) => {
              const status = attByDate.get(d)
              const bg = status === 'present' ? 'bg-emerald-500' : status === 'absent' ? 'bg-red-500' : status === 'excused' || status === 'late' ? 'bg-amber-500' : 'bg-zinc-800'
              return (
                <div
                  key={d}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium ${
                    status ? `${bg} text-white` : 'bg-zinc-800 text-zinc-500'
                  }`}
                  title={`${new Date(d).toLocaleDateString('tr-TR')}: ${status === 'present' ? 'Geldi' : status === 'absent' ? 'Gelmedi' : status || '—'}`}
                >
                  {new Date(d).getDate()}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Geldi</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Gelmedi</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> İzinli</span>
          </div>
        </div>

        {/* Aidat Durumu */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Aidat Durumu (Son 3 Ay)</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-zinc-500">Ödeme kaydı yok.</p>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-700 p-3">
                  <div>
                    <p className="font-medium text-white">
                      {AYLAR[p.period_month ?? 0]} {p.period_year} · {p.amount.toLocaleString('tr-TR')} TL
                    </p>
                    <p className="text-xs text-zinc-500">Vade: {p.due_date ? new Date(p.due_date).toLocaleDateString('tr-TR') : '—'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                    p.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {p.status === 'paid' ? 'Ödendi' : p.status === 'overdue' ? 'Gecikmiş' : 'Bekleyen'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tamamlanan Hareketler */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-cyan-400" strokeWidth={1.5} /> Hareketler
          </h3>
          {movements.length === 0 ? (
            <p className="text-sm text-zinc-500">Henüz hareket kaydı yok.</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-700 p-3">
                  <div className="flex items-center gap-2">
                    {m.status === 'completed' || m.status === 'tamamlandi' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{m.name || 'Hareket'}</p>
                      {m.date && (
                        <p className="text-xs text-zinc-500">
                          {new Date(m.date).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    m.status === 'completed' || m.status === 'tamamlandi'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {m.status === 'completed' || m.status === 'tamamlandi' ? 'Tamamlandı' : 'Bekliyor'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ders Programi */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-cyan-400" strokeWidth={1.5} /> Ders Programı
          </h3>
          <p className="text-sm text-zinc-400">Haftalık program tesisiniz tarafından yönetilmektedir. Detay için <Link href="/veli/program" className="text-cyan-400 hover:underline">Program</Link> sayfasına bakın.</p>
        </div>
      </main>

      <VeliBottomNav />
    </div>
  )
}
