'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, ChevronDown, Loader2 } from 'lucide-react'

type Sube = {
  id: string
  ad: string
  slug: string
  aktif: boolean
  varsayilan: boolean
}

interface BranchSelectorProps {
  value?: string | null
  onChange: (branchId: string | null) => void
  className?: string
  showAll?: boolean
  placeholder?: string
}

export function BranchSelector({
  value,
  onChange,
  className = '',
  showAll = true,
  placeholder = 'Sube secin',
}: BranchSelectorProps) {
  const [subeler, setSubeler] = useState<Sube[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const fetchSubeler = useCallback(async () => {
    try {
      const res = await fetch('/api/franchise/branches')
      const data = await res.json()
      const items: Sube[] = Array.isArray(data?.subeler) ? data.subeler : []
      setSubeler(items.filter((s) => s.aktif))
    } catch {
      setSubeler([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubeler()
  }, [fetchSubeler])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = () => setOpen(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open])

  const selected = subeler.find((s) => s.id === value)
  const displayText = selected?.ad ?? placeholder

  if (loading) {
    return (
      <div className={`flex h-10 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-400 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Yukleniyor...</span>
      </div>
    )
  }

  if (subeler.length === 0) {
    return null
  }

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-white hover:bg-zinc-800 transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 className="h-4 w-4 shrink-0 text-cyan-400" />
          <span className={selected ? 'text-white' : 'text-zinc-400'}>{displayText}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] rounded-md border border-zinc-700 bg-zinc-900 shadow-lg">
          {showAll && (
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false) }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-800 transition-colors ${
                !value ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-300'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Tum Subeler
            </button>
          )}
          {subeler.map((sube) => (
            <button
              key={sube.id}
              type="button"
              onClick={() => { onChange(sube.id); setOpen(false) }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-zinc-800 transition-colors ${
                value === sube.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-300'
              }`}
            >
              <span className="truncate">{sube.ad}</span>
              {sube.varsayilan && (
                <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                  Varsayilan
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
