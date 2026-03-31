'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type RobotStatus = 'ok' | 'no_key' | 'error'

interface RobotItem {
  id: string
  name: string
  status: RobotStatus
  latency?: number
}

const STATUS_COLORS = {
  ok: { bg: '#10b981', label: 'Aktif' },
  no_key: { bg: '#ef4444', label: 'Kapalı' },
  error: { bg: '#ef4444', label: 'Hata' },
}

export default function RobotStatusGrid() {
  const [robots, setRobots] = useState<RobotItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/system/health')
      const data = await res.json()
      setRobots(data.robots ?? [])
    } catch {
      setRobots([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const t = setInterval(fetchHealth, 60000)
    return () => clearInterval(t)
  }, [])

  if (loading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="w-20 h-14 rounded-lg bg-[#1e293b] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {robots.map((r, i) => {
        const c = STATUS_COLORS[r.status]
        const isSlow = r.latency != null && r.latency > 2000
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1e293b]
              ${r.status === 'ok' ? 'bg-[#111827]' : 'bg-[#111827]/80'}
            `}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: isSlow ? '#f97316' : c.bg,
              }}
            />
            <span className="text-sm font-medium text-[#f8fafc]">{r.name}</span>
            {r.status === 'ok' && (
              <span className="text-[10px] text-[#10b981]">
                {isSlow ? '⏱' : '✅'}
              </span>
            )}
            {r.status !== 'ok' && (
              <span className="text-[10px] text-[#ef4444]">❌</span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
