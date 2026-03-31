'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type Child = { id: string; name: string; surname?: string }

interface Appointment {
  id: string
  athlete_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  parent_name: string
  parent_surname: string | null
  parent_phone: string | null
  note: string | null
  status: string
  created_at: string
}

interface Slot {
  time: string
  available: boolean
}

const STATUS_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  bekliyor: { icon: Clock, color: 'text-amber-400', label: 'Bekliyor' },
  onaylandi: { icon: CheckCircle, color: 'text-emerald-400', label: 'Onaylandı' },
  reddedildi: { icon: XCircle, color: 'text-red-400', label: 'Reddedildi' },
  iptal: { icon: XCircle, color: 'text-zinc-500', label: 'İptal' },
  tamamlandi: { icon: CheckCircle, color: 'text-cyan-400', label: 'Tamamlandı' },
}

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  start.setDate(diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default function VeliRandevuPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Takvim state
  const [weekBase, setWeekBase] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formSurname, setFormSurname] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formNote, setFormNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

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

  const fetchAppointments = useCallback(async () => {
    if (!selected) {
      setAppointments([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/veli/appointments?athlete_id=${selected}`)
      const data = await res.json()
      setAppointments(data.items ?? [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Slot yükleme
  useEffect(() => {
    if (!selectedDate || !selected) {
      setSlots([])
      return
    }
    setSlotsLoading(true)
    fetch(`/api/veli/appointments/slots?athlete_id=${selected}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate, selected])

  const weekDays = getWeekDays(weekBase)
  const today = new Date().toISOString().slice(0, 10)

  const handlePrevWeek = () => {
    const d = new Date(weekBase)
    d.setDate(d.getDate() - 7)
    setWeekBase(d)
  }

  const handleNextWeek = () => {
    const d = new Date(weekBase)
    d.setDate(d.getDate() + 7)
    setWeekBase(d)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !selectedDate || !formTime || !formName) return

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const res = await fetch('/api/veli/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: selected,
          appointment_date: selectedDate,
          appointment_time: formTime,
          parent_name: formName,
          parent_surname: formSurname || null,
          parent_phone: formPhone || null,
          note: formNote || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? 'Randevu oluşturulamadı')
        return
      }

      setSubmitSuccess(true)
      setFormName('')
      setFormSurname('')
      setFormPhone('')
      setFormTime('')
      setFormNote('')
      setShowForm(false)
      fetchAppointments()
    } catch {
      setSubmitError('Bağlantı hatası')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await fetch('/api/veli/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'iptal' }),
      })
      fetchAppointments()
    } catch {
      // sessiz geç
    }
  }

  // Randevulu günleri işaretle
  const appointmentDates = new Set(
    appointments
      .filter((a) => a.status !== 'iptal' && a.status !== 'reddedildi')
      .map((a) => a.appointment_date)
  )

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/veli/dashboard" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
            Randevular
          </h1>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSubmitSuccess(false); setSubmitError('') }}
          className="flex items-center gap-1 rounded-full bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 px-3 py-1.5 text-xs font-medium hover:bg-cyan-400/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Randevu
        </button>
      </div>

      {children.length > 1 && (
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

      {/* Başarılı mesaj */}
      {submitSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <p className="text-sm text-emerald-400">Randevunuz başarıyla oluşturuldu!</p>
        </div>
      )}

      {/* Takvim görünümü */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={handlePrevWeek} className="text-zinc-400 hover:text-white transition-colors p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-white">
            {weekDays[0].toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </p>
          <button onClick={handleNextWeek} className="text-zinc-400 hover:text-white transition-colors p-1">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const dateStr = day.toISOString().slice(0, 10)
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const hasAppointment = appointmentDates.has(dateStr)
            const isPast = dateStr < today

            return (
              <button
                key={dateStr}
                onClick={() => !isPast && setSelectedDate(isSelected ? null : dateStr)}
                disabled={isPast}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-cyan-400/20 border border-cyan-400/30'
                    : isToday
                    ? 'bg-zinc-800 border border-zinc-700'
                    : isPast
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-zinc-800 border border-transparent'
                }`}
              >
                <span className="text-[10px] text-zinc-500">{GUNLER[day.getDay()].slice(0, 3)}</span>
                <span className={`text-sm font-medium ${isSelected ? 'text-cyan-400' : isToday ? 'text-white' : 'text-zinc-300'}`}>
                  {day.getDate()}
                </span>
                {hasAppointment && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Müsait saatler */}
      {selectedDate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            {new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} — Müsait Saatler
          </h3>
          {slotsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-zinc-500">Müsait saat bulunamadı.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  disabled={!s.available}
                  onClick={() => {
                    setFormTime(s.time)
                    setShowForm(true)
                    setSubmitError('')
                    setSubmitSuccess(false)
                  }}
                  className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                    !s.available
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed line-through'
                      : formTime === s.time
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Randevu formu */}
      {showForm && selectedDate && formTime && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-cyan-400/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Randevu Oluştur</h3>
          <p className="text-xs text-zinc-400">
            {new Date(selectedDate).toLocaleDateString('tr-TR')} — {formTime}
          </p>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{submitError}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Ad *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none"
              placeholder="Adınız"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Soyad</label>
            <input
              type="text"
              value={formSurname}
              onChange={(e) => setFormSurname(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none"
              placeholder="Soyadınız"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Telefon</label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none"
              placeholder="05XX XXX XX XX"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Not</label>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none resize-none"
              placeholder="Eklemek istediğiniz not..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-cyan-400 text-zinc-950 py-2.5 text-sm font-semibold hover:bg-cyan-300 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-zinc-800 text-zinc-400 px-4 py-2.5 text-sm hover:bg-zinc-700 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Mevcut randevular */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
          <CalendarDays className="h-10 w-10 text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">Henüz randevunuz yok.</p>
          <p className="text-xs text-zinc-500 mt-1">Yukarıdaki takvimden bir gün seçerek randevu oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Randevularım</h3>
          {appointments.map((a) => {
            const info = STATUS_MAP[a.status] ?? STATUS_MAP.bekliyor
            const Icon = info.icon
            const canCancel = a.status === 'bekliyor' || a.status === 'onaylandi'
            return (
              <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${info.color}`} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {new Date(a.appointment_date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}
                        {String(a.appointment_time).slice(0, 5)}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {a.parent_name} {a.parent_surname ?? ''}
                        {a.parent_phone ? ` · ${a.parent_phone}` : ''}
                      </p>
                      {a.note && <p className="text-xs text-zinc-500 mt-1">{a.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                      a.status === 'bekliyor' ? 'bg-amber-500/20 text-amber-400' :
                      a.status === 'onaylandi' ? 'bg-emerald-500/20 text-emerald-400' :
                      a.status === 'tamamlandi' ? 'bg-cyan-400/20 text-cyan-400' :
                      'bg-zinc-700 text-zinc-400'
                    }`}>
                      {info.label}
                    </span>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        İptal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
