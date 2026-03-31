"use client"

import React, { useState } from "react"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  MessageCircle,
  Users,
  Award,
  Calendar,
  Shield,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Menu,
  X,
} from "lucide-react"
import { STANDART_PAKETLER, getDersProgrami, type TenantConfig } from "@/lib/tenant-template-config"
import WeeklyScheduleGrid from "./WeeklyScheduleGrid"
import TenantTabletNav, { STANDARD_TABLET_NAV } from "./TenantTabletNav"

interface StandardTemplateProps {
  config: TenantConfig
}

/**
 * Standart Şablon — hobigym.com gibi basit, clean, light-dark tesis sayfası.
 * Minimal animasyon, düz yapı, hızlı yükleme.
 */
export default function StandardTemplate({ config }: StandardTemplateProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dersler = getDersProgrami(config.slug)

  const NAV_LINKS = [
    { label: "Hakkımızda", href: "#hakkimizda" },
    { label: "Paketler", href: "#paketler" },
    { label: "Program", href: "#program" },
    { label: "İletişim", href: "#iletisim" },
  ]

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false)
    if (href === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    if (href.startsWith("#")) {
      const el = document.querySelector(href)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 72
        window.scrollTo({ top, behavior: "smooth" })
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 font-bold text-sm text-white">
              {config.logoBadge}
            </div>
            <div>
              <p className="font-bold text-sm text-white">{config.kisa}</p>
              <p className="text-[10px] text-zinc-500">{config.ustBaslik}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition rounded-lg hover:bg-zinc-800"
              >
                {link.label}
              </button>
            ))}
            {config.whatsapp && config.whatsapp.length > 5 && (
              <a
                href={`https://wa.me/${config.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition"
              >
                İletişim
              </a>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-zinc-800 transition"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero — Basit */}
      <section className="pt-24 pb-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            {config.slogan}
          </h1>
          <p className="mt-4 text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
            {config.aciklama}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {config.whatsapp && config.whatsapp.length > 5 && (
              <a
                href={`https://wa.me/${config.whatsapp}?text=Merhaba, bilgi almak istiyorum.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-700 transition"
              >
                <MessageCircle className="h-4 w-4 text-green-400" />
                WhatsApp ile İletişim
              </a>
            )}
            {config.telefon && config.telefon.replace(/\D/g, "").length >= 10 && (
              <a
                href={`tel:${config.telefon}`}
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition px-6 py-3"
              >
                <Phone className="h-4 w-4" />
                {config.telefon}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Hakkımızda */}
      <section id="hakkimizda" className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Neden {config.kisa}?
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Shield, title: "Güvenli Ortam", desc: "Profesyonel ekipman ve güvenli antrenman ortamı." },
              { icon: Award, title: "Lisanslı Antrenörler", desc: "Federasyon sertifikalı, deneyimli kadro." },
              { icon: Users, title: "Küçük Gruplar", desc: "Antrenör başına maksimum 10 öğrenci." },
              { icon: Calendar, title: "Esnek Program", desc: "Kredi sistemiyle istediğiniz gün gelin." },
              { icon: CreditCard, title: "Uygun Paketler", desc: "24, 48 ve 60 seanslik paket seçenekleri." },
              { icon: CheckCircle2, title: "Gelişim Takibi", desc: "Düzenli ölçüm ve veliye rapor." },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition"
              >
                <item.icon className="h-6 w-6 text-zinc-400 mb-3" />
                <h3 className="font-semibold text-white text-base">{item.title}</h3>
                <p className="text-sm text-zinc-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Haftalık Ders Programı GRID */}
      <section id="program" className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <WeeklyScheduleGrid dersler={dersler} />
        </div>
      </section>

      {/* Paketler */}
      <section id="paketler" className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            Seans Bazlı Paketler
          </h2>
          <p className="text-center text-zinc-400 mb-10 text-sm">
            Aylık aidat yok. Kredi bazlı esnek sistem.
          </p>
          <div className="grid gap-5 lg:grid-cols-3">
            {STANDART_PAKETLER.map((p, i) => (
              <div
                key={i}
                className={`rounded-xl border p-6 ${
                  p.one_cikan
                    ? "border-zinc-600 bg-zinc-800/50"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                {p.one_cikan && (
                  <span className="inline-block bg-zinc-700 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    En Popüler
                  </span>
                )}
                <h3 className="text-lg font-bold">{p.baslik}</h3>
                <p className="text-xs text-zinc-500 mt-1">{p.aciklama}</p>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-white">{p.fiyat} ₺</span>
                  <span className="text-sm text-zinc-500"> / {p.seans} seans</span>
                </div>
                <p className="text-xs text-zinc-600 mt-1">Ders başı: {p.birimFiyat} ₺</p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2">
                  <CreditCard className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-400">{p.taksit}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.ozellikler.map((oz, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-zinc-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      {oz}
                    </li>
                  ))}
                </ul>
                {config.whatsapp && config.whatsapp.length > 5 && (
                  <a
                    href={`https://wa.me/${config.whatsapp}?text=Merhaba, ${p.baslik} hakkında bilgi almak istiyorum.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 block w-full text-center rounded-lg bg-zinc-800 border border-zinc-700 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition"
                  >
                    Bilgi Al
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İletişim */}
      <section id="iletisim" className="py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">İletişim</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {config.telefon && config.telefon.replace(/\D/g, "").length >= 10 && (
                <a href={`tel:${config.telefon}`} className="flex items-center gap-3 text-zinc-300 hover:text-white transition">
                  <Phone className="h-5 w-5 text-zinc-500" /> {config.telefon}
                </a>
              )}
              <a href={`mailto:${config.email}`} className="flex items-center gap-3 text-zinc-300 hover:text-white transition">
                <Mail className="h-5 w-5 text-zinc-500" /> {config.email}
              </a>
              <div className="flex items-center gap-3 text-zinc-300">
                <MapPin className="h-5 w-5 text-zinc-500 shrink-0" /> {config.adres}
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Clock className="h-5 w-5 text-zinc-500" /> {config.calisma}
              </div>
              <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-zinc-300 hover:text-white transition">
                <Instagram className="h-5 w-5 text-zinc-500" /> {config.instagram}
              </a>
            </div>
            <div className="flex flex-col gap-3">
              {config.whatsapp && config.whatsapp.length > 5 && (
                <a
                  href={`https://wa.me/${config.whatsapp}?text=Merhaba, deneme dersi hakkında bilgi almak istiyorum.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp ile Yazın
                </a>
              )}
              <a
                href={config.harita}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 text-white py-3 rounded-xl font-medium hover:bg-zinc-700 transition"
              >
                <MapPin className="h-5 w-5" />
                Haritada Göster
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs text-zinc-600">
            &copy; 2026 {config.ad}. Tüm hakları saklıdır.
          </p>
          <p className="text-[10px] text-zinc-700 mt-1">Powered by YiSA-S Spor Teknolojileri</p>
        </div>
      </footer>

      {/* Tablet Bottom Nav */}
      <TenantTabletNav items={STANDARD_TABLET_NAV} onNavigate={scrollTo} />

      {/* Floating WhatsApp — tablet'te bottom nav üzerinde */}
      {config.whatsapp && config.whatsapp.length > 5 && (
        <a
          href={`https://wa.me/${config.whatsapp}?text=Merhaba, bilgi almak istiyorum.`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl hover:bg-green-600 hover:scale-110 transition-all md:bottom-20 lg:bottom-6"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  )
}
