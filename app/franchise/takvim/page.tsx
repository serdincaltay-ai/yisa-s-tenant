'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventContentArg } from '@fullcalendar/core'
import { YeniRandevuModal } from '@/components/franchise/YeniRandevuModal'
import { DersDetayModal } from '@/components/franchise/DersDetayModal'
import { BRANS_CALENDAR_HEX } from '@/lib/tenant-template-config'

type ScheduleItem = {
  id: string
  gun: string
  saat: string
  ders_adi: string
  brans?: string | null
  seviye?: string | null
  antrenor_id?: string | null
  kontenjan?: number | null
}

type StaffItem = { id: string; name: string; surname?: string | null; role?: string }

type DetayMap = Record<string, { katilimciSayisi: number; kontenjan: number }>

const GUN_TO_DOW: Record<string, number> = {
  Pazartesi: 1,
  Sali: 2,
  Carsamba: 3,
  Persembe: 4,
  Cuma: 5,
  Cumartesi: 6,
  Pazar: 0,
}

function parseTime(saat: string): { h: number; m: number } {
  const parts = String(saat).trim().split(/[:\s]/)
  const h = Math.min(23, Math.max(0, parseInt(parts[0] ?? '9', 10) || 9))
  const m = Math.min(59, Math.max(0, parseInt(parts[1] ?? '0', 10) || 0))
  return { h, m }
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const DEFAULT_CALENDAR_BG = 'hsl(var(--primary))'

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  backgroundColor?: string
  extendedProps: { scheduleId: string; brans: string | null; kontenjan: number; katilimci: number }
}

function scheduleToEvents(
  items: ScheduleItem[],
  rangeStart: Date,
  rangeEnd: Date,
  detayMap: DetayMap,
  today: Date
): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const start = new Date(rangeStart)
  const end = new Date(rangeEnd)
  for (const item of items) {
    const dow = GUN_TO_DOW[item.gun] ?? 1
    const { h, m } = parseTime(item.saat)
    const kontenjan = typeof item.kontenjan === 'number' && item.kontenjan > 0 ? item.kontenjan : 20
    const detay = detayMap[item.id]
    const cur = new Date(start)
    cur.setHours(0, 0, 0, 0)
    while (cur <= end) {
      if (cur.getDay() === dow) {
        const startDate = new Date(cur)
        startDate.setHours(h, m, 0, 0)
        const endDate = new Date(startDate)
        endDate.setHours(endDate.getHours() + 1, endDate.getMinutes(), 0, 0)
        if (startDate >= rangeStart && startDate <= rangeEnd) {
          const isToday = isSameDay(startDate, today)
          const katilimci = isToday && detay ? detay.katilimciSayisi : 0
          const displayName = item.ders_adi ?? item.brans ?? 'Ders'
          const bgColor = (item.brans && BRANS_CALENDAR_HEX[item.brans]) ? BRANS_CALENDAR_HEX[item.brans] : DEFAULT_CALENDAR_BG
          events.push({
            id: `${item.id}-${startDate.getTime()}`,
            title: displayName,
            start: startDate,
            end: endDate,
            backgroundColor: bgColor,
            extendedProps: { scheduleId: item.id, brans: item.brans ?? null, kontenjan, katilimci },
          })
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
  }
  return events
}

export default function FranchiseTakvimPage() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [trainers, setTrainers] = useState<StaffItem[]>([])
  const [trainerFilterId, setTrainerFilterId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [detayMap, setDetayMap] = useState<DetayMap>({})
  const [rangeStart, setRangeStart] = useState<Date>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [rangeEnd, setRangeEnd] = useState<Date>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 60)
    d.setHours(23, 59, 59, 999)
    return d
  })
  const [yeniRandevuOpen, setYeniRandevuOpen] = useState(false)
  const [selectedStart, setSelectedStart] = useState<Date | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null)
  const [detailScheduleId, setDetailScheduleId] = useState<string | null>(null)

  const fetchSchedule = useCallback(async () => {
    const res = await fetch('/api/franchise/schedule')
    const data = (await res.json()) as { items?: ScheduleItem[] }
    setScheduleItems(Array.isArray(data?.items) ? data.items : [])
  }, [])

  const fetchTrainers = useCallback(async () => {
    const res = await fetch('/api/franchise/staff?role=trainer')
    const data = (await res.json()) as { items?: StaffItem[] }
    setTrainers(Array.isArray(data?.items) ? data.items : [])
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchSchedule().finally(() => setLoading(false))
  }, [fetchSchedule])

  useEffect(() => {
    fetchTrainers()
  }, [fetchTrainers])

  const filteredItems = trainerFilterId
    ? scheduleItems.filter((i) => i.antrenor_id === trainerFilterId)
    : scheduleItems

  useEffect(() => {
    const ids = [...new Set(filteredItems.map((i) => i.id))]
    if (ids.length === 0) {
      setDetayMap({})
      return
    }
    const abort = new AbortController()
    const map: DetayMap = {}
    Promise.all(
      ids.map(async (scheduleId) => {
        try {
          const res = await fetch(`/api/franchise/ders-detay/${scheduleId}`, { signal: abort.signal })
          if (!res.ok) return
          const json = (await res.json()) as { katilimciSayisi?: number; kontenjan?: number }
          map[scheduleId] = {
            katilimciSayisi: typeof json.katilimciSayisi === 'number' ? json.katilimciSayisi : 0,
            kontenjan: typeof json.kontenjan === 'number' ? json.kontenjan : 20,
          }
        } catch {
          // ignore abort / network
        }
      })
    ).then(() => {
      if (!abort.signal.aborted) setDetayMap(map)
    })
    return () => abort.abort()
  }, [filteredItems])

  const today = useMemo(() => new Date(), [])
  const events = useMemo(
    () => scheduleToEvents(filteredItems, rangeStart, rangeEnd, detayMap, today),
    [filteredItems, rangeStart, rangeEnd, detayMap, today]
  )

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    if (arg.start) setRangeStart(arg.start)
    if (arg.end) setRangeEnd(arg.end)
  }, [])

  const handleSelect = useCallback((info: { start: Date; end: Date }) => {
    setSelectedStart(info.start)
    setSelectedEnd(info.end)
    setYeniRandevuOpen(true)
  }, [])

  const handleEventClick = useCallback(
    (info: { event: { extendedProps?: { scheduleId?: string }; start: Date | null; end: Date | null } }) => {
      const scheduleId = info.event.extendedProps?.scheduleId
      setDetailScheduleId(scheduleId ?? null)
    },
    []
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b bg-card px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/franchise">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Takvim</h1>
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="takvim-antrenor" className="text-sm text-muted-foreground whitespace-nowrap">
            Antrenör:
          </label>
          <select
            id="takvim-antrenor"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
            value={trainerFilterId}
            onChange={(e) => setTrainerFilterId(e.target.value)}
          >
            <option value="">Tümü</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.surname ?? ''}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-2">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              locale="tr"
              buttonText={{
                today: 'Bugün',
                month: 'Ay',
                week: 'Hafta',
                day: 'Gün',
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              events={events}
              datesSet={handleDatesSet}
              selectable
              select={handleSelect}
              eventClick={handleEventClick}
              eventContent={(arg: EventContentArg) => {
                const props = arg.event.extendedProps as { katilimci?: number; kontenjan?: number; brans?: string | null }
                const kat = typeof props.katilimci === 'number' ? props.katilimci : 0
                const kon = typeof props.kontenjan === 'number' ? props.kontenjan : 0
                const brans = props.brans ?? ''
                return (
                  <div className="truncate px-1 text-white" title={arg.event.title}>
                    <div className="text-xs font-medium truncate">{arg.event.title}</div>
                    {brans ? <div className="text-[10px] opacity-90 truncate">{brans}</div> : null}
                    <div className="text-[10px] opacity-90 truncate">{kat}/{kon}</div>
                  </div>
                )
              }}
              height="auto"
            />
          </div>
        )}
      </div>

      <YeniRandevuModal
        open={yeniRandevuOpen}
        onOpenChange={setYeniRandevuOpen}
        initialStart={selectedStart}
        initialEnd={selectedEnd}
        onSaved={() => {
          fetchSchedule()
        }}
      />

      <DersDetayModal
        scheduleId={detailScheduleId}
        open={!!detailScheduleId}
        onOpenChange={(o) => { if (!o) setDetailScheduleId(null) }}
        onSaved={() => fetchSchedule()}
      />
    </div>
  )
}
