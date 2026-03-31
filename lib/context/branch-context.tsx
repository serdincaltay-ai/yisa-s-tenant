'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type BranchInfo = {
  id: string
  ad: string
  slug: string
  renk?: string | null
  ikon?: string | null
  aktif: boolean
  varsayilan: boolean
  personel_sayisi?: number
  ogrenci_sayisi?: number
  adres?: string | null
  telefon?: string | null
  email?: string | null
  sehir?: string | null
  ilce?: string | null
}

type BranchContextValue = {
  branches: BranchInfo[]
  selectedBranchId: string | null // null = "Tum Subeler"
  selectedBranch: BranchInfo | null
  setBranchId: (id: string | null) => void
  loading: boolean
  refetch: () => Promise<void>
  hasBranches: boolean
}

const STORAGE_KEY = 'yisa-selected-branch'

const BranchContext = createContext<BranchContextValue | null>(null)

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<BranchInfo[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/franchise/branches')
      const data = await res.json()
      const items: BranchInfo[] = Array.isArray(data?.subeler) ? data.subeler : []
      setBranches(items)

      // Kayıtlı seçimi yükle
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && stored !== 'all') {
          const exists = items.some((b) => b.id === stored)
          if (exists) {
            setSelectedBranchId(stored)
          } else {
            setSelectedBranchId(null)
            localStorage.removeItem(STORAGE_KEY)
          }
        }
      } catch {}
    } catch {
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const setBranchId = useCallback((id: string | null) => {
    setSelectedBranchId(id)
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id)
      } else {
        localStorage.setItem(STORAGE_KEY, 'all')
      }
    } catch {}
  }, [])

  const selectedBranch = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId) ?? null
    : null

  const value: BranchContextValue = {
    branches,
    selectedBranchId,
    selectedBranch,
    setBranchId,
    loading,
    refetch: fetchBranches,
    hasBranches: branches.length > 1,
  }

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
}

export function useBranch() {
  const ctx = useContext(BranchContext)
  return ctx ?? {
    branches: [],
    selectedBranchId: null,
    selectedBranch: null,
    setBranchId: () => {},
    loading: false,
    refetch: async () => {},
    hasBranches: false,
  }
}
