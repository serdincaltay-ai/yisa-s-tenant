'use client'

import { useBranch } from '@/lib/context/branch-context'
import { Building2, ChevronDown, Check, LayoutGrid } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const BRANCH_COLORS: Record<string, string> = {
  '#06b6d4': 'bg-cyan-500',
  '#f59e0b': 'bg-amber-500',
  '#10b981': 'bg-emerald-500',
  '#8b5cf6': 'bg-violet-500',
  '#ef4444': 'bg-red-500',
  '#3b82f6': 'bg-blue-500',
  '#ec4899': 'bg-pink-500',
  '#f97316': 'bg-orange-500',
}

function getColorClass(renk?: string | null): string {
  if (!renk) return 'bg-cyan-500'
  return BRANCH_COLORS[renk] ?? 'bg-cyan-500'
}

export function BranchSelector() {
  const { branches, selectedBranchId, selectedBranch, setBranchId, hasBranches, loading } = useBranch()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading || !hasBranches) return null

  const label = selectedBranch ? selectedBranch.ad : 'Tüm Şubeler'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700/80 hover:border-zinc-600 transition-colors"
      >
        {selectedBranch ? (
          <span className={`h-2.5 w-2.5 rounded-full ${getColorClass(selectedBranch.renk)}`} />
        ) : (
          <LayoutGrid className="h-3.5 w-3.5 text-zinc-400" />
        )}
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-1">
            {/* Tüm Şubeler */}
            <button
              onClick={() => { setBranchId(null); setOpen(false) }}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                !selectedBranchId
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <div className="flex-1 text-left">
                <p className="font-medium">Tüm Şubeler</p>
                <p className="text-[10px] text-zinc-500">Genel özet görünümü</p>
              </div>
              {!selectedBranchId && <Check className="h-4 w-4 text-cyan-400 shrink-0" />}
            </button>

            <div className="my-1 border-t border-zinc-800" />

            {/* Şube Listesi */}
            {branches.filter((b) => b.aktif).map((branch) => (
              <button
                key={branch.id}
                onClick={() => { setBranchId(branch.id); setOpen(false) }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  selectedBranchId === branch.id
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span className={`h-3 w-3 rounded-full shrink-0 ${getColorClass(branch.renk)}`} />
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate">{branch.ad}</p>
                  <p className="text-[10px] text-zinc-500">
                    {branch.ilce ? `${branch.ilce}` : ''}
                    {branch.ilce && branch.sehir ? ' / ' : ''}
                    {branch.sehir ? `${branch.sehir}` : ''}
                    {!branch.ilce && !branch.sehir ? 'Şube' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {branch.varsayilan && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                      Ana
                    </span>
                  )}
                  {selectedBranchId === branch.id && <Check className="h-4 w-4 text-cyan-400" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
