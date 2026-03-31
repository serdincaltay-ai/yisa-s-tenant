"use client"

/**
 * YİSA-S Ana Sayfa (www / patron olmayan ana domain) — V0 Brillance SaaS Landing
 * Sadece yisa-s.com ve www.yisa-s.com için gösterilir; franchise_site için TesisLanding kullanılır.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Bot,
  Zap,
  Users,
  BarChart3,
  User,
  Crown,
  Store,
  Mail,
  MapPin,
  Check,
} from "lucide-react"
import Link from "next/link"
import { YisaLogoInline } from "@/components/YisaLogo"

const PACKAGES = [
  { name: "Starter", price: "499", period: "/ay", features: ["50 üye", "1 şube", "Temel robotlar", "Veli paneli", "E-posta destek"], highlight: false },
  { name: "Pro", price: "999", period: "/ay", features: ["200 üye", "3 şube", "Tüm robotlar", "WhatsApp entegrasyonu", "Öncelikli destek", "Gelişim grafikleri"], highlight: true },
  { name: "Enterprise", price: "Özel", period: "", features: ["Sınırsız üye", "Çoklu şube", "Özel entegrasyonlar", "Dedicated destek", "Özelleştirme", "API erişimi"], highlight: false },
]

const FEATURES = [
  { icon: Bot, title: "AI Robotlar", desc: "Mailler, demolar, aidat takibi. Karşılama ve acil destek robotları." },
  { icon: Zap, title: "Otomatik Yönetim", desc: "İşletmeyi robotlar yürütür. Ders programı, yoklama, kasa defteri." },
  { icon: Users, title: "Veli Takibi", desc: "Çocuk gelişimi, ölçümler, antrenman programı. Veliler panelden takip eder." },
  { icon: BarChart3, title: "Veri ile Eğitim", desc: "Parametreler, grafikler, raporlar. Bilimsel veriyle sporcu gelişimi." },
]

const REFERANSLAR = [
  { ad: "Merve Görmezler", unvan: "Firma Sahibi, Sportif Direktör" },
  { ad: "Emre Han Dalgıç", unvan: "Uzman Antrenör" },
  { ad: "Özlem Kuşkan", unvan: "Antrenör" },
  { ad: "Alper Görmezler", unvan: "İşletme Müdürü" },
]

const FAQ_ITEMS = [
  { q: "YİSA-S nedir?", a: "Spor tesislerini AI robotlarla yöneten franchise sistemidir. Cimnastik, yüzme ve benzeri tesisler için otomatik yönetim, veli takibi ve veri odaklı eğitim sunar." },
  { q: "Demo nasıl talep edilir?", a: "Bu sayfadaki Demo Talep Et butonuna tıklayın, formu doldurun. 10 iş günü içinde sizinle iletişime geçeceğiz." },
  { q: "Hangi paket bana uygun?", a: "Küçük tesisler için Starter, orta ölçek için Pro, çok şubeli işletmeler için Enterprise önerilir. Detaylar için Fiyatlar sayfasına bakın." },
  { q: "Pilot tesis nedir?", a: "Tuzla Beşiktaş Cimnastik Okulu ilk pilot tesisimizdir. Demo girişi ile paneli deneyebilirsiniz." },
]

export default function HomeClient() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ ad: "", email: "", telefon: "", tesis_turu: "", sehir: "" })
  const [formSending, setFormSending] = useState(false)
  const [formDone, setFormDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formSending) return
    setFormSending(true)
    try {
      const res = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.ad,
          email: formData.email,
          phone: formData.telefon || null,
          facility_type: formData.tesis_turu || null,
          city: formData.sehir || null,
          source: "www",
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        setFormDone(true)
        setFormData({ ad: "", email: "", telefon: "", tesis_turu: "", sehir: "" })
        setTimeout(() => { setShowForm(false); setFormDone(false) }, 2000)
      } else {
        alert(data?.error || "Kayıt sırasında hata oluştu.")
      }
    } catch {
      alert("Bağlantı hatası. Lütfen tekrar deneyin.")
    } finally {
      setFormSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-gray-800 bg-gray-950/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <YisaLogoInline href="/" />
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-pink-500/20 rounded-lg gap-2 text-sm">
                <Crown className="h-4 w-4" /> Giriş
              </Button>
            </Link>
            <Link href="/dashboard/sablonlar">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-pink-500/20 rounded-lg gap-2 text-sm">
                <Store className="h-4 w-4" /> Vitrin
              </Button>
            </Link>
            <a href="https://yisa-s.com/fiyatlandirma">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-pink-500/20 rounded-lg gap-2 text-sm">Fiyatlar</Button>
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center pt-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-pink-500/5 pointer-events-none" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 max-w-3xl relative">Tesisinizi AI Robotlarla Yönetin</h1>
          <p className="text-gray-400 max-w-xl mb-10 text-base sm:text-lg relative">Cimnastik ve spor tesisi yönetimi. Ders programı, yoklama, veli takibi — hepsi otomatik.</p>
          <div className="flex flex-col sm:flex-row gap-4 relative">
            <Link href="/auth/login">
              <Button size="lg" className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-12 font-semibold text-base shadow-lg shadow-emerald-500/25">Giriş Yap</Button>
            </Link>
            <Button onClick={() => setShowForm(true)} size="lg" variant="outline" className="rounded-xl border-pink-500/40 text-pink-300 hover:bg-pink-500/20 px-8 h-12 font-medium">Demo Talep Et</Button>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-800">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Neler Sunuyoruz?</h2>
          <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">AI robotlar, otomatik yönetim ve veli takibi ile tesisinizi verimli yönetin.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              const accents = [
                { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
                { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
                { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
                { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
              ]
              const a = accents[i % accents.length]
              return (
                <Card key={f.title} className={`bg-gray-900 border ${a.border} rounded-2xl overflow-hidden hover:shadow-lg transition-all`}>
                  <CardHeader>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.bg} ${a.text} mb-2`}><Icon className="h-6 w-6" /></div>
                    <CardTitle className="text-lg text-white">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-sm text-gray-400">{f.desc}</p></CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-800 bg-gray-900/50">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">İlk Pilot Tesisimiz</h2>
          <p className="text-center text-gray-400 mb-12 max-w-xl mx-auto">Tuzla Beşiktaş Cimnastik Okulu — Demo girişi ile paneli deneyin.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {REFERANSLAR.map((r, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800 rounded-2xl hover:border-pink-500/30 transition-colors">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/20 text-pink-400 shrink-0"><User className="h-6 w-6" /></div>
                  <div>
                    <p className="font-semibold text-white">{r.ad}</p>
                    <p className="text-sm text-gray-400">{r.unvan}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/patron/login">
              <Button className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white px-6 h-11 shadow-lg shadow-pink-500/20">Giriş Yap — Deneyin</Button>
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-24 border-t border-gray-800">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Paketler</h2>
          <p className="text-center text-gray-400 mb-16 max-w-xl mx-auto">İhtiyacınıza uygun paketi seçin.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PACKAGES.map((pkg) => (
              <Card
                key={pkg.name}
                className={`rounded-2xl overflow-hidden ${pkg.highlight ? "border-pink-500/50 bg-pink-500/10 ring-2 ring-pink-500/30 shadow-lg shadow-pink-500/10" : "bg-gray-900 border-gray-800"}`}
              >
                <CardHeader>
                  <CardTitle className="text-xl text-white">{pkg.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    <span className={`text-2xl font-bold ${pkg.highlight ? "text-pink-400" : "text-emerald-400"}`}>{pkg.price}</span>
                    <span className="text-sm font-normal">{pkg.period}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className={`h-4 w-4 shrink-0 ${pkg.highlight ? "text-pink-400" : "text-emerald-400"}`} />{f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href="https://yisa-s.com/fiyatlandirma" className="w-full">
                    <Button variant={pkg.highlight ? "default" : "outline"} className={`w-full rounded-xl ${pkg.highlight ? "bg-pink-500 hover:bg-pink-600" : "border-gray-600 text-white hover:bg-gray-800"}`}>Detay</Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-24 border-t border-gray-800 bg-gray-900/30">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Sıkça Sorulan Sorular</h2>
          <p className="text-center text-gray-400 mb-12">Merak ettiklerinizin yanıtları.</p>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-20 text-center border-t border-gray-800">
          <Card className="bg-gradient-to-br from-pink-500/10 to-emerald-500/10 border-pink-500/30 rounded-2xl p-8">
            <p className="text-lg text-white font-medium mb-6">Spor tesislerini teknoloji ve bilimle yönetiyoruz. Çocukların gelişimini veriyle takip ediyoruz.</p>
            <p className="text-gray-400 text-sm mb-6">YİSA-S — Anayasamıza uygun.</p>
            <Button onClick={() => setShowForm(true)} size="lg" className="rounded-xl bg-amber-500 text-black hover:bg-amber-400 px-8 h-12 font-semibold">Franchise / Demo Başvurusu</Button>
          </Card>
        </section>

        <footer className="py-16 border-t border-gray-800 bg-gray-900/50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@yisa-s.com</span>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> İstanbul</span>
              </div>
              <div className="flex gap-8 text-sm">
                <Link href="/dashboard/sablonlar" className="text-gray-400 hover:text-pink-400 transition-colors">Vitrin</Link>
                <a href="https://yisa-s.com/fiyatlandirma" className="text-gray-400 hover:text-pink-400 transition-colors">Fiyatlar</a>
                <Link href="/patron/login" className="text-gray-400 hover:text-pink-400 transition-colors">Giriş</Link>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm mt-10">YİSA-S · Robot yönetimli spor tesisi franchise</p>
          </div>
        </footer>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowForm(false)}>
          <Card className="bg-gray-900 border-gray-700 rounded-2xl p-10 w-full max-w-md shadow-xl shadow-pink-500/10" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-2xl">Demo Talep Formu</CardTitle>
              <CardDescription>10 iş günü içinde dönüş yapılacaktır.</CardDescription>
            </CardHeader>
            <CardContent>
              {formDone ? (
                <p className="text-emerald-400 text-center py-8 font-medium">Başvurunuz alındı. Teşekkürler!</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input placeholder="Ad Soyad" value={formData.ad} onChange={(e) => setFormData({ ...formData, ad: e.target.value })} className="bg-gray-800 border-gray-700 h-12 rounded-xl text-white placeholder:text-gray-500" required />
                  <Input type="email" placeholder="E-posta" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-gray-800 border-gray-700 h-12 rounded-xl text-white placeholder:text-gray-500" required />
                  <Input placeholder="Telefon" value={formData.telefon} onChange={(e) => setFormData({ ...formData, telefon: e.target.value })} className="bg-gray-800 border-gray-700 h-12 rounded-xl text-white placeholder:text-gray-500" />
                  <Input placeholder="Tesis türü (örn. Cimnastik)" value={formData.tesis_turu} onChange={(e) => setFormData({ ...formData, tesis_turu: e.target.value })} className="bg-gray-800 border-gray-700 h-12 rounded-xl text-white placeholder:text-gray-500" />
                  <Input placeholder="Şehir" value={formData.sehir} onChange={(e) => setFormData({ ...formData, sehir: e.target.value })} className="bg-gray-800 border-gray-700 h-12 rounded-xl text-white placeholder:text-gray-500" required />
                  <Button type="submit" disabled={formSending} className="w-full rounded-xl bg-pink-500 text-white hover:bg-pink-600 h-12 font-medium">{formSending ? "Gönderiliyor…" : "Gönder"}</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
