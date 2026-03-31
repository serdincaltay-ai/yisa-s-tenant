"use client"

/**
 * Franchise tesis ana sayfası (vitrin) — bjktesis tasarımından uyarlandı.
 * Subdomain bjktuzlacimnastik (veya diğer franchise) için kullanılır.
 * Logo, başlık ve iletişim bilgileri prop ile verilir (ileride tenant_settings’ten gelecek).
 */

import { useState } from "react"
import {
  Phone,
  MapPin,
  Instagram,
  User,
  Shield,
  MessageCircle,
  Calendar,
  ChevronRight,
  Globe,
  TrendingUp,
  Users,
  Mail,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export type TesisLandingProps = {
  siteName: string
  tagline?: string
  logoUrl?: string | null
  contact?: {
    address?: string
    phone?: string
    instagram?: string
    website?: string
    whatsappNumber?: string
  }
  /** Varsayılan: red (BJK) */
  accentColor?: "red" | "emerald" | "blue"
}

const ACCENT = {
  red: {
    btn: "bg-red-600 hover:bg-red-700",
    icon: "text-red-500",
    border: "border-red-500/20",
    focus: "focus:border-red-500",
  },
  emerald: {
    btn: "bg-emerald-600 hover:bg-emerald-700",
    icon: "text-emerald-500",
    border: "border-emerald-500/20",
    focus: "focus:border-emerald-500",
  },
  blue: {
    btn: "bg-blue-600 hover:bg-blue-700",
    icon: "text-blue-500",
    border: "border-blue-500/20",
    focus: "focus:border-blue-500",
  },
}

export default function TesisLanding({
  siteName,
  tagline = "Türkiye'nin Yapay Zeka Destekli İlk Spor Okulu",
  logoUrl,
  contact = {},
  accentColor = "red",
}: TesisLandingProps) {
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [showTrialModal, setShowTrialModal] = useState(false)

  const style = ACCENT[accentColor]
  const {
    address = "Tuzla, İstanbul",
    phone = "0555 123 45 67",
    instagram = "@bjktuzla",
    website = "www.bjktuzla.com",
    whatsappNumber = "905551234567",
  } = contact

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 3 + "s",
              animationDuration: Math.random() * 2 + 2 + "s",
            }}
          />
        ))}
      </div>

      <div className="fixed top-6 right-6 flex gap-3 z-50">
        <Link
          href="/auth/login"
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg transition-all border border-white/10 hover:border-white/30"
        >
          <User className="w-4 h-4" />
          <span className="font-semibold">Üye Girişi</span>
        </Link>
        <Link
          href="/auth/login"
          className={`flex items-center gap-2 ${style.btn} text-white px-5 py-2.5 rounded-lg transition-all`}
        >
          <Shield className="w-4 h-4" />
          <span className="font-semibold">Admin</span>
        </Link>
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            {logoUrl ? (
              <Image src={logoUrl} alt={siteName} width={128} height={128} className="h-32 w-auto object-contain" />
            ) : (
              <div className="h-32 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{siteName}</span>
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl text-white font-bold mb-3">{siteName.toUpperCase()}</h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light">{tagline}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Box 1 - Biz Kimiz */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-300 hover:border-white/30">
            <div className="flex items-center gap-3 mb-4">
              <Users className={`w-8 h-8 ${style.icon}`} />
              <h3 className="text-2xl font-bold text-white">Biz Kimiz?</h3>
            </div>
            <ul className="text-gray-300 space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <ChevronRight className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                <span>Yapay zeka teknolojisiyle antrenman programı</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                <span>Bilimsel verilerle çocuk gelişim takibi</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                <span>Pedagojik yaklaşımla eğitim</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                <span>Türkiye&apos;nin ilk ve tek spor okulu</span>
              </li>
            </ul>
            <button
              onClick={() => setShowAboutModal(true)}
              className={`w-full ${style.btn} text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2`}
            >
              Detaylı Bilgi
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Box 2 - Gelişim Takibi */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-300 hover:border-white/30">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className={`w-8 h-8 ${style.icon}`} />
              <h3 className="text-2xl font-bold text-white">Gelişim Takibi</h3>
            </div>
            <ul className="text-gray-300 space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <ChevronRight className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                <span>Yaşa göre karşılaştırma</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                <span>Cinsiyete göre analiz</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                <span>Kişisel gelişim grafikleri</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                <span>Veliye düzenli raporlama</span>
              </li>
            </ul>
            <button
              onClick={() => setShowReportModal(true)}
              className={`w-full ${style.btn} text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2`}
            >
              Örnek Rapor Gör
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Box 3 - Giriş & Randevu */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-300 hover:border-white/30">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className={`w-8 h-8 ${style.icon}`} />
              <h3 className="text-2xl font-bold text-white">Giriş & Randevu</h3>
            </div>
            <div className="space-y-3">
              <Link href="/auth/login" className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-semibold transition text-center">
                Üye Girişi
              </Link>
              <Link href="/franchise/ogrenci-yonetimi" className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-semibold transition text-center">
                Ders Programı
              </Link>
              <button onClick={() => setShowPackageModal(true)} className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-semibold transition text-center w-full">
                Paketleri İncele
              </button>
              <Link href="/franchise/iletisim" className={`block w-full ${style.btn} text-white py-3 rounded-lg font-semibold transition text-center`}>
                Yapay Zeka Danışmanı
              </Link>
            </div>
          </div>

          {/* Box 4 - İletişim */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-300 hover:border-white/30">
            <div className="flex items-center gap-3 mb-4">
              <Mail className={`w-8 h-8 ${style.icon}`} />
              <h3 className="text-2xl font-bold text-white">İletişim</h3>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className={`w-5 h-5 ${style.icon} flex-shrink-0`} />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className={`w-5 h-5 ${style.icon} flex-shrink-0`} />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Instagram className={`w-5 h-5 ${style.icon} flex-shrink-0`} />
                <span>{instagram}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Globe className={`w-5 h-5 ${style.icon} flex-shrink-0`} />
                <span>{website}</span>
              </div>
            </div>
            <div className="space-y-3">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Yazın
              </a>
              <button onClick={() => setShowTrialModal(true)} className={`w-full ${style.btn} text-white py-3 rounded-lg font-semibold transition`}>
                Deneme Dersi Randevusu
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-400 text-sm">© {new Date().getFullYear()} {siteName}</div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Biz Kimiz?</h2>
              <button onClick={() => setShowAboutModal(false)} className="text-white hover:text-red-500 text-2xl">×</button>
            </div>
            <div className="text-gray-300 space-y-4">
              <p>
                {siteName}, Türkiye&apos;nin yapay zeka destekli ilk spor okuludur. Köklü spor geçmişi ve modern teknolojinin birleşimiyle çocuklarınızın potansiyelini en üst seviyeye çıkarıyoruz.
              </p>
              <p>
                Her çocuğun fiziksel ve zihinsel gelişimini bilimsel verilerle takip ediyor, kişiye özel antrenman programları oluşturuyoruz.
              </p>
              <p className={`font-semibold ${style.icon}`}>Çocuğunuz, bizimle geleceğin şampiyonları arasında olacak!</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Örnek Gelişim Raporu</h2>
              <button onClick={() => setShowReportModal(false)} className="text-white hover:text-red-500 text-2xl">×</button>
            </div>
            <div className="space-y-6">
              <div className={`bg-black/50 border ${style.border} rounded-lg p-6`}>
                <h3 className="text-lg font-bold text-white mb-4">Ahmet (8 yaş) - Aylık Rapor</h3>
                <div className="space-y-3 text-gray-300">
                  {["Esneklik +15%", "Kuvvet +22%", "Denge +18%", "Koordinasyon +12%"].map((label, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span>{label.split(" ")[0]}</span>
                        <span className="text-green-500">{label.split(" ")[1]}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${65 + i * 5}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-4">* Yaş grubuna göre ortalamanın üzerinde performans</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Paketlerimiz</h2>
              <button onClick={() => setShowPackageModal(false)} className="text-white hover:text-red-500 text-2xl">×</button>
            </div>
            <div className="space-y-6">
              <div className={`bg-black/50 border ${style.border} rounded-lg p-6`}>
                <h3 className="text-xl font-bold text-white mb-2">Standart Paket</h3>
                <p className={`text-3xl font-bold ${style.icon} mb-4`}>30.000₺</p>
                <ul className="text-gray-300 space-y-2">
                  <li>• 24 ders (Haftada 2 gün)</li>
                  <li>• Yapay zeka performans takibi</li>
                  <li>• Aylık değerlendirme raporu</li>
                </ul>
              </div>
              <div className={`${style.btn} rounded-lg p-6 relative`}>
                <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">EN POPÜLER</div>
                <h3 className="text-xl font-bold text-white mb-2">Hesaplı Paket</h3>
                <p className="text-3xl font-bold text-white mb-4">54.000₺</p>
                <ul className="text-white space-y-2">
                  <li>• 48 ders (Haftada 4 gün)</li>
                  <li>• Yapay zeka performans takibi</li>
                  <li>• Haftalık değerlendirme raporu</li>
                  <li>• Branş danışmanlığı</li>
                </ul>
              </div>
              <div className={`bg-black/50 border ${style.border} rounded-lg p-6`}>
                <h3 className="text-xl font-bold text-white mb-2">Süper Paket</h3>
                <p className={`text-3xl font-bold ${style.icon} mb-4`}>60.000₺</p>
                <ul className="text-gray-300 space-y-2">
                  <li>• 60 ders (Haftada 5 gün)</li>
                  <li>• Yapay zeka performans takibi</li>
                  <li>• Günlük değerlendirme raporu</li>
                  <li>• Özel koçluk</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Deneme Dersi Randevusu</h2>
              <button onClick={() => setShowTrialModal(false)} className="text-white hover:text-red-500 text-2xl">×</button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                alert("Randevu talebiniz alındı!")
                setShowTrialModal(false)
              }}
            >
              <div>
                <label className="block text-white mb-2">Veli Adı Soyadı</label>
                <input type="text" required className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/50" placeholder="Ad Soyad" />
              </div>
              <div>
                <label className="block text-white mb-2">Telefon</label>
                <input type="tel" required className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/50" placeholder="0555 123 45 67" />
              </div>
              <div>
                <label className="block text-white mb-2">Çocuk Adı</label>
                <input type="text" required className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/50" placeholder="Çocuğun adı" />
              </div>
              <div>
                <label className="block text-white mb-2">Yaş</label>
                <input type="number" required min={4} max={18} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/50" placeholder="Örn: 7" />
              </div>
              <button type="submit" className={`w-full ${style.btn} text-white py-3 rounded-lg font-semibold transition`}>
                Randevu Talebi Gönder
              </button>
              <p className="text-gray-400 text-sm text-center">Size en kısa sürede dönüş yapacağız</p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
