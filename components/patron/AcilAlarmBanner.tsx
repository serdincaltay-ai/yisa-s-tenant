"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AlertTriangle, X, RefreshCw } from "lucide-react"

interface AcilAlarm {
  id: string
  event_type: string
  severity: string
  description: string | null
  blocked: boolean
  created_at: string
}

interface AcilAlarmBannerProps {
  /** Kontrol periyodu (saat) — varsayilan 24 */
  hours?: number
  /** Yenileme suresi (ms) — varsayilan 30000 (30sn) */
  refreshInterval?: number
}

export default function AcilAlarmBanner({
  hours = 24,
  refreshInterval = 30000,
}: AcilAlarmBannerProps) {
  const [alarmlar, setAlarmlar] = useState<AcilAlarm[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const dismissedLatestId = useRef<string | null>(null)

  const fetchAlarms = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/alarm/acil?hours=${hours}&limit=5`)
      if (!res.ok) return
      const data = await res.json()
      if (data.ok && data.alarmlar) {
        setAlarmlar(data.alarmlar)
        // Sadece yeni alarm geldiginde dismissed'i sifirla
        if (data.alarmlar.length > 0 && data.alarmlar[0].id !== dismissedLatestId.current) {
          setDismissed(false)
        }
      }
    } catch {
      // Sessizce devam et
    } finally {
      setLoading(false)
    }
  }, [hours])

  useEffect(() => {
    fetchAlarms()
    const interval = setInterval(fetchAlarms, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchAlarms, refreshInterval])

  // Alarm yoksa veya kapatildiysa gosterme
  if (alarmlar.length === 0 || dismissed) return null

  const sonAlarm = alarmlar[0]
  const alarmSayisi = alarmlar.length

  return (
    <div
      className="relative overflow-hidden rounded-2xl animate-pulse"
      style={{
        background: "linear-gradient(135deg, #dc2626, #991b1b)",
        border: "2px solid #ef4444",
        boxShadow: "0 0 30px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1)",
      }}
    >
      {/* Animasyonlu arka plan efekti */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)",
        }}
      />

      <div className="relative z-10 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">
                  ACIL ALARM
                </span>
                {alarmSayisi > 1 && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "#fff",
                    }}
                  >
                    +{alarmSayisi - 1} daha
                  </span>
                )}
              </div>
              <p
                className="text-xs md:text-sm truncate"
                style={{ color: "rgba(255,255,255,0.9)" }}
                title={sonAlarm.description ?? ""}
              >
                {sonAlarm.description ?? "Bilinmeyen alarm"}
              </p>
              <p
                className="text-[10px] mt-1"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {new Date(sonAlarm.created_at).toLocaleString("tr-TR")} |{" "}
                {sonAlarm.event_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                fetchAlarms()
              }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.1)" }}
              title="Yenile"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-white ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                dismissedLatestId.current = alarmlar[0]?.id ?? null
                setDismissed(true)
              }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.1)" }}
              title="Kapat"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Birden fazla alarm varsa liste goster */}
        {alarmSayisi > 1 && (
          <div className="mt-3 space-y-1.5">
            {alarmlar.slice(1, 4).map((alarm) => (
              <div
                key={alarm.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                <span style={{ color: "#fca5a5" }}>&#x26A0;</span>
                <span className="truncate flex-1">
                  {alarm.description ?? alarm.event_type}
                </span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>
                  {new Date(alarm.created_at).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
