'use client'

import { useEffect, useState } from 'react'
import { Users, Briefcase, Clock, CheckCircle } from 'lucide-react'

export function StatsOverview() {
  const [stats, setStats] = useState<{
    activeFranchises?: number
    pendingApprovals?: number
    newFranchiseApplications?: number
    demoRequests?: number
  } | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
  }, [])

  const items = [
    {
      title: 'Aktif Franchise',
      value: stats?.activeFranchises ?? '—',
      icon: Users,
      change: null as string | null,
      changeType: 'positive' as const,
    },
    {
      title: 'Bekleyen Onay',
      value: stats?.pendingApprovals ?? '—',
      icon: Clock,
      change: null,
      changeType: 'negative' as const,
    },
    {
      title: 'Yeni Başvuru',
      value: stats?.newFranchiseApplications ?? stats?.demoRequests ?? '—',
      icon: Briefcase,
      change: null,
      changeType: 'positive' as const,
    },
    {
      title: 'Onay Bekleyen',
      value: stats?.pendingApprovals ?? '—',
      icon: CheckCircle,
      change: null,
      changeType: 'negative' as const,
    },
  ]
  // İkinci ve dördüncü aynı olmasın — sadece 3 kart
  const displayItems = [items[0], items[1], items[2]]

  const accentColors = [
    'bg-pink-500/20',
    'bg-blue-500/20',
    'bg-amber-500/20',
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {displayItems.map((stat, i) => {
        const Icon = stat.icon
        const accent = accentColors[i % accentColors.length]
        return (
          <div
            key={stat.title}
            className={`${accent} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white`}
          >
            <div className={`${accent} w-8 h-8 rounded-full flex items-center justify-center mb-2`}>
              <Icon className="text-white w-4 h-4" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.title.toUpperCase()}</div>
          </div>
        )
      })}
    </div>
  )
}
