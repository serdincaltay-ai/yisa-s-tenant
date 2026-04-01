'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Users,
  Trophy,
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  Bot,
  Dumbbell,
  GraduationCap,
  Heart,
  Shield,
  Target,
} from 'lucide-react'

/* ========== TYPES ========== */

type SectionKey = 'branslar' | 'antrenorler' | 'programlar' | 'avantajlar' | 'kayit' | 'iletisim' | null

interface SectionCard {
  key: SectionKey & string
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  gradient: string
}

/* ========== DATA ========== */

const SECTIONS: SectionCard[] = [
  {
    key: 'branslar',
    icon: <Dumbbell className="w-7 h-7" />,
    title: 'Branslarimiz',
    subtitle: 'Hangi sporlarda egitim veriyoruz?',
    color: '#00d4ff',
    gradient: 'linear-gradient(135deg, #00d4ff20, #00d4ff05)',
  },
  {
    key: 'antrenorler',
    icon: <GraduationCap className="w-7 h-7" />,
    title: 'Antrenorlerimiz',
    subtitle: 'Uzman kadromuz',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b98120, #10b98105)',
  },
  {
    key: 'programlar',
    icon: <Calendar className="w-7 h-7" />,
    title: 'Ders Programi',
    subtitle: 'Haftalik program ve saatler',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #818cf820, #818cf805)',
  },
  {
    key: 'avantajlar',
    icon: <Star className="w-7 h-7" />,
    title: 'Neden Biz?',
    subtitle: 'Tesisimizin avantajlari',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b20, #f59e0b05)',
  },
  {
    key: 'kayit',
    icon: <Heart className="w-7 h-7" />,
    title: 'Kayit Ol',
    subtitle: 'Hemen ucretsiz deneyin',
    color: '#e94560',
    gradient: 'linear-gradient(135deg, #e9456020, #e9456005)',
  },
  {
    key: 'iletisim',
    icon: <Phone className="w-7 h-7" />,
    title: 'Iletisim',
    subtitle: 'Bize ulasin',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d420, #06b6d405)',
  },
]

const BRANSLAR = [
  { name: 'Futbol', icon: <Trophy className="w-5 h-5" />, yas: '6-16 yas', desc: 'Teknik egitim, takim oyunu ve maclar' },
  { name: 'Basketbol', icon: <Target className="w-5 h-5" />, yas: '7-16 yas', desc: 'Temel teknikler, takim stratejisi' },
  { name: 'Yuzme', icon: <Heart className="w-5 h-5" />, yas: '5-15 yas', desc: 'Baslangictan ileri seviyeye yuzme egitimi' },
  { name: 'Jimnastik', icon: <Star className="w-5 h-5" />, yas: '4-14 yas', desc: 'Artistik ve ritmik jimnastik' },
  { name: 'Tenis', icon: <Dumbbell className="w-5 h-5" />, yas: '6-16 yas', desc: 'Bireysel ve grup tenis dersleri' },
  { name: 'Atletizm', icon: <Shield className="w-5 h-5" />, yas: '8-18 yas', desc: 'Kosu, atlama ve atma disiplinleri' },
]

const ANTRENORLER = [
  { name: 'Ahmet Kaya', brans: 'Futbol', tecrube: '12 yil', lisans: 'UEFA B Lisans', desc: 'Genclik takimlari uzmani' },
  { name: 'Elif Demir', brans: 'Yuzme', tecrube: '8 yil', lisans: 'Milli Sporcu', desc: 'Olimpiyat hazirlik antrenoru' },
  { name: 'Murat Ozturk', brans: 'Basketbol', tecrube: '10 yil', lisans: 'TBF 2. Kademe', desc: 'Alt yapi gelistirme uzmani' },
  { name: 'Ayse Yildiz', brans: 'Jimnastik', tecrube: '15 yil', lisans: 'FIG Sertifikali', desc: 'Ulusal sampiyona antrenoru' },
]

const PROGRAMLAR = [
  { gun: 'Pazartesi', dersler: [{ saat: '15:00-16:30', brans: 'Futbol', seviye: 'Baslangic' }, { saat: '16:30-18:00', brans: 'Basketbol', seviye: 'Orta' }] },
  { gun: 'Sali', dersler: [{ saat: '15:00-16:30', brans: 'Yuzme', seviye: 'Tum seviyeler' }, { saat: '17:00-18:30', brans: 'Jimnastik', seviye: 'Baslangic' }] },
  { gun: 'Carsamba', dersler: [{ saat: '15:00-16:30', brans: 'Futbol', seviye: 'Ileri' }, { saat: '16:30-18:00', brans: 'Tenis', seviye: 'Baslangic' }] },
  { gun: 'Persembe', dersler: [{ saat: '15:00-16:30', brans: 'Basketbol', seviye: 'Baslangic' }, { saat: '17:00-18:30', brans: 'Atletizm', seviye: 'Tum seviyeler' }] },
  { gun: 'Cuma', dersler: [{ saat: '15:00-16:30', brans: 'Yuzme', seviye: 'Ileri' }, { saat: '16:30-18:00', brans: 'Futbol', seviye: 'Mac gunu' }] },
]

const AVANTAJLAR = [
  { title: 'AI Destekli Olcum', desc: '900 alanda cocugunuzun gelisimini takip edin. PHV buyume plagi korumasi ile guvenli antrenman.', icon: <Bot className="w-5 h-5" /> },
  { title: 'Canli Veli Paneli', desc: 'Cocugunuzun yoklamasini, ders notlarini ve gelisim raporlarini telefonunuzdan aninda gorun.', icon: <Users className="w-5 h-5" /> },
  { title: 'Profesyonel Kadro', desc: 'Lisansli antrenorler, duzenli olcumler ve bireysel gelisim planlari.', icon: <GraduationCap className="w-5 h-5" /> },
  { title: 'Guvenli Tesis', desc: 'RFID giris sistemi, kamera izleme ve cocuk guvenlik protokolleri.', icon: <Shield className="w-5 h-5" /> },
  { title: 'Esnek Program', desc: 'Hafta ici ve hafta sonu seçenekleri. Telafi dersi imkani.', icon: <Clock className="w-5 h-5" /> },
  { title: 'Kolay Odeme', desc: 'Kredi karti, havale veya seans bazli odeme. Taksit secenekleri mevcut.', icon: <Star className="w-5 h-5" /> },
]

/* ========== SECTION DETAIL ========== */

function SectionDetail({ sectionKey, onBack }: { sectionKey: SectionKey & string; onBack: () => void }) {
  const section = SECTIONS.find((s) => s.key === sectionKey)
  if (!section) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="absolute inset-0 z-20 flex flex-col bg-[#040810]/[0.99]"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex items-center gap-2" style={{ color: section.color }}>
          {section.icon}
          <h2 className="text-lg font-bold text-white">{section.title}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* BRANSLAR */}
        {sectionKey === 'branslar' && (
          <div className="space-y-4">
            <p className="text-sm text-white/50 text-center mb-4">Tesisimizde sunulan branslar ve yas gruplari</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BRANSLAR.map((b) => (
                <div key={b.name} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-400/30 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-400/10 text-cyan-400">
                      {b.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{b.name}</h3>
                      <p className="text-[10px] text-white/40 font-mono">{b.yas}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANTRENORLER */}
        {sectionKey === 'antrenorler' && (
          <div className="space-y-4">
            <p className="text-sm text-white/50 text-center mb-4">Uzman egitim kadromuz</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ANTRENORLER.map((a) => (
                <div key={a.name} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-400 text-sm font-bold">
                      {a.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{a.name}</h3>
                      <p className="text-[10px] text-white/40">{a.brans} — {a.tecrube}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-400/70 font-mono mb-1">{a.lisans}</p>
                  <p className="text-[11px] text-white/50">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DERS PROGRAMI */}
        {sectionKey === 'programlar' && (
          <div className="space-y-4">
            <p className="text-sm text-white/50 text-center mb-4">Haftalik ders takvimi</p>
            <div className="space-y-3">
              {PROGRAMLAR.map((p) => (
                <div key={p.gun} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <div className="px-4 py-2 bg-[#818cf8]/10 border-b border-white/5">
                    <h3 className="text-sm font-bold text-[#818cf8]">{p.gun}</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {p.dersler.map((d) => (
                      <div key={d.saat} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-white/30" />
                          <span className="text-white/70 font-mono">{d.saat}</span>
                        </div>
                        <span className="text-white font-medium">{d.brans}</span>
                        <span className="text-white/40 text-[10px]">{d.seviye}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AVANTAJLAR */}
        {sectionKey === 'avantajlar' && (
          <div className="space-y-4">
            <p className="text-sm text-white/50 text-center mb-4">Tesisimizi tercih etmek icin 6 neden</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVANTAJLAR.map((a) => (
                <div key={a.title} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-2 text-amber-400">
                    {a.icon}
                    <h3 className="text-sm font-bold text-white">{a.title}</h3>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KAYIT */}
        {sectionKey === 'kayit' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-sm text-white/50 mb-2">Cocugunuzu hemen kayit edin!</p>
              <p className="text-xs text-white/30">Kayit formu tamamlandiktan sonra sizi arayacagiz.</p>
            </div>
            <div className="space-y-4 p-6 rounded-xl border border-[#e94560]/30 bg-[#e94560]/5">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Veli Adi Soyadi</label>
                <input type="text" placeholder="Ornek: Ahmet Yilmaz" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#e94560]/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Telefon</label>
                <input type="tel" placeholder="0532 xxx xx xx" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#e94560]/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Cocuk Adi</label>
                <input type="text" placeholder="Ornek: Ali" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#e94560]/50" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Ilgilenilen Brans</label>
                <select className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e94560]/50">
                  <option value="">Secin...</option>
                  {BRANSLAR.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button className="w-full py-3 rounded-lg bg-gradient-to-r from-[#e94560] to-[#d63851] text-white font-bold text-sm hover:opacity-90 transition-opacity">
                Kayit Formu Gonder
              </button>
            </div>
          </div>
        )}

        {/* ILETISIM */}
        {sectionKey === 'iletisim' && (
          <div className="space-y-4 max-w-md mx-auto">
            <p className="text-sm text-white/50 text-center mb-4">Bize ulasin</p>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <Phone className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-white/40">Telefon</p>
                  <p className="text-sm text-white font-medium">0212 xxx xx xx</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-white/40">E-posta</p>
                  <p className="text-sm text-white font-medium">info@tesisadi.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-white/40">Adres</p>
                  <p className="text-sm text-white font-medium">Ornek Mah. Spor Cad. No:1, Istanbul</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <Clock className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-white/40">Calisma Saatleri</p>
                  <p className="text-sm text-white font-medium">Hafta ici: 09:00-21:00 | Hafta sonu: 10:00-18:00</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ========== MAIN PAGE ========== */

export default function TenantHomePage() {
  const [activeSection, setActiveSection] = useState<SectionKey>(null)

  return (
    <div className="relative min-h-screen flex flex-col bg-[#040810]">
      {/* Hero Section */}
      <header className="shrink-0 bg-gradient-to-b from-[#0a1628] to-[#040810] px-5 pt-8 pb-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 mb-4">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400 tracking-wider">YISA-S ILE YONETILIYOR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Ornek Spor Akademi
          </h1>
          <p className="text-sm text-white/40 mb-4">
            AI destekli spor tesisi yonetim sistemi ile profesyonel spor egitimi
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-white/30">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Istanbul, Turkiye</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 350+ sporcu</span>
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> 6 brans</span>
          </div>
        </div>
      </header>

      {/* Section Cards Grid */}
      <main className="flex-1 px-4 sm:px-6 pb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-fr max-w-3xl mx-auto w-full">
        {SECTIONS.map((section) => (
          <motion.button
            key={section.key}
            onClick={() => setActiveSection(section.key as SectionKey)}
            className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 p-4 text-center transition-all hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: section.gradient }}
            whileHover={{ boxShadow: `0 0 30px ${section.color}15` }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: `${section.color}15`, color: section.color }}
            >
              {section.icon}
            </div>
            <h3 className="text-sm font-bold text-white mb-0.5">{section.title}</h3>
            <p className="text-[10px] text-white/40">{section.subtitle}</p>
            <ChevronRight className="absolute top-3 right-3 w-4 h-4 text-white/10" />
          </motion.button>
        ))}
      </main>

      {/* Footer — Staff login link */}
      <footer className="shrink-0 text-center py-4 border-t border-white/5">
        <a href="/auth/login" className="text-[10px] text-white/20 hover:text-white/40 transition-colors font-mono">
          Personel Girisi
        </a>
        <p className="text-[9px] text-white/10 mt-1">YiSA-S Tesis Isletim Sistemi ile yonetilmektedir</p>
      </footer>

      {/* Section Detail Overlay */}
      <AnimatePresence>
        {activeSection && (
          <SectionDetail sectionKey={activeSection} onBack={() => setActiveSection(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
