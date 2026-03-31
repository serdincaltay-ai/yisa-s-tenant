'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

/** Context to allow children to close the sidebar (e.g. on tab change). */
const SidebarCloseContext = createContext<() => void>(() => {})

/** Hook for children to close the sidebar on demand. */
export function useSidebarClose() {
  return useContext(SidebarCloseContext)
}

interface CollapsibleSidebarProps {
  children: React.ReactNode
}

/**
 * Tablet-responsive sidebar wrapper.
 * Desktop (lg+): sidebar always visible.
 * Tablet/Mobile (<lg): sidebar hidden by default, toggle via hamburger button.
 * Overlay backdrop closes sidebar on tap.
 */
export function CollapsibleSidebar({ children }: CollapsibleSidebarProps) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  // Close sidebar on route change
  const pathname = usePathname()
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close sidebar when viewport crosses lg breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <SidebarCloseContext.Provider value={close}>
      {/* Hamburger toggle — visible only on tablet/mobile */}
      <button
        onClick={toggle}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border shadow-lg lg:hidden"
        aria-label="Menüyü aç/kapat"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop overlay — tablet/mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {children}
      </aside>
    </SidebarCloseContext.Provider>
  )
}

/**
 * Main content wrapper that adjusts margin for the sidebar.
 * Desktop (lg+): left margin for sidebar.
 * Tablet/Mobile (<lg): full width.
 */
export function SidebarMainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 min-w-0 lg:ml-64">
      {children}
    </main>
  )
}
