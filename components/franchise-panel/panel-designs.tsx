'use client'

import Link from 'next/link'
import { LayoutTemplate, ExternalLink } from 'lucide-react'

export function PanelDesigns() {
  const designs = [
    {
      id: 1,
      name: 'Patron Komuta Merkezi',
      desc: 'AI asistan, onay kuyruğu, istatistikler',
      href: '/dashboard',
    },
    {
      id: 2,
      name: 'Franchise Vitrinleri',
      desc: 'Tesis listesi, detay sayfaları',
      href: '/dashboard/franchises',
    },
    {
      id: 3,
      name: 'Şablonlar',
      desc: 'CELF direktör şablonları',
      href: '/dashboard/sablonlar',
    },
    {
      id: 4,
      name: 'Raporlar',
      desc: 'Finans, maliyet, satış raporları',
      href: '/dashboard/reports',
    },
  ]

  return (
    <div className="bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2 mb-2">
        <LayoutTemplate className="h-5 w-5" />
        Panel Tasarımları
      </h2>
      <p className="text-xs sm:text-sm text-gray-400 mb-4">
        YİSA-S dashboard sayfalarına hızlı erişim
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {designs.map((d) => (
            <Link key={d.id} href={d.href}>
              <div className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors group">
                <h3 className="font-medium text-white group-hover:text-pink-300">
                  {d.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{d.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-2 group-hover:text-pink-300 transition-colors">
                  Git <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
    </div>
  )
}
