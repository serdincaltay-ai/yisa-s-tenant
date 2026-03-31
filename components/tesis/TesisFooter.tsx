'use client'

import React from 'react'
import { Activity } from 'lucide-react'

interface TesisFooterProps {
  tesisAdi: string
}

export function TesisFooter({ tesisAdi }: TesisFooterProps) {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400">
                <Activity className="h-5 w-5 text-zinc-950" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{tesisAdi}</p>
                <p className="text-[10px] text-zinc-500">Powered by YİSA-S</p>
              </div>
            </div>
            <p className="text-sm text-zinc-500">
              Spor ile büyüyen nesiller için profesyonel eğitim ve takip sistemi.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Hızlı Erişim</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#hakkimizda" className="hover:text-cyan-400 transition-colors">Hakkımızda</a></li>
              <li><a href="#branslar" className="hover:text-cyan-400 transition-colors">Branşlar</a></li>
              <li><a href="#program" className="hover:text-cyan-400 transition-colors">Ders Programı</a></li>
              <li><a href="#fiyatlar" className="hover:text-cyan-400 transition-colors">Fiyatlar</a></li>
              <li><a href="#iletisim" className="hover:text-cyan-400 transition-colors">İletişim</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">İletişim</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>info@yisa-s.com</li>
              <li>+90 (212) 000 00 00</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-800 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} {tesisAdi}. Tüm hakları saklıdır. Powered by YİSA-S
        </div>
      </div>
    </footer>
  )
}
