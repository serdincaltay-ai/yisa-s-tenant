'use client'

import { Mail, Phone, MessageCircle, MapPin, Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Logo & Aciklama */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white">
              YiSA-S
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Spor İşletmeciliği Platformu. Franchise yönetimi, sporcu takibi, veli paneli ve daha fazlası.
            </p>
          </div>

          {/* İletişim Bilgileri */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">İletişim</h4>
            <div className="space-y-2">
              <a href="tel:+905332491903" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-cyan-400 shrink-0" />
                0533 249 1903
              </a>
              <a href="https://wa.me/905332491903" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <MessageCircle className="h-4 w-4 text-green-400 shrink-0" />
                WhatsApp ile Yazin
              </a>
              <a href="mailto:info@yisa-s.com" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
                info@yisa-s.com
              </a>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-pink-400 shrink-0" />
                Tuzla, Istanbul
              </div>
            </div>
          </div>

          {/* Sosyal Medya */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Sosyal Medya</h4>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/yisas"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-pink-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
                Instagram
              </a>
              <a
                href="https://facebook.com/yisas"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
                Facebook
              </a>
            </div>
            <div className="mt-4">
              <a
                href="https://wa.me/905332491903"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp ile İletişime Geçin
              </a>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; 2026 YiSA-S — Tum haklari saklidir.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <a href="https://yisa-s.com/fiyatlandirma" className="hover:text-white transition-colors">Fiyatlar</a>
            <a href="/kayit" className="hover:text-white transition-colors">Kayit</a>
            <a href="https://wa.me/905332491903" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Destek</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
