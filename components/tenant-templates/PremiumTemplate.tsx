"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Award,
  Calendar,
  Heart,
  Shield,
  Target,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  TrendingUp,
  Menu,
  X,
  CalendarClock,
} from "lucide-react"
import { STANDART_PAKETLER, getDersProgrami, type TenantConfig } from "@/lib/tenant-template-config"
import WeeklyScheduleGrid from "./WeeklyScheduleGrid"
import RobotGreeting from "./RobotGreeting"
import TenantTabletNav, { PREMIUM_TABLET_NAV } from "./TenantTabletNav"

/* ------------------------------------------------------------------ */
/*  Animasyon Yardimcilari                                             */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={`scroll-mt-20 ${className}`}
    >
      {children}
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Sabit Veriler (BJK / Genel)                                        */
/* ------------------------------------------------------------------ */
const BRANS_DETAY = {
  baslik: "Artistik Cimnastik",
  aciklama:
    "Yer hareketleri, paralel bar, halka ve atlama aletlerinde temel ve ileri düzey eğitim. Profesyonel ekipman ve güvenli ortamda, 4-14 yaş arası çocuklarımız için özel tasarlanmış programlar.",
  ozellikler: [
    "Yer Hareketleri & Akrobasi",
    "Paralel Bar & Asimetrik Bar",
    "Halka & Denge Aleti",
    "Atlama & Trampolin",
    "Esneklik & Kuvvet Geliştirme",
    "Müsabaka Hazırlık Programı",
  ],
}

const ANTRENORLER = [
  {
    ad: "Ahmet Karadeniz",
    unvan: "Baş Antrenör",
    uzmanlik: "Artistik Cimnastik",
    deneyim: "15 yıl",
    belge: "Cimnastik Federasyonu 3. Kademe",
  },
  {
    ad: "Zeynep Öztürk",
    unvan: "Yardımcı Antrenör",
    uzmanlik: "Artistik Cimnastik \u2014 Yer Hareketleri",
    deneyim: "8 yıl",
    belge: "Cimnastik Federasyonu 2. Kademe",
  },
  {
    ad: "Ali Yılmaz",
    unvan: "Yardımcı Antrenör",
    uzmanlik: "Artistik Cimnastik \u2014 Aletler",
    deneyim: "6 yıl",
    belge: "Cimnastik Federasyonu 2. Kademe",
  },
  {
    ad: "Sena Kaya",
    unvan: "Yardımcı Antrenör",
    uzmanlik: "Artistik Cimnastik \u2014 Ritmik & Esneklik",
    deneyim: "5 yıl",
    belge: "Cimnastik Federasyonu 1. Kademe",
  },
]

const YONETIM = [
  {
    ad: "Merve Görmezer",
    unvan: "Sportif Direktör",
    rol: "Tesis yönetimi ve program koordinasyonu",
  },
  {
    ad: "Pelin Çalık",
    unvan: "Kayıt Görevlisi",
    rol: "Öğrenci kayıt ve veli iletişimi",
  },
]

const TAKSIT_BILGI = {
  baslik: "Esnek Taksit Sistemi",
  aciklama:
    "48 ve 60 seanslik paketlerde ilk 30.000 TL ödeme sonrasında kalan tutar için 2 taksit seçeneği sunuyoruz. Ödeme tarihlerinizi kendiniz seçersiniz \u2014 en fazla 1 hafta uzatılabilir.",
  adimlar: [
    {
      adim: "1",
      baslik: "Paket Seçimi",
      aciklama: "24, 48 veya 60 seanslik paketten birini seçin.",
    },
    {
      adim: "2",
      baslik: "İlk Ödeme",
      aciklama: "30.000 TL ilk ödemeyi gerçekleştirin.",
    },
    {
      adim: "3",
      baslik: "Taksit Planlama",
      aciklama:
        "Kalan tutarı için ödeme tarihlerinizi kendiniz belirleyin (maks. 1 hafta esneklik).",
    },
    {
      adim: "4",
      baslik: "Başlayın!",
      aciklama:
        "Ödemeniz onaylandıktan sonra derslerinize başlayabilirsiniz.",
    },
  ],
}

const SSS = [
  {
    soru: "Deneme dersi ücretsiz mi?",
    cevap:
      "Evet! İlk deneme dersimiz tamamen ücretsizdir. Çocuğunuz salonu, antrenörleri ve arkadaşlarını tanısın.",
  },
  {
    soru: "Kaç yaşından itibaren başlayabilir?",
    cevap:
      "4 yaşından itibaren cimnastiğe başlanabilir. Yaş gruplarına göre sınıflar oluşturulur.",
  },
  {
    soru: "Ödeme sistemi nasıl çalışıyor?",
    cevap:
      "Seans bazlı kredi sistemi kullanıyoruz. 24, 48 veya 60 derslik paketlerden birini seçebilirsiniz. 24 ders 30.000 TL, 48 seans 52.800 TL, 60 seans 60.000 TL. İlk ödeme 30.000 TL, kalan tutarı kendi seçtiğiniz tarihlerde ödersiniz.",
  },
  {
    soru: "Taksit tarihleri nasıl belirleniyor?",
    cevap:
      "48 ve 60 seanslik paketlerde ilk 30.000 TL'yi ödedikten sonra, kalan tutar için ödeme tarihlerinizi kendiniz seçersiniz. Taksitler arasında en fazla 1 haftalık esneklik sunulmaktadır.",
  },
  {
    soru: "Ölçüm ve gelişim takibi nasıl yapılıyor?",
    cevap:
      "YiSA-S teknoloji altyapımız sayesinde çocuğunuzun fiziksel, teknik ve mental gelişimi düzenli olarak ölçülür. WHO ve Eurofit normlarına göre 10 perspektiften değerlendirme yapılır. Sonuçlar velilere dijital rapor olarak iletilir.",
  },
  {
    soru: "Kıyafet ve malzeme gerekli mi?",
    cevap:
      "Rahat spor kıyafeti ve çorap yeterlidir. İleri seviye için jimnastik mayosu önerilir. Tüm ekipman salonumuzda mevcuttur.",
  },
  {
    soru: "Kardeş indirimi var mı?",
    cevap:
      "48 ve 60 seanslik paketlerde kardeşler aynı kredi havuzunu kullanabilir \u2014 ayrı paket almanıza gerek yoktur.",
  },
]

/* ------------------------------------------------------------------ */
/*  Premium Şablon                                                     */
/* ------------------------------------------------------------------ */

interface PremiumTemplateProps {
  config: TenantConfig
}

export default function PremiumTemplate({ config }: PremiumTemplateProps) {
  const [formData, setFormData] = useState({
    ad: "",
    telefon: "",
    email: "",
    cocukYas: "",
    mesaj: "",
  })
  const [formGonderildi, setFormGonderildi] = useState(false)
  const [formHata, setFormHata] = useState("")
  const [gonderiyor, setGonderiyor] = useState(false)
  const [acikSSS, setAcikSSS] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [randevuOpen, setRandevuOpen] = useState(false)

  const dersler = getDersProgrami(config.slug)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ad || !formData.telefon || !formData.email) {
      setFormHata("Ad, telefon ve e-posta zorunludur.")
      return
    }
    setGonderiyor(true)
    setFormHata("")
    try {
      const res = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: formData.ad,
          phone: formData.telefon,
          email: formData.email || undefined,
          notes: `Çocuk yaşı: ${formData.cocukYas}. ${formData.mesaj}`.trim(),
          source: "vitrin",
        }),
      })
      if (res.ok) {
        setFormGonderildi(true)
      } else {
        setFormHata("Bir hata oluştu, lütfen tekrar deneyin.")
      }
    } catch {
      setFormHata("Bağlantı hatası, lütfen tekrar deneyin.")
    } finally {
      setGonderiyor(false)
    }
  }

  const NAV_LINKS = [
    { label: "Branşımız", href: "#brans" },
    { label: "Program", href: "#program" },
    { label: "Antrenörler", href: "#antrenorler" },
    { label: "Paketler", href: "#paketler" },
    { label: "Taksit", href: "#taksit" },
    { label: "S.S.S", href: "#sss" },
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
        const navHeight = 72
        const top = el.getBoundingClientRect().top + window.scrollY - navHeight
        window.scrollTo({ top, behavior: "smooth" })
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#060a13] text-white selection:bg-cyan-500/30">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#060a13]/95 backdrop-blur-lg shadow-lg shadow-black/20 border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.kisa} className="h-10 w-10 rounded-xl object-contain shadow-lg" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-gray-300 font-black text-sm text-black shadow-lg">
                {config.logoBadge}
              </div>
            )}
            <div>
              <p className="font-bold text-sm leading-tight text-white">
                {config.kisa}
              </p>
              <p className="text-[10px] text-cyan-400/70 tracking-wider uppercase">
                {config.ustBaslik}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => setRandevuOpen(true)}
              className="ml-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <CalendarClock className="h-4 w-4" />
              Randevu
            </button>
            <button
              onClick={() => scrollTo("#kayit")}
              className="ml-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
            >
              Ücretsiz Deneme
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 transition md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-white/5 bg-[#060a13]/98 backdrop-blur-lg md:hidden"
            >
              <div className="space-y-1 px-4 py-3">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className="block w-full rounded-lg px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setRandevuOpen(true)
                  }}
                  className="block w-full rounded-lg px-4 py-3 text-left text-sm text-cyan-300 hover:bg-white/5 transition"
                >
                  Randevu Al
                </button>
                <button
                  onClick={() => scrollTo("#kayit")}
                  className="mt-2 block w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Ücretsiz Deneme Dersi
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#060a13] via-[#0a1628] to-[#060a13]" />
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[150px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center md:px-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-cyan-300/80 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              {config.ustBaslik} Bünyesinde
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mx-auto mt-8 max-w-5xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl"
          >
            <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              {config.slogan}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 md:text-xl leading-relaxed"
          >
            {config.aciklama}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <button
              onClick={() => scrollTo("#kayit")}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
            >
              Ücretsiz Deneme Dersi
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            {config.telefon && config.telefon.replace(/\D/g, "").length >= 10 && (
              <a
                href={`tel:${config.telefon}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm hover:bg-white/10 transition-all"
              >
                <Phone className="h-5 w-5 text-green-400" />
                {config.telefon}
              </a>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4"
          >
            {[
              { sayi: "140+", etiket: "Aktif Sporcu" },
              { sayi: "4", etiket: "Uzman Antrenör" },
              { sayi: "7", etiket: "Profesyonel Kadro" },
              { sayi: "10+", etiket: "Yıl Deneyim" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent md:text-4xl">
                  {s.sayi}
                </p>
                <p className="mt-1 text-sm text-gray-500">{s.etiket}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-6 w-6 text-gray-500 animate-bounce" />
        </motion.div>
      </section>

      {/* Neden Biz */}
      <Section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Neden {config.kisa}?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Profesyonel kadromuz ve modern tesisimizle çocuğunuzun fiziksel,
              mental ve sosyal gelişimini destekliyoruz.
            </p>
          </motion.div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                ikon: Shield,
                baslik: "Güvenli Ortam",
                aciklama:
                  "Profesyonel ekipman, yumuşak zeminler ve sürekli gözetim altında antrenmanlar.",
                renk: "from-cyan-500/20 to-cyan-500/5",
                ikonRenk: "text-cyan-400",
              },
              {
                ikon: Target,
                baslik: "Kişisel Gelişim Takibi",
                aciklama:
                  "YiSA-S teknolojisiyle 10 perspektiften ölçüm ve WHO/Eurofit normlarına göre değerlendirme.",
                renk: "from-blue-500/20 to-blue-500/5",
                ikonRenk: "text-blue-400",
              },
              {
                ikon: Users,
                baslik: "Küçük Gruplar",
                aciklama:
                  "Antrenör başına maksimum 10 öğrenci ile birebir ilgi ve kaliteli eğitim.",
                renk: "from-purple-500/20 to-purple-500/5",
                ikonRenk: "text-purple-400",
              },
              {
                ikon: Award,
                baslik: "Lisanslı Antrenörler",
                aciklama:
                  "Cimnastik Federasyonu sertifikalı, deneyimli ve pedagoji eğitimli antrenör kadrosu.",
                renk: "from-amber-500/20 to-amber-500/5",
                ikonRenk: "text-amber-400",
              },
              {
                ikon: Heart,
                baslik: "Eğlenceli Öğrenme",
                aciklama:
                  "Oyun tabanlı eğitim metoduyla çocuklar eğlenirken öğrenir ve gelişir.",
                renk: "from-rose-500/20 to-rose-500/5",
                ikonRenk: "text-rose-400",
              },
              {
                ikon: Calendar,
                baslik: "Esnek Program",
                aciklama:
                  "Hafta içi ve hafta sonu seçenekleri. Kredi sistemiyle istediğiniz gün gelin.",
                renk: "from-emerald-500/20 to-emerald-500/5",
                ikonRenk: "text-emerald-400",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.renk}`}
                >
                  <item.ikon className={`h-6 w-6 ${item.ikonRenk}`} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">
                  {item.baslik}
                </h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {item.aciklama}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Brans — Artistik Cimnastik */}
      <Section id="brans" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400 uppercase tracking-wider">
                {config.brans}
              </span>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                {BRANS_DETAY.baslik}
              </h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                {BRANS_DETAY.aciklama}
              </p>
              <ul className="mt-6 space-y-3">
                {BRANS_DETAY.ozellikler.map((oz, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-300"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
                    {oz}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => scrollTo("#kayit")}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
              >
                Deneme Dersi Al
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-white/5 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-8xl">{"\u{1F938}"}</span>
                  <p className="mt-4 text-xl font-bold text-white">
                    {BRANS_DETAY.baslik}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">4-14 Yaş</p>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 px-4 py-2 backdrop-blur-sm">
                <p className="text-xs font-medium text-cyan-300">
                  Profesyonel Ekipman
                </p>
              </div>
              <div className="absolute -bottom-3 -left-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20 px-4 py-2 backdrop-blur-sm">
                <p className="text-xs font-medium text-amber-300">
                  Güvenli Zemin
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Haftalık Ders Programı GRID */}
      <Section id="program" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div variants={fadeUp}>
            <WeeklyScheduleGrid dersler={dersler} />
          </motion.div>
        </div>
      </Section>

      {/* Antrenörler */}
      <Section id="antrenorler" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Antrenör Kadromuz
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Federasyon lisanslı, deneyimli ve pedagoji eğitimli kadromuzla
              tanışın
            </p>
          </motion.div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {ANTRENORLER.map((a, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/10">
                  <Users className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{a.ad}</h3>
                <p className="text-sm font-medium text-cyan-400/80">
                  {a.unvan}
                </p>
                <p className="mt-1 text-xs text-gray-500">{a.uzmanlik}</p>
                <div className="mt-3 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p>{a.deneyim} deneyim</p>
                  <p>{a.belge}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="mt-10">
            <p className="text-center text-sm text-gray-500 mb-4">
              Yönetim Kadrosu
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {YONETIM.map((y, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/10">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{y.ad}</p>
                    <p className="text-xs text-gray-500">{y.unvan}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Paketler */}
      <Section id="paketler" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Seans Bazlı Paketler
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Aylık aidat yok! Kredi bazlı esnek sistem. İstediğiniz gün,
              istediğiniz kadar gelin.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {STANDART_PAKETLER.map((p, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                  p.one_cikan
                    ? "border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent shadow-2xl shadow-cyan-500/10 scale-[1.02] lg:scale-105"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {p.one_cikan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-cyan-500/30">
                    En Popüler
                  </div>
                )}
                <h3 className="text-xl font-bold">{p.baslik}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.aciklama}</p>
                <div className="mt-5">
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {p.fiyat} {"\u20BA"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {" "}
                    / {p.seans} seans
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Ders başı: {p.birimFiyat} {"\u20BA"}
                </p>

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <CreditCard
                    className={`h-4 w-4 shrink-0 ${p.one_cikan ? "text-cyan-400" : "text-gray-500"}`}
                  />
                  <span className="text-xs text-gray-400">{p.taksit}</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {p.ozellikler.map((oz, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${p.one_cikan ? "text-cyan-400" : "text-emerald-500"}`}
                      />
                      {oz}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => scrollTo("#kayit")}
                  className={`mt-8 block w-full rounded-full py-3.5 text-center text-sm font-bold transition-all ${
                    p.one_cikan
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                      : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Hemen Başla
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Taksit Sistemi */}
      <Section id="taksit" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              {TAKSIT_BILGI.baslik}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              {TAKSIT_BILGI.aciklama}
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TAKSIT_BILGI.adimlar.map((adim, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/10 text-lg font-bold text-cyan-400">
                  {adim.adim}
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">
                  {adim.baslik}
                </h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {adim.aciklama}
                </p>
                {i < TAKSIT_BILGI.adimlar.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 hidden lg:block" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            className="mx-auto mt-12 max-w-2xl rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-lg">
                Örnek: 60 Seanslik Paket
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">
                  1. Ödeme (kayıt anında)
                </span>
                <span className="font-semibold text-white">
                  30.000 {"\u20BA"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">
                  2. Taksit (tarih seçersiniz)
                </span>
                <span className="font-semibold text-white">
                  15.000 {"\u20BA"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">
                  3. Taksit (tarih seçersiniz)
                </span>
                <span className="font-semibold text-white">
                  15.000 {"\u20BA"}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-gray-300">Toplam</span>
                <span className="font-extrabold text-cyan-400">
                  60.000 {"\u20BA"}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* SSS */}
      <Section id="sss" className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Sıkça Sorulan Sorular
            </h2>
          </motion.div>
          <div className="mt-10 space-y-3">
            {SSS.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setAcikSSS(acikSSS === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition"
                >
                  <span className="font-medium text-gray-200">
                    {item.soru}
                  </span>
                  {acikSSS === i ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-cyan-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-gray-600" />
                  )}
                </button>
                <AnimatePresence>
                  {acikSSS === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-6 py-4">
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {item.cevap}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Kayit Formu */}
      <Section id="kayit" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0a1628] to-[#060a13] shadow-2xl">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 lg:p-16">
                <motion.div variants={fadeUp}>
                  <h2 className="text-3xl font-bold md:text-4xl">
                    Ücretsiz Deneme Dersi
                  </h2>
                  <p className="mt-4 text-gray-400">
                    Formu doldurun, sizi arayalım. Çocuğunuz için en uygun
                    branşı ve saati birlikte belirleyelim.
                  </p>
                </motion.div>
                <div className="mt-8 space-y-4">
                  {config.telefon && config.telefon.replace(/\D/g, "").length >= 10 && (
                    <a
                      href={`tel:${config.telefon}`}
                      className="flex items-center gap-3 text-gray-300 hover:text-white transition"
                    >
                      <Phone className="h-5 w-5 text-green-400" />
                      <span>{config.telefon}</span>
                    </a>
                  )}
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition"
                  >
                    <Instagram className="h-5 w-5 text-pink-400" />
                    <span>{config.instagram}</span>
                  </a>
                  <a
                    href={config.harita}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition"
                  >
                    <MapPin className="h-5 w-5 text-blue-400" />
                    <span className="text-sm">{config.adres}</span>
                  </a>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <span>{config.calisma}</span>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  {config.whatsapp && config.whatsapp.length > 5 && (
                    <a
                      href={`https://wa.me/${config.whatsapp}?text=Merhaba, deneme dersi hakkında bilgi almak istiyorum.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-medium text-white hover:bg-green-600 transition-all hover:shadow-lg hover:shadow-green-500/20"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                </div>
              </div>

              <div className="border-t border-white/5 bg-white/[0.02] p-8 md:border-l md:border-t-0 md:p-12 lg:p-16">
                {formGonderildi ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold">
                      Talebiniz Alındı!
                    </h3>
                    <p className="mt-2 text-gray-400">
                      En kısa sürede sizi arayacağız. Teşekkür ederiz.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Veli Adı Soyadı *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.ad}
                        onChange={(e) =>
                          setFormData({ ...formData, ad: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition"
                        placeholder="Adınız Soyadınız"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Telefon *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.telefon}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            telefon: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition"
                        placeholder="05XX XXX XX XX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        E-posta *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition"
                        placeholder="ornek@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Çocuğunuzun Yaşı
                      </label>
                      <input
                        type="text"
                        value={formData.cocukYas}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cocukYas: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition"
                        placeholder="Orn: 7"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Mesajınız
                      </label>
                      <textarea
                        rows={3}
                        value={formData.mesaj}
                        onChange={(e) =>
                          setFormData({ ...formData, mesaj: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition resize-none"
                        placeholder="Sormak istediğiniz bir şey varsa yazabilirsiniz..."
                      />
                    </div>
                    {formHata && (
                      <p className="text-sm text-red-400">{formHata}</p>
                    )}
                    <button
                      type="submit"
                      disabled={gonderiyor}
                      className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50"
                    >
                      {gonderiyor
                        ? "Gönderiliyor..."
                        : "Ücretsiz Deneme Dersi Talep Et"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Konum / Harita */}
      <Section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Konumumuz</h2>
            <p className="mt-4 text-gray-400">{config.adres}</p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="mt-10 overflow-hidden rounded-2xl border border-white/5"
          >
            <iframe
              src={config.haritaEmbed}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Tesis Konumu"
              className="w-full"
            />
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="mt-6 flex flex-wrap justify-center gap-4"
          >
            <a
              href={config.harita}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition"
            >
              <MapPin className="h-4 w-4 text-blue-400" />
              Google Maps ile Aç
            </a>
            {config.whatsapp && config.whatsapp.length > 5 && (
              <a
                href={`https://wa.me/${config.whatsapp}?text=Merhaba, tesisinize nasıl ulaşırım?`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition"
              >
                <MessageCircle className="h-4 w-4 text-green-400" />
                Yol Tarifi Al
              </a>
            )}
          </motion.div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#040811] py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt={config.kisa} className="h-10 w-10 rounded-xl object-contain" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-gray-300 font-black text-sm text-black">
                    {config.logoBadge}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">{config.kisa}</p>
                  <p className="text-xs text-gray-600">
                    {config.ustBaslik}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                {config.aciklama.slice(0, 120)}...
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white">İletişim</h4>
              <div className="mt-4 space-y-3 text-sm text-gray-500">
                {config.telefon && config.telefon.replace(/\D/g, "").length >= 10 && (
                  <a
                    href={`tel:${config.telefon}`}
                    className="flex items-center gap-2 hover:text-white transition"
                  >
                    <Phone className="h-4 w-4" /> {config.telefon}
                  </a>
                )}
                <a
                  href={`mailto:${config.email}`}
                  className="flex items-center gap-2 hover:text-white transition"
                >
                  <Mail className="h-4 w-4" /> {config.email}
                </a>
                <a
                  href={config.harita}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition"
                >
                  <MapPin className="h-4 w-4" /> {config.adresKisa}
                </a>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {config.calisma}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white">Sosyal Medya</h4>
              <div className="mt-4 flex gap-3">
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                {config.whatsapp && config.whatsapp.length > 5 && (
                  <a
                    href={`https://wa.me/${config.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>
              <div className="mt-6">
                <p className="text-xs text-gray-700">Powered by</p>
                <p className="text-sm font-medium text-gray-500">
                  YiSA-S Spor Teknolojileri
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/5 pt-8 text-center text-xs text-gray-700">
            <p>
              &copy; 2026 {config.ad}. Tüm hakları saklıdır. YiSA-S Franchise
              Sistemi
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
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

      {/* Robot Karşılama — Premium Özellik */}
      {config.whatsapp && config.whatsapp.length > 5 && (
        <RobotGreeting tesisAd={config.kisa} whatsapp={config.whatsapp} />
      )}

      {/* Randevu Modal — Premium Özellik */}
      <AnimatePresence>
        {randevuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setRandevuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1020] shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setRandevuOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20">
                  <CalendarClock className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Randevu Al</h3>
                  <p className="text-xs text-gray-500">{config.kisa} Deneme Dersi</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Deneme dersi randevusu almak için aşağıdaki kanallardan bize ulaşabilirsiniz:
                </p>

                {config.whatsapp && config.whatsapp.length > 5 && (
                  <a
                    href={`https://wa.me/${config.whatsapp}?text=Merhaba, deneme dersi için randevu almak istiyorum.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3.5 text-sm font-medium text-green-300 hover:bg-green-500/20 transition"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp ile Randevu Al
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </a>
                )}

                {config.telefon && config.telefon.replace(/\D/g, "").length >= 10 && (
                  <a
                    href={`tel:${config.telefon}`}
                    className="flex items-center gap-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition"
                  >
                    <Phone className="h-5 w-5 text-blue-400" />
                    Telefon: {config.telefon}
                    <ArrowRight className="h-4 w-4 ml-auto text-gray-600" />
                  </a>
                )}

                <button
                  onClick={() => {
                    setRandevuOpen(false)
                    setTimeout(() => scrollTo("#kayit"), 300)
                  }}
                  className="flex items-center gap-3 w-full rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition"
                >
                  <Calendar className="h-5 w-5" />
                  Formu Doldur
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </button>
              </div>

              <p className="mt-4 text-[10px] text-gray-600 text-center">
                Deneme dersiniz tamamen ücretsizdir.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tablet Bottom Nav */}
      <TenantTabletNav items={PREMIUM_TABLET_NAV} onNavigate={scrollTo} />
    </div>
  )
}
