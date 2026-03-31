"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Globe,
  Image,
  LayoutTemplate,
  Settings,
  Bot,
  Check,
  ArrowRight,
  Store,
  Users,
} from "lucide-react"
import { YisaLogo } from "@/components/YisaLogo"
import {
  calculatePrice,
  KADEME_TABLO,
  PAKET_TIPLERI,
  SLIDER_MIN,
  SLIDER_MAX,
  type PaketTipi,
} from "@/lib/pricing/kademe"

const SABLONLAR = [
  { id: "klasik", name: "Klasik", desc: "Sade ve profesyonel", ekFiyat: 0 },
  { id: "modern", name: "Modern", desc: "Gradient ve animasyonlu", ekFiyat: 500 },
  { id: "minimal", name: "Minimal", desc: "Beyaz ağırlıklı, temiz", ekFiyat: 300 },
  { id: "vitrin", name: "Vitrin", desc: "Büyük görseller, dikkat çekici", ekFiyat: 700 },
  { id: "akademi", name: "Akademi", desc: "Eğitim odaklı", ekFiyat: 400 },
]

const TESIS_SABLONLARI = [
  { id: "temel", name: "Temel tesis yönetimi", desc: "Üye, aidat, yoklama", ekFiyat: 0 },
  { id: "gelismis", name: "Gelişmiş tesis yönetimi", desc: "Raporlar, COO robotları", ekFiyat: 400 },
  { id: "tam", name: "Tam paket", desc: "Tüm şablonlar, çoklu şube", ekFiyat: 800 },
]

const GIRIS_UCRETI = 1500
const AYLIK_BAZ = 499

/** Franchise müşterisi — site kurmak için seçim yaptığı vitrin. Canlı fiyat gösterilir. */
export default function VitrinPage() {
  const [web, setWeb] = useState(true)
  const [logo, setLogo] = useState(true)
  const [sablonId, setSablonId] = useState<string>("modern")
  const [tesisSablonId, setTesisSablonId] = useState<string>("temel")
  const [robot, setRobot] = useState(false)
  const [gonderildi, setGonderildi] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [form, setForm] = useState({ ad: "", email: "", tesisTuru: "Cimnastik" })

  const sablonFiyat = SABLONLAR.find((s) => s.id === sablonId)?.ekFiyat ?? 0
  const tesisFiyat = TESIS_SABLONLARI.find((t) => t.id === tesisSablonId)?.ekFiyat ?? 0
  const toplamTek =
    GIRIS_UCRETI +
    (web ? 0 : 0) +
    (logo ? 800 : 0) +
    sablonFiyat +
    tesisFiyat +
    (robot ? 200 : 0)
  const aylik = AYLIK_BAZ + (robot ? 150 : 0)

  const handleGonder = async () => {
    const name = form.ad?.trim() || "Vitrin Talebi"
    const email = form.email?.trim()
    if (!email) {
      setHata("E-posta zorunludur.")
      return
    }
    setHata(null)
    setGonderiliyor(true)
    try {
      const notesObj = {
        web,
        logo,
        sablonId,
        tesisSablonId,
        robot,
        toplamTek,
        aylik,
      }
      const res = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          facility_type: form.tesisTuru || "Cimnastik",
          notes: JSON.stringify(notesObj),
          source: "vitrin",
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        setGonderildi(true)
      } else {
        setHata(data?.error || "Gönderilemedi.")
      }
    } catch {
      setHata("Bağlantı hatası.")
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <YisaLogo />
            <span className="font-semibold text-white/90">Vitrin — Paket Seçimi</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                Giriş Yap
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="sm" className="border-emerald-500/50 text-emerald-400">
                Demo Talep Et
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <p className="text-emerald-400/90 text-sm font-medium mb-3">
            İstediğiniz hizmetleri seçin, fiyatı anında görün. Anlaştığımızda tesis paneliniz hazır.
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white/95 mb-2">
            Tesisiniz için ne istiyorsunuz?
          </h1>
          <p className="text-white/50 text-sm">
            Seçimlerinize göre canlı fiyat hesaplanır. Franchise fuarlarında tanıttığımız ESP paketi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol: Seçenekler */}
          <div className="lg:col-span-2 space-y-6">
            <OptionCard
              icon={Globe}
              title="Web sitesi"
              desc="Tesisinize özel web sitesi"
              checked={web}
              onToggle={() => setWeb(!web)}
              fiyat={0}
            />
            <OptionCard
              icon={Image}
              title="Logo"
              desc="Profesyonel logo tasarımı"
              checked={logo}
              onToggle={() => setLogo(!logo)}
              fiyat={800}
            />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <LayoutTemplate className="h-6 w-6 text-emerald-400" />
                <h3 className="font-semibold text-white/90">Site şablonu</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">Görünüm ve stil</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SABLONLAR.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      sablonId === s.id
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sablon"
                      checked={sablonId === s.id}
                      onChange={() => setSablonId(s.id)}
                      className="sr-only"
                    />
                    <span className="font-medium text-white/90">{s.name}</span>
                    {s.ekFiyat > 0 && (
                      <span className="text-xs text-emerald-400 ml-auto">+{s.ekFiyat} ₺</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-6 w-6 text-cyan-400" />
                <h3 className="font-semibold text-white/90">Tesis yönetimi şablonu</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">Panelde hangi özellikler olsun?</p>
              <div className="space-y-2">
                {TESIS_SABLONLARI.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      tesisSablonId === t.id
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tesis"
                      checked={tesisSablonId === t.id}
                      onChange={() => setTesisSablonId(t.id)}
                      className="sr-only"
                    />
                    <span className="font-medium text-white/90">{t.name}</span>
                    {t.ekFiyat > 0 && (
                      <span className="text-xs text-cyan-400 ml-auto">+{t.ekFiyat} ₺</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <OptionCard
              icon={Bot}
              title="Robot / asistan kotası"
              desc="Aylık AI robot kullanımı"
              checked={robot}
              onToggle={() => setRobot(!robot)}
              fiyat={200}
              aylikArtis={150}
            />
          </div>

          {/* Sağ: Canlı fiyat */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-5 w-5 text-emerald-400" />
                <h3 className="font-semibold text-white/90">Canlı fiyat</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Giriş ücreti (tek sefer)</span>
                  <span>{GIRIS_UCRETI} ₺</span>
                </div>
                {logo && (
                  <div className="flex justify-between text-white/70">
                    <span>Logo</span>
                    <span>800 ₺</span>
                  </div>
                )}
                {sablonFiyat > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Şablon ek</span>
                    <span>+{sablonFiyat} ₺</span>
                  </div>
                )}
                {tesisFiyat > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Tesis şablonu ek</span>
                    <span>+{tesisFiyat} ₺</span>
                  </div>
                )}
                {robot && (
                  <div className="flex justify-between text-white/70">
                    <span>Robot kota (tek)</span>
                    <span>+200 ₺</span>
                  </div>
                )}
              </div>
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between font-semibold text-white/90">
                  <span>Toplam (tek sefer)</span>
                  <span className="text-emerald-400">{toplamTek.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className="flex justify-between text-sm text-white/60 mt-2">
                  <span>Aylık abonelik</span>
                  <span>{aylik} ₺/ay</span>
                </div>
              </div>
              {!gonderildi ? (
                <>
                  <div className="mt-6 space-y-3">
                    <Input
                      placeholder="Ad Soyad"
                      value={form.ad}
                      onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))}
                      className="bg-white/5 border-white/10 h-10 rounded-xl text-white placeholder:text-white/40"
                    />
                    <Input
                      type="email"
                      placeholder="E-posta *"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="bg-white/5 border-white/10 h-10 rounded-xl text-white placeholder:text-white/40"
                      required
                    />
                    <Input
                      placeholder="Tesis türü (örn. Cimnastik)"
                      value={form.tesisTuru}
                      onChange={(e) => setForm((f) => ({ ...f, tesisTuru: e.target.value }))}
                      className="bg-white/5 border-white/10 h-10 rounded-xl text-white placeholder:text-white/40"
                    />
                  </div>
                  {hata && (
                    <p className="mt-2 text-sm text-red-400">{hata}</p>
                  )}
                  <Button
                    className="w-full mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                    onClick={handleGonder}
                    disabled={gonderiliyor}
                  >
                    {gonderiliyor ? "Gönderiliyor..." : "Seçimleri gönder"}
                  </Button>
                </>
              ) : (
                <div className="mt-6 p-4 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm text-center flex flex-col items-center justify-center gap-2">
                  <Check className="h-5 w-5" />
                  <span>Talebiniz alındı. Patron onayından sonra tesis paneliniz kurulacak.</span>
                </div>
              )}
              <p className="text-xs text-white/40 mt-4 text-center">
                Giriş yaparak seçimlerinizi hesabınıza kaydedebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Kademe Fiyatlandırma Slider ─── */}
        <KademeFiyatSlider />

        <div className="mt-12 text-center">
          <p className="text-white/50 text-sm mb-4">
            Beşiktaş Tuzla Cimnastik Okulu gibi franchise müşterilerimiz bu ekrandan seçim yapıp
            fiyatı görüyor. Tenant (tesis) oluşturulduktan sonra kendi paneline giriş yapıyor.
          </p>
          <Link href="/auth/login" className="text-emerald-400 hover:underline text-sm inline-flex items-center gap-1">
            Giriş yap <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}

function KademeFiyatSlider() {
  const [ogrenciSayisi, setOgrenciSayisi] = useState(100)
  const [paketTipi, setPaketTipi] = useState<PaketTipi>("pro")

  const sonuc = calculatePrice(ogrenciSayisi, paketTipi)

  return (
    <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white/95">Kademe Fiyatlandırma</h2>
      </div>
      <p className="text-sm text-white/50 mb-8">
        Öğrenci sayınızı seçin, paketle birlikte canlı fiyatı görün. Fazla öğrenci = düşük birim fiyat.
      </p>

      {/* Paket secimi */}
      <div className="flex flex-wrap gap-3 mb-8">
        {(Object.entries(PAKET_TIPLERI) as [PaketTipi, { ad: string; aciklama: string }][]).map(
          ([key, val]) => (
            <button
              key={key}
              onClick={() => setPaketTipi(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition border ${
                paketTipi === key
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              {val.ad}
            </button>
          ),
        )}
      </div>

      {/* Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/70">Öğrenci sayısı</span>
          <span className="text-2xl font-bold text-emerald-400">{sonuc.ogrenciSayisi}</span>
        </div>
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={1}
          value={ogrenciSayisi}
          onChange={(e) => setOgrenciSayisi(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>{SLIDER_MIN}</span>
          <span>{SLIDER_MAX}</span>
        </div>
      </div>

      {/* Kademe gostergesi */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
        {KADEME_TABLO.map((k) => {
          const aktif = sonuc.kademeEtiket === k.etiket
          return (
            <div
              key={k.ust}
              className={`p-3 rounded-xl border text-center text-xs transition ${
                aktif
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 text-white/40"
              }`}
            >
              <div className="font-medium">{k.etiket}</div>
              <div className="mt-1">{k.birimFiyat[paketTipi]} TL/öğrenci</div>
            </div>
          )
        })}
      </div>

      {/* Fiyat sonucu */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="text-xs text-white/50 mb-1">Birim fiyat</div>
          <div className="text-lg font-bold text-cyan-400">{sonuc.birimFiyat} TL</div>
          <div className="text-xs text-white/40">/öğrenci/ay</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
          <div className="text-xs text-white/50 mb-1">Aylık toplam</div>
          <div className="text-2xl font-bold text-emerald-400">
            {sonuc.aylikFiyat.toLocaleString("tr-TR")} TL
          </div>
          <div className="text-xs text-white/40">/ay</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="text-xs text-white/50 mb-1">Yıllık (%10 indirim)</div>
          <div className="text-lg font-bold text-amber-400">
            {sonuc.yillikFiyat.toLocaleString("tr-TR")} TL
          </div>
          <div className="text-xs text-white/40">/yıl</div>
        </div>
      </div>
    </div>
  )
}

function OptionCard({
  icon: Icon,
  title,
  desc,
  checked,
  onToggle,
  fiyat,
  aylikArtis,
}: {
  icon: React.ElementType
  title: string
  desc: string
  checked: boolean
  onToggle: () => void
  fiyat: number
  aylikArtis?: number
}) {
  return (
    <div
      className={`rounded-2xl border p-6 transition cursor-pointer ${
        checked ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-white/5"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            checked ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white/90">{title}</h3>
            {fiyat > 0 && (
              <span className="text-xs text-emerald-400">
                +{fiyat} ₺{aylikArtis != null ? ` + ${aylikArtis} ₺/ay` : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-white/50 mt-0.5">{desc}</p>
        </div>
        <div
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
            checked ? "border-emerald-500 bg-emerald-500/20" : "border-white/30"
          }`}
        >
          {checked && <Check className="h-4 w-4 text-emerald-400" />}
        </div>
      </div>
    </div>
  )
}
