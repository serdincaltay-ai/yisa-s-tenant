'use client'

import Link from 'next/link'
import { Activity } from 'lucide-react'

interface PanelHeaderProps {
  panelName: string
}

export function PanelHeader({ panelName }: PanelHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400">
              <Activity className="h-5 w-5 text-zinc-950" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">YİSA-S</h1>
              <p className="text-[10px] text-zinc-400">{panelName}</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-zinc-500">Çevrimiçi</span>
          </div>
        </div>
      </div>
    </header>
  )
}
