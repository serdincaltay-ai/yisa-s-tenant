'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft } from 'lucide-react'
import { YoklamaList, YoklamaOzet, type YoklamaItem, type YoklamaStatus } from '@/components/yoklama/YoklamaList'

const BRANSLAR = [
  '',
  'Artistik Cimnastik',
  'Ritmik Cimnastik',
  'Trampolin',
  'Genel Jimnastik',
  'Temel Hareket Eğitimi',
  'Diğer',
]

function bugunISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function son7GunRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  }
}

export default function FranchiseYoklamaPage() {
  const [date, setDate] = useState(bugunISO)
  const [bransFilter, setBransFilter] = useState('')
  const [items, setItems] = useState<YoklamaItem[]>([])
  const [summary, setSummary] = useState<Array<{ tarih: string; geldi: number; gelmedi: number; izinli: number; hasta: number }>>([])
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [athletesRes, attendanceRes] = await Promise.all([
        fetch(`/api/franchise/athletes?${bransFilter ? `branch=${encodeURIComponent(bransFilter)}` : ''}`),
        fetch(`/api/franchise/attendance?date=${date}`),
      ])
      const athletesData = await athletesRes.json()
      const attendanceData = await attendanceRes.json()
      const athletes = Array.isArray(athletesData.items) ? athletesData.items : []
      const attendance = Array.isArray(attendanceData.items) ? attendanceData.items : []
      const attMap = new Map(attendance.map((a: { athlete_id: string; status: string }) => [a.athlete_id, a]))
      const merged: YoklamaItem[] = athletes
        .filter((a: { status: string }) => a.status === 'active' || !a.status)
        .map((a: { id: string; name: string | null; surname: string | null; branch: string | null }) => {
          const att = attMap.get(a.id) as { id: string; status: string } | undefined
          const status = (att?.status ?? 'absent') as YoklamaStatus
          const validStatus: YoklamaStatus[] = ['present', 'absent', 'excused', 'late']
          return {
            athlete_id: a.id,
            ad_soyad: [a.name, a.surname].filter(Boolean).join(' ').trim() || null,
            brans: a.branch,
            attendance_id: att?.id,
            status: validStatus.includes(status) ? status : 'absent',
          }
        })
      setItems(merged)
    } catch {
      setItems([])
      setToast({ message: 'Yoklama yüklenemedi', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [date, bransFilter])

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const { from, to } = son7GunRange()
      const res = await fetch(`/api/franchise/attendance?from=${from}&to=${to}`)
      const data = await res.json()
      setSummary(Array.isArray(data.summary) ? data.summary : [])
    } catch {
      setSummary([])
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setIsMobile(mq.matches)
    const h = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const handleStatusChange = (athleteId: string, status: YoklamaStatus) => {
    setItems((prev) =>
      prev.map((i) => (i.athlete_id === athleteId ? { ...i, status } : i))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const records = items.map((i) => ({
        athlete_id: i.athlete_id,
        lesson_date: date,
        status: i.status,
      }))
      const res = await fetch('/api/franchise/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setToast({ message: 'Yoklama kaydedildi. Devamsızlar için app-yisa-s SMS/aidat-reminder API tetiklendi.', type: 'success' })
        fetchData()
        fetchSummary()
      } else {
        setToast({ message: data.error ?? 'Kayıt başarısız', type: 'error' })
      }
    } catch {
      setToast({ message: 'Bağlantı hatası', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tesis paneline dön
          </Link>
        </Button>
      </div>
      <header>
        <h1 className="text-2xl font-bold text-foreground">Yoklama</h1>
        <p className="text-muted-foreground">GELDİ, GELMEDİ, MUAF butonları — ders/sporcu listesi, attendance tablosuna kayıt; devamsızlıkta app-yisa-s SMS/aidat-reminder API tetiği</p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-wrap">
        <div>
          <label htmlFor="yoklama-date" className="block text-sm font-medium mb-1">
            Tarih
          </label>
          <input
            id="yoklama-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="yoklama-brans" className="block text-sm font-medium mb-1">
            Branş / Grup
          </label>
          <select
            id="yoklama-brans"
            className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={bransFilter}
            onChange={(e) => setBransFilter(e.target.value)}
          >
            {BRANSLAR.map((b) => (
              <option key={b || '_'} value={b}>
                {b || 'Tümü'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <YoklamaList items={items} onChange={handleStatusChange} isMobile={isMobile} />
          {items.length > 0 && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          )}
        </>
      )}

      <div className="mt-8">
        {summaryLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <YoklamaOzet rows={summary} />
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600/90' : 'bg-destructive/90'
          } text-white`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
