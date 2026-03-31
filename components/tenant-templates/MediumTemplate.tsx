"use client"

import React, { useState, useEffect } from "react"
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
  Heart,
  Target,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Star,
} from "lucide-react"
import { STANDART_PAKETLER, getDersProgrami, type TenantConfig } from "@/lib/tenant-template-config"
import WeeklyScheduleGrid from "./WeeklyScheduleGrid"
import TenantTabletNav, { MEDIUM_TABLET_NAV } from "./TenantTabletNav"

interface MediumTemplateProps {
  config: TenantConfig
}

const SSS_ITEMS = [
  { soru: "Deneme dersi ücretsiz mi?", cevap: "Evet! İlk deneme dersimiz tamamen ücretsizdir. Çocuğunuz salonu, antrenörleri ve arkadaşlarını tanısın." },
  { soru: "Kaç yaşından itibaren başlayabilir?", cevap: "4 yaşından itibaren başlanabilir. Yaş gruplarına göre sınıflar oluşturulur." },
  { soru: "Ödeme sistemi nasıl çalışıyor?", cevap: "Seans bazlı kredi sistemi kullanıyoruz. 24, 48 veya 60 derslik paketlerden birini seçebilirsiniz. 24 ders 30.000 TL, 48 seans 52.800 TL, 60 seans 60.000 TL." },
  { soru: "Kardeş indirimi var mı?", cevap: "48 ve 60 seanslik paketlerde kardeşler aynı kredi havuzunu kullanabilir — ayrı paket almanıza gerek yoktur." },
]

/**
 * Orta Şablon — Standart ve premium arası.
 * Gradientler, SSS accordion, istatistikler, daha detaylı paket kartları.
 */
export default function MediumTemplate({ config }: MediumTemplateProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [acikSSS, setAcikSSS] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const dersler = getDersProgrami(config.slug)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const NAV_LINKS = [
    { label: "Hakkımızda", href: "#hakkimizda" },
    { label: "Program", href: "#program" },
    { label: "Paketler", href: "#paketler" },
    { label: "S.S.S", href: "#sss" },
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
    <div className="min-h-screen bg-[#070b14] text-white selection:bg-cyan-500/30">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#070b14]/95 backdrop-blur-lg shadow-lg border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 font-bold text-sm text-cyan-400">
              {config.logoBadge}
            </div>
            <div>
              <p className="font-bold text-sm text-white">{config.kisa}</p>
              <p className="text-[10px] text-cyan-400/60 tracking-wider uppercase">{config.ustBaslik}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition rounded-lg"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo("#iletisim")}
              className="ml-2 bg-gradient-to-r from-cyan-500/80 to-blue-600/80 text-white px-5 py-2 rounded-full text-sm font-medium hover:from-cyan-500 hover:to-blue-600 transition-all"
            >
              Ücretsiz Deneme
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 transition"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#070b14]/98 backdrop-blur-lg px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero — Gradient + İstatistikler */}
      <section className="relative min-h-[80vh] flex items-center justify-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b14] via-[#0a1628] to-[#070b14]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              {config.slogan}
            </span>
          </h1>
          <p className="mt-6 text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {config.aciklama}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollTo("#iletisim")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-7 py-3.5 rounded-full font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
            >
              Ücretsiz Deneme Dersi
              <ArrowRight className="h-4 w-4" />
            </button>
            {config.telefon && config.telefon.replace(/\D/g, "").length >= 10 && (
              <a
                href={`tel:${config.telefon}`}
                className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white px-7 py-3.5 rounded-full font-medium hover:bg-white/10 transition"
              >
                <Phone className="h-4 w-4 text-green-400" />
                {config.telefon}
              </a>
            )}
          </div>

          {/* İstatistikler */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { sayi: "100+", etiket: "Aktif Sporcu" },
              { sayi: "4+", etiket: "Uzman Antrenör" },
              { sayi: "6", etiket: "Profesyonel Kadro" },
              { sayi: "5+", etiket: "Yıl Deneyim" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {s.sayi}
                </p>
                <p className="mt-1 text-xs text-gray-500">{s.etiket}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neden Biz */}
      <section id="hakkimizda" className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Neden {config.kisa}?
          </h2>
          <p className="text-center text-gray-400 max-w-2xl mx-auto mb-12">
            Profesyonel kadromuz ve modern tesisimizle çocuğunuzun gelişimini destekliyoruz.
          </p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { ikon: Shield, baslik: "Güvenli Ortam", aciklama: "Profesyonel ekipman, yumuşak zeminler ve sürekli gözetim.", renk: "text-cyan-400", bg: "from-cyan-500/20 to-cyan-500/5" },
              { ikon: Target, baslik: "Gelişim Takibi", aciklama: "Teknoloji altyapısıyla düzenli ölçüm ve değerlendirme.", renk: "text-blue-400", bg: "from-blue-500/20 to-blue-500/5" },
              { ikon: Users, baslik: "Küçük Gruplar", aciklama: "Antrenör başına maksimum 10 öğrenci ile birebir ilgi.", renk: "text-purple-400", bg: "from-purple-500/20 to-purple-500/5" },
              { ikon: Award, baslik: "Lisanslı Antrenörler", aciklama: "Federasyon sertifikalı, deneyimli ve pedagoji eğitimli kadro.", renk: "text-amber-400", bg: "from-amber-500/20 to-amber-500/5" },
              { ikon: Heart, baslik: "Eğlenceli Öğrenme", aciklama: "Oyun tabanlı eğitim metoduyla çocuklar eğlenirken öğrenir.", renk: "text-rose-400", bg: "from-rose-500/20 to-rose-500/5" },
              { ikon: Calendar, baslik: "Esnek Program", aciklama: "Kredi sistemiyle istediğiniz gün, istediğiniz kadar gelin.", renk: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5" },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.bg}`}>
                  <item.ikon className={`h-5 w-5 ${item.renk}`} />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">{item.baslik}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{item.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Haftalık Ders Programı GRID */}
      <section id="program" className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <WeeklyScheduleGrid dersler={dersler} />
        </div>
      </section>

      {/* Paketler */}
      <section id="paketler" className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            Seans Bazlı Paketler
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-lg mx-auto">
            Aylık aidat yok! Kredi bazlı esnek sistem.
          </p>
          <div className="grid gap-6 lg:grid-cols-3">
            {STANDART_PAKETLER.map((p, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border p-7 transition-all ${
                  p.one_cikan
                    ? "border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent shadow-xl shadow-cyan-500/10 scale-[1.02]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {p.one_cikan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-cyan-500/30">
                    En Popüler
                  </div>
                )}
                <h3 className="text-lg font-bold">{p.baslik}</h3>
                <p className="text-xs text-gray-500 mt-1">{p.aciklama}</p>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {p.fiyat} ₺
                  </span>
                  <span className="text-sm text-gray-500"> / {p.seans} seans</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Ders başı: {p.birimFiyat} ₺</p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <CreditCard className={`h-4 w-4 ${p.one_cikan ? "text-cyan-400" : "text-gray-500"}`} />
                  <span className="text-xs text-gray-400">{p.taksit}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {p.ozellikler.map((oz, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${p.one_cikan ? "text-cyan-400" : "text-emerald-500"}`} />
                      {oz}
                    </li>
                  ))}
                </ul>
                {config.whatsapp && config.whatsapp.length > 5 && (
                  <a
                    href={`https://wa.me/${config.whatsapp}?text=Merhaba, ${p.baslik} hakkında bilgi almak istiyorum.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-6 block w-full rounded-full py-3 text-center text-sm font-bold transition-all ${
                      p.one_cikan
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Hemen Başla
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Sıkça Sorulan Sorular
          </h2>
          <div className="space-y-3">
            {SSS_ITEMS.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setAcikSSS(acikSSS === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition"
                >
                  <span className="font-medium text-gray-200 text-sm">{item.soru}</span>
                  {acikSSS === i ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-cyan-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-600" />
                  )}
                </button>
                {acikSSS === i && (
                  <div className="border-t border-white/5 px-5 py-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{item.cevap}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İletişim + Form */}
      <section id="iletisim" className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0a1628] to-[#070b14] overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold">İletişime Geçin</h2>
                <p className="mt-3 text-gray-400 text-sm">
                  Deneme dersi veya kayıt için bize ulaşın.
                </p>
                <div className="mt-6 space-y-3">
                  {config.telefon && config.telefon.replace(/\D/g, "").length >= 10 && (
                    <a href={`tel:${config.telefon}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition text-sm">
                      <Phone className="h-4 w-4 text-green-400" /> {config.telefon}
                    </a>
                  )}
                  <a href={`mailto:${config.email}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition text-sm">
                    <Mail className="h-4 w-4 text-blue-400" /> {config.email}
                  </a>
                  <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-300 hover:text-white transition text-sm">
                    <Instagram className="h-4 w-4 text-pink-400" /> {config.instagram}
                  </a>
                  <div className="flex items-center gap-3 text-gray-300 text-sm">
                    <MapPin className="h-4 w-4 text-blue-400 shrink-0" /> {config.adresKisa}
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 text-sm">
                    <Clock className="h-4 w-4 text-yellow-400" /> {config.calisma}
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  {config.whatsapp && config.whatsapp.length > 5 && (
                    <a
                      href={`https://wa.me/${config.whatsapp}?text=Merhaba, bilgi almak istiyorum.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
                  >
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                </div>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-white/5 bg-white/[0.02] p-8 md:p-12">
                <iframe
                  src={config.haritaEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 300 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Tesis Konumu"
                  className="w-full rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050810] py-10 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs text-gray-600">
            &copy; 2026 {config.ad}. Tüm hakları saklıdır.
          </p>
          <p className="text-[10px] text-gray-700 mt-1">Powered by YiSA-S Spor Teknolojileri</p>
        </div>
      </footer>

      {/* Tablet Bottom Nav */}
      <TenantTabletNav items={MEDIUM_TABLET_NAV} onNavigate={scrollTo} />

      {/* Floating WhatsApp — tablet'te bottom nav üzerinde */}
      {config.whatsapp && config.whatsapp.length > 5 && (
        <a
          href={`https://wa.me/${config.whatsapp}?text=Merhaba, bilgi almak istiyorum.`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl shadow-green-500/30 hover:bg-green-600 hover:scale-110 transition-all md:bottom-20 lg:bottom-6"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  )
}
