'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Activity, Menu, X, LogIn } from 'lucide-react'

interface TesisNavbarProps {
  tesisAdi: string
  slug: string
}

export function TesisNavbar({ tesisAdi, slug }: TesisNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { href: `#hakkimizda`, label: 'Hakkımızda' },
    { href: `#branslar`, label: 'Branşlar' },
    { href: `#program`, label: 'Ders Programı' },
    { href: `#fiyatlar`, label: 'Fiyatlar' },
    { href: `#iletisim`, label: 'İletişim' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-8">
        <Link href={`/tesis/${slug}`} className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400">
            <Activity className="h-6 w-6 text-zinc-950" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">{tesisAdi}</h1>
            <p className="text-[10px] text-zinc-400">Powered by YİSA-S</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
          <Link
            href="/veli/giris"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
          >
            <LogIn className="h-4 w-4" strokeWidth={1.5} />
            Giriş
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-zinc-400 hover:text-white">
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pb-4 space-y-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/veli/giris"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2.5 text-sm font-medium text-zinc-950 mt-2"
          >
            <LogIn className="h-4 w-4" strokeWidth={1.5} />
            Giriş
          </Link>
        </div>
      )}
    </nav>
  )
}
