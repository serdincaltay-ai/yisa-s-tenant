'use client'

/**
 * Tesis Sayfasi — TV-Buton Tablet Layout
 * Sol: Fixed dikey sidebar 60px (6 bolum)
 * Sag: 100vh content, butona basinca section slide (CSS transition 0.4s)
 * Robot avatar sol ust kosede
 * Mobilde: Alt tab bar (5 sekme)
 * Y-shape: sag dal tasarimi (.y-panel-tenant)
 */

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import RobotAvatar from '@/components/RobotAvatar'
import { DersProgramiGrid } from '@/components/tesis/DersProgramiGrid'
import { PaketFiyatlari } from '@/components/tesis/PaketFiyatlari'
import { AntrenorKartlari } from '@/components/tesis/AntrenorKartlari'
import { FederasyonBilgileri } from '@/components/tesis/FederasyonBilgileri'
import { BolgeAntrenorleri } from '@/components/tesis/BolgeAntrenorleri'
import { getTenantConfig } from '@/lib/tenant-template-config'
import {
  Activity, MapPin, Phone, Mail, ChevronDown, ChevronUp,
  Dumbbell, Waves, Timer, Star, Users, Calendar as CalendarIcon,
  Play, Image as ImageIcon, X, Layers, CreditCard, Award, Shield,
} from 'lucide-react'

/* ── Tesis data ── */
type TesisData = {
  adi: string
  slug: string
  slogan: string
  hakkimizda: string
  konum: string
  telefon: string
  email: string
  sablon: 'standart' | 'orta' | 'premium'
  branslar: { isim: string; icon: string; aciklama: string }[]
  antrenorler?: { isim: string; brans: string; deneyim: string }[]
  yarismaciAntrenorler?: { isim: string; brans: string; lisans_turu?: string; is_competitive_coach?: boolean; foto?: string }[]
  federasyon?: {
    ilTemsilcisi?: { adi: string; bransi: string; telefon: string }
    yarisanKulupler?: { isim: string; sehir?: string }[]
  }
  federasyonBilgileri?: {
    federasyonAdi?: string
    branch?: string
    il?: string
    ilce?: string
    temsilciAdi?: string
    temsilciBransi?: string
    temsilciTelefonu?: string
    yarismaKulupleri?: { kulup_adi: string; adres?: string; telefon?: string }[]
  }
  bolgeAntrenorleri?: { isim: string; brans: string; ilce: string; sehir: string; adres?: string; lisans_turu?: string }[]
  basarilar?: { isim: string; basari: string; alinti: string }[]
  duyurular?: { tarih: string; baslik: string; ozet: string }[]
  sss?: { soru: string; cevap: string }[]
  videoUrl?: string
  yorumlar?: { isim: string; yildiz: number; yorum: string }[]
}

const TESISLER: Record<string, TesisData> = {
  bjktuzlacimnastik: {
    adi: 'BJK Tuzla Cimnastik',
    slug: 'bjktuzlacimnastik',
    slogan: 'Spor ile B\u00fcy\u00fcyen Nesiller',
    hakkimizda: 'BJK Tuzla Cimnastik, \u0130stanbul Tuzla b\u00f6lgesinde \u00e7ocuk ve gen\u00e7ler i\u00e7in profesyonel cimnastik, y\u00fczme ve atletizm e\u011fitimi sunan bir spor tesisidir. Deneyimli antren\u00f6r kadromuz ile her ya\u015f grubuna uygun programlar sunuyoruz. Tesisimiz modern ekipmanlar ve g\u00fcvenli ortam ile sporcular\u0131n geli\u015fimini en \u00fcst d\u00fczeyde desteklemektedir.',
    konum: 'Tuzla, \u0130stanbul',
    telefon: '+90 (216) 000 00 00',
    email: 'info@bjktuzlacimnastik.yisa-s.com',
    sablon: 'premium',
    branslar: [
      { isim: 'Cimnastik', icon: 'dumbbell', aciklama: 'Artistik ve ritmik cimnastik e\u011fitimi' },
      { isim: 'Y\u00fczme', icon: 'waves', aciklama: 'Temel ve ileri seviye y\u00fczme kurslar\u0131' },
      { isim: 'Atletizm', icon: 'timer', aciklama: 'Ko\u015fu, atlama ve atma disiplinleri' },
    ],
    antrenorler: [
      { isim: 'Ali Y\u0131lmaz', brans: 'Cimnastik', deneyim: '12 y\u0131l' },
      { isim: 'Ay\u015fe Demir', brans: 'Y\u00fczme', deneyim: '8 y\u0131l' },
      { isim: 'Mehmet Kaya', brans: 'Atletizm', deneyim: '10 y\u0131l' },
    ],
    yarismaciAntrenorler: [
      { isim: 'Ali Y\u0131lmaz', brans: 'Cimnastik', lisans_turu: '3. Kademe', is_competitive_coach: true },
      { isim: 'Mehmet Kaya', brans: 'Atletizm', lisans_turu: '2. Kademe', is_competitive_coach: true },
    ],
    federasyon: {
      ilTemsilcisi: { adi: 'Ahmet \u00d6z\u00e7elik', bransi: 'Cimnastik', telefon: '+90 (532) 000 00 00' },
      yarisanKulupler: [
        { isim: 'BJK Tuzla Cimnastik', sehir: '\u0130stanbul' },
        { isim: 'Fener Ata\u015fehir SK', sehir: '\u0130stanbul' },
        { isim: 'Kartal Cimnastik SK', sehir: '\u0130stanbul' },
      ],
    },
    bolgeAntrenorleri: [
      { isim: 'Ali Y\u0131lmaz', brans: 'Cimnastik', ilce: 'Tuzla', sehir: '\u0130stanbul', lisans_turu: '3. Kademe', adres: 'BJK Tuzla Tesisleri' },
      { isim: 'Burak \u00c7elik', brans: 'Cimnastik', ilce: 'Ata\u015fehir', sehir: '\u0130stanbul', lisans_turu: '2. Kademe', adres: 'Fener Ata\u015fehir Salonu' },
      { isim: 'Serkan Y\u0131lmaz', brans: 'Artistik Cimnastik', ilce: 'Kartal', sehir: '\u0130stanbul', lisans_turu: '3. Kademe', adres: 'Kartal Spor Salonu' },
    ],
    basarilar: [
      { isim: 'Elif \u00d6zt\u00fcrk', basari: 'T\u00fcrkiye \u015eampiyonu 2025', alinti: 'BJK Tuzla beni \u015fampiyon yapt\u0131!' },
      { isim: 'Can Arslan', basari: 'B\u00f6lge Birincisi 2025', alinti: 'Antren\u00f6rlerim sayesinde ba\u015fard\u0131m.' },
    ],
    duyurular: [
      { tarih: '2026-03-01', baslik: 'Yaz Kamp\u0131 Ba\u015fvurular\u0131 Ba\u015flad\u0131', ozet: '2026 yaz kamp\u0131 i\u00e7in erken kay\u0131t avantajlar\u0131ndan yararlan\u0131n.' },
      { tarih: '2026-02-15', baslik: 'Yeni Y\u00fczme Havuzu A\u00e7\u0131ld\u0131', ozet: 'Olimpik \u00f6l\u00e7\u00fclerde yeni y\u00fczme havuzumuz hizmetinizde.' },
      { tarih: '2026-02-01', baslik: 'Karne Hediyesi', ozet: 'Karne getiren \u00f6\u011frencilerimize \u00f6zel indirim f\u0131rsat\u0131.' },
    ],
    sss: [
      { soru: 'Kay\u0131t i\u00e7in ne gerekiyor?', cevap: 'Kimlik fotokopisi, 2 vesikal\u0131k foto\u011fraf ve sa\u011fl\u0131k raporu ile kay\u0131t olabilirsiniz.' },
      { soru: 'Deneme dersi var m\u0131?', cevap: 'Evet, t\u00fcm bran\u015flar\u0131m\u0131zda 1 \u00fccretsiz deneme dersi hakk\u0131n\u0131z bulunmaktad\u0131r.' },
      { soru: 'Ya\u015f\u0131 ka\u00e7 olan \u00e7ocuklar ba\u015flayabilir?', cevap: '4 ya\u015f\u0131ndan itibaren t\u00fcm bran\u015flar\u0131m\u0131za kay\u0131t yap\u0131labilir.' },
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    yorumlar: [
      { isim: 'Fatma H.', yildiz: 5, yorum: '\u00c7ocu\u011fumun geli\u015fiminden \u00e7ok memnunuz. Antren\u00f6rler harika!' },
      { isim: 'Ahmet K.', yildiz: 5, yorum: 'Profesyonel bir tesis. Temizlik ve g\u00fcvenlik \u00fcst d\u00fczeyde.' },
      { isim: 'Zeynep D.', yildiz: 4, yorum: 'Y\u00fczme kursu m\u00fckemmel. K\u0131z\u0131m 3 ayda \u00f6\u011frenmeyi ba\u015flad\u0131.' },
    ],
  },
  fenerbahceatasehir: {
    adi: 'Fenerbah\u00e7e Ata\u015fehir Spor Okulu',
    slug: 'fenerbahceatasehir',
    slogan: 'Gelece\u011fin \u015eampiyonlar\u0131 Burada Yeti\u015fiyor',
    hakkimizda: 'Fenerbah\u00e7e Ata\u015fehir, \u0130stanbul Ata\u015fehir b\u00f6lgesinde faaliyet g\u00f6steren profesyonel bir spor tesisi olarak hizmet vermektedir. Cimnastik, y\u00fczme ve atletizm dallar\u0131nda uzman e\u011fitmenler e\u015fli\u011finde \u00e7ocuklar\u0131n\u0131z\u0131n sportif geli\u015fimini destekliyoruz.',
    konum: 'Ata\u015fehir, \u0130stanbul',
    telefon: '\u0130leti\u015fim i\u00e7in l\u00fctfen aray\u0131n',
    email: 'info@fenerbahceatasehir.yisa-s.com',
    sablon: 'premium',
    branslar: [
      { isim: 'Cimnastik', icon: 'dumbbell', aciklama: 'Artistik cimnastik e\u011fitimi' },
      { isim: 'Y\u00fczme', icon: 'waves', aciklama: '\u00c7ocuk ve yeti\u015fkin y\u00fczme kurslar\u0131' },
      { isim: 'Atletizm', icon: 'timer', aciklama: 'Genel atletizm ve ko\u015fu e\u011fitimi' },
    ],
    antrenorler: [
      { isim: 'Burak \u00c7elik', brans: 'Cimnastik', deneyim: '9 y\u0131l' },
      { isim: 'Selin Y\u0131ld\u0131z', brans: 'Y\u00fczme', deneyim: '7 y\u0131l' },
    ],
    basarilar: [
      { isim: 'Deniz Ko\u00e7', basari: '\u0130l \u00dc\u00e7\u00fcnc\u00fcs\u00fc 2025', alinti: 'Burada e\u011fitim almak harika!' },
    ],
    duyurular: [
      { tarih: '2026-03-01', baslik: 'Mart Ay\u0131 Program\u0131', ozet: 'Mart ay\u0131 ders program\u0131 g\u00fcncellendi.' },
      { tarih: '2026-02-20', baslik: 'Kay\u0131t \u0130ndirimi', ozet: 'Mart ay\u0131na \u00f6zel %10 erken kay\u0131t indirimi.' },
    ],
    sss: [
      { soru: 'Ders saatleri nedir?', cevap: 'Hafta i\u00e7i 09:00-18:00, hafta sonu 09:00-14:00 aras\u0131 derslerimiz vard\u0131r.' },
      { soru: 'Online \u00f6deme yapabilir miyim?', cevap: 'Evet, veli paneli \u00fczerinden kredi kart\u0131 ile \u00f6deme yapabilirsiniz.' },
    ],
  },
  feneratasehir: {
    adi: 'Fener Atasehir',
    slug: 'feneratasehir',
    slogan: 'Gelece\u011fin \u015eampiyonlar\u0131 Burada Yeti\u015fiyor',
    hakkimizda: 'Fener Ata\u015fehir, \u0130stanbul Ata\u015fehir b\u00f6lgesinde faaliyet g\u00f6steren profesyonel bir spor tesisi olarak hizmet vermektedir. Cimnastik, y\u00fczme ve atletizm dallar\u0131nda uzman e\u011fitmenler e\u015fli\u011finde \u00e7ocuklar\u0131n\u0131z\u0131n sportif geli\u015fimini destekliyoruz.',
    konum: 'Ata\u015fehir, \u0130stanbul',
    telefon: 'İletişim için lütfen arayın',
    email: 'info@feneratasehir.yisa-s.com',
    sablon: 'premium',
    branslar: [
      { isim: 'Cimnastik', icon: 'dumbbell', aciklama: 'Artistik cimnastik e\u011fitimi' },
      { isim: 'Y\u00fczme', icon: 'waves', aciklama: '\u00c7ocuk ve yeti\u015fkin y\u00fczme kurslar\u0131' },
      { isim: 'Atletizm', icon: 'timer', aciklama: 'Genel atletizm ve ko\u015fu e\u011fitimi' },
    ],
    antrenorler: [
      { isim: 'Burak \u00c7elik', brans: 'Cimnastik', deneyim: '9 y\u0131l' },
      { isim: 'Selin Y\u0131ld\u0131z', brans: 'Y\u00fczme', deneyim: '7 y\u0131l' },
    ],
    basarilar: [
      { isim: 'Deniz Ko\u00e7', basari: '\u0130l \u00dc\u00e7\u00fcnc\u00fcs\u00fc 2025', alinti: 'Burada e\u011fitim almak harika!' },
    ],
    duyurular: [
      { tarih: '2026-03-01', baslik: 'Mart Ay\u0131 Program\u0131', ozet: 'Mart ay\u0131 ders program\u0131 g\u00fcncellendi.' },
      { tarih: '2026-02-20', baslik: 'Kay\u0131t \u0130ndirimi', ozet: 'Mart ay\u0131na \u00f6zel %10 erken kay\u0131t indirimi.' },
    ],
    sss: [
      { soru: 'Ders saatleri nedir?', cevap: 'Hafta i\u00e7i 09:00-18:00, hafta sonu 09:00-14:00 aras\u0131 derslerimiz vard\u0131r.' },
      { soru: 'Online \u00f6deme yapabilir miyim?', cevap: 'Evet, veli paneli \u00fczerinden kredi kart\u0131 ile \u00f6deme yapabilirsiniz.' },
    ],
  },
  kartalcimnastik: {
    adi: 'Kartal Cimnastik',
    slug: 'kartalcimnastik',
    slogan: 'Cimnastikte Güç ve Zarafet',
    hakkimizda: 'Kartal Cimnastik Spor Kulübü, İstanbul Kartal bölgesinde artistik ve ritmik cimnastik dallarında profesyonel eğitim vermektedir. Deneyimli antrenör kadromuz ile 4-16 yaş arası çocuklarınızın sportif gelişimini destekliyoruz.',
    konum: 'Kartal, İstanbul',
    telefon: '+90 (530) 000 00 00',
    email: 'info@kartalcimnastik.com',
    sablon: 'standart',
    branslar: [
            { isim: 'Artistik Cimnastik', icon: 'dumbbell', aciklama: 'Artistik cimnastik eğitimi' },
            { isim: 'Ritmik Cimnastik', icon: 'dumbbell', aciklama: 'Ritmik cimnastik eğitimi' },
    ],
    antrenorler: [
            { isim: 'Serkan Yılmaz', brans: 'Artistik Cimnastik', deneyim: '10 yıl' },
            { isim: 'Merve Aydın', brans: 'Ritmik Cimnastik', deneyim: '8 yıl' },
    ],
    duyurular: [
            { tarih: '2026-03-01', baslik: 'Yeni Dönem Kayıtları Başladı', ozet: '2026 bahar dönemi için erken kayıt avantajlarından yararlanın.' },
    ],
    sss: [
            { soru: 'Kayıt için ne gerekiyor?', cevap: 'Kimlik fotokopisi, 2 vesikalık fotoğraf ve sağlık raporu ile kayıt olabilirsiniz.' },
            { soru: 'Deneme dersi var mı?', cevap: 'Evet, 1 ücretsiz deneme dersi hakkınız bulunmaktadır.' },
            { soru: 'Kaç yaşından itibaren başlanabilir?', cevap: '4 yaşından itibaren cimnastik eğitimine başlanabilir.' },
    ],
  },
  demotesis: {
    adi: 'Demo Spor Tesisi',
    slug: 'demotesis',
    slogan: 'Sporda M\u00fckemmelli\u011fi Ke\u015ffedin',
    hakkimizda: 'Demo Spor Tesisi, orta \u015fablon ile olu\u015fturulmu\u015f \u00f6rnek bir tesis sayfas\u0131d\u0131r. Cimnastik, y\u00fczme ve dans bran\u015flar\u0131nda profesyonel e\u011fitim sunuyoruz. 4-14 ya\u015f aras\u0131 \u00e7ocuklar\u0131n\u0131z i\u00e7in g\u00fcvenli, e\u011flenceli ve geli\u015fim odakl\u0131 bir ortam sa\u011fl\u0131yoruz.',
    konum: 'Kad\u0131k\u00f6y, \u0130stanbul',
    telefon: '+90 (555) 123 45 67',
    email: 'info@demotesis.yisa-s.com',
    sablon: 'orta',
    branslar: [
      { isim: 'Cimnastik', icon: 'dumbbell', aciklama: 'Artistik ve ritmik cimnastik e\u011fitimi' },
      { isim: 'Y\u00fczme', icon: 'waves', aciklama: 'Temel ve ileri seviye y\u00fczme kurslar\u0131' },
      { isim: 'Dans', icon: 'timer', aciklama: 'Modern dans ve bale e\u011fitimi' },
    ],
    antrenorler: [
      { isim: 'Zeynep Ayd\u0131n', brans: 'Cimnastik', deneyim: '10 y\u0131l' },
      { isim: 'Emre Y\u0131lmaz', brans: 'Y\u00fczme', deneyim: '8 y\u0131l' },
      { isim: 'Seda Korkmaz', brans: 'Dans', deneyim: '6 y\u0131l' },
    ],
    basarilar: [
      { isim: 'Arda Demir', basari: '\u0130l Birincisi 2025', alinti: 'Demo Akademi sayesinde hedeflerime ula\u015ft\u0131m!' },
      { isim: 'Ela \u00c7elik', basari: 'B\u00f6lge \u0130kincisi 2025', alinti: 'Antren\u00f6rlerim hep yan\u0131mda oldu.' },
    ],
    duyurular: [
      { tarih: '2026-03-05', baslik: 'Bahar D\u00f6nemi Kay\u0131tlar\u0131', ozet: '2026 bahar d\u00f6nemi kay\u0131tlar\u0131 ba\u015flam\u0131\u015ft\u0131r. Erken kay\u0131t avantajlar\u0131ndan yararlan\u0131n.' },
      { tarih: '2026-02-20', baslik: 'Yeni Dans Program\u0131', ozet: 'Modern dans ve bale program\u0131m\u0131z mart ay\u0131nda ba\u015fl\u0131yor.' },
      { tarih: '2026-02-10', baslik: 'Deneme Dersi Kampanyas\u0131', ozet: 'T\u00fcm bran\u015flarda \u00fccretsiz deneme dersi f\u0131rsat\u0131.' },
    ],
    sss: [
      { soru: 'Kay\u0131t i\u00e7in ne gerekiyor?', cevap: 'Kimlik fotokopisi, 2 vesikal\u0131k foto\u011fraf ve sa\u011fl\u0131k raporu ile kay\u0131t olabilirsiniz.' },
      { soru: 'Deneme dersi var m\u0131?', cevap: 'Evet, t\u00fcm bran\u015flar\u0131m\u0131zda 1 \u00fccretsiz deneme dersi hakk\u0131n\u0131z bulunmaktad\u0131r.' },
      { soru: 'Hangi ya\u015f gruplar\u0131 kabul ediliyor?', cevap: '4-14 ya\u015f aras\u0131 t\u00fcm \u00e7ocuklar bran\u015flar\u0131m\u0131za kay\u0131t yapt\u0131rabilir.' },
      { soru: 'Taksit se\u00e7ene\u011fi var m\u0131?', cevap: 'Evet, Geli\u015fim ve \u015eampiyon paketlerinde 2 taksit se\u00e7ene\u011fi mevcuttur.' },
    ],
  },
}

const BRANS_ICONS: Record<string, React.ElementType> = {
  dumbbell: Dumbbell,
  waves: Waves,
  timer: Timer,
}

/* \u2500\u2500 Sidebar nav sections (6 b\u00f6l\u00fcm) \u2500\u2500 */
const NAV_SECTIONS = [
  { id: 'branslar', label: 'Bran\u015flar', icon: Activity },
  { id: 'program', label: 'Program', icon: CalendarIcon },
  { id: 'fiyatlar', label: 'Fiyatlar', icon: CreditCard },
  { id: 'antrenorler', label: 'Ekip', icon: Users },
  { id: 'yarismacilar', label: 'Yar\u0131\u015fma', icon: Award },
  { id: 'federasyon', label: 'Federasyon', icon: Shield },
  { id: 'galeri', label: 'Galeri', icon: ImageIcon },
  { id: 'iletisim', label: '\u0130leti\u015fim', icon: Phone },
] as const

type SectionId = (typeof NAV_SECTIONS)[number]['id']

/* ================================================================
   ANA B\u0130LE\u015eEN
   ================================================================ */
export default function TesisPage() {
  const params = useParams()
  const slug = params?.slug as string | undefined
  const tesis = slug ? TESISLER[slug] : undefined
  const [activeSection, setActiveSection] = useState<SectionId>('branslar')
  const [mobileMore, setMobileMore] = useState(false)

  const handleNav = useCallback((id: SectionId) => {
    setActiveSection(id)
    setMobileMore(false)
  }, [])

  if (!tesis) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Tesis Bulunamad\u0131</h1>
          <p className="text-zinc-400">Arad\u0131\u011f\u0131n\u0131z tesis sayfas\u0131 mevcut de\u011fil.</p>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'branslar': return <SectionBranslar tesis={tesis} />
      case 'program': return <SectionProgram />
      case 'fiyatlar': return <SectionFiyatlar />
      case 'antrenorler': return <SectionAntrenorler tesis={tesis} />
      case 'yarismacilar': return <SectionYarismacilar tesis={tesis} />
      case 'federasyon': return <SectionFederasyon tesis={tesis} />
      case 'galeri': return <SectionGaleri tesis={tesis} />
      case 'iletisim': return <SectionIletisim tesis={tesis} />
      default: return <SectionBranslar tesis={tesis} />
    }
  }

  return (
    <div className="tv-layout y-panel-tenant">
      {/* DESKTOP: Sol sidebar + Sa\u011f content */}
      <div className="hidden md:flex h-screen w-screen overflow-hidden">
        <nav className="tv-sidebar">
          <div className="mb-2 flex-shrink-0">
            <RobotAvatar panelType="tenant" tenantName={tesis.adi} compact />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto py-1">
            {NAV_SECTIONS.map((sec) => {
              const Icon = sec.icon
              const isActive = activeSection === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => handleNav(sec.id)}
                  className={`tv-sidebar-btn ${isActive ? 'tv-sidebar-btn-active' : ''}`}
                  title={sec.label}
                >
                  <Icon className="h-4 w-4 mb-0.5 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                  <span className="text-[9px] leading-tight font-medium truncate w-full text-center">{sec.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <main className="flex-1 h-screen overflow-hidden relative bg-gray-950">
          <div className="absolute top-3 left-4 z-10">
            <RobotAvatar panelType="tenant" tenantName={tesis.adi} />
          </div>
          <div className="absolute top-3 right-4 z-10 flex items-center gap-3">
            <Link href="/veli/giris" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Giriş Yap</Link>
            <Link href="/uye-ol" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-cyan-400 transition-colors">Kayıt Ol</Link>
          </div>
          <div key={activeSection} className="tv-content-slide h-full overflow-y-auto pt-20">
            {renderSection()}
          </div>
        </main>
      </div>

      {/* MOB\u0130L: \u00dcst header + Content + Alt tab bar */}
      <div className="flex md:hidden flex-col h-screen w-screen overflow-hidden">
        <header className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-950/95 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2">
            <RobotAvatar panelType="tenant" tenantName={tesis.adi} compact />
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{tesis.adi}</p>
              <p className="text-zinc-500 text-[10px]">{tesis.slogan}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/veli/giris" className="text-xs font-medium text-zinc-300 hover:text-white transition-colors">Giriş Yap</Link>
            <Link href="/uye-ol" className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-cyan-400 transition-colors">Kayıt Ol</Link>
            {tesis.telefon && tesis.telefon.replace(/\D/g, '').length >= 10 ? (
              <a href={`tel:${tesis.telefon}`} className="text-cyan-400 hover:text-cyan-300">
                <Phone className="h-5 w-5" strokeWidth={1.5} />
              </a>
            ) : tesis.telefon ? (
              <span className="text-cyan-400 text-xs">{tesis.telefon}</span>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative bg-gray-950">
          <div key={activeSection} className="tv-content-slide">
            {renderSection()}
          </div>
        </main>

        <nav className="tv-mobile-tabbar">
          {NAV_SECTIONS.slice(0, 5).map((sec) => {
            const Icon = sec.icon
            const isActive = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => handleNav(sec.id)}
                className={`tv-mobile-tab ${isActive ? 'tv-mobile-tab-active' : ''}`}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[8px] mt-0.5">{sec.label}</span>
              </button>
            )
          })}
          <div className="relative">
            <button
              onClick={() => setMobileMore(!mobileMore)}
              className={`tv-mobile-tab ${NAV_SECTIONS.slice(5).some((s) => s.id === activeSection) ? 'tv-mobile-tab-active' : ''}`}
            >
              <Layers className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-[8px] mt-0.5">Daha</span>
            </button>
            {mobileMore && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 min-w-[140px] z-50">
                {NAV_SECTIONS.slice(5).map((sec) => {
                  const Icon = sec.icon
                  const isActive = activeSection === sec.id
                  return (
                    <button
                      key={sec.id}
                      onClick={() => handleNav(sec.id)}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors ${
                        isActive ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {sec.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}

/* ================================================================
   SECTION: Bran\u015flar (ana giri\u015f sayfas\u0131)
   ================================================================ */
function SectionBranslar({ tesis }: { tesis: TesisData }) {
  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Hero \u2014 glassmorphism */}
      <div className="glass-panel-strong p-8 relative overflow-hidden">
        <div className="hero-bg-overlay rounded-[20px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <Activity className="h-7 w-7 text-zinc-950" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{tesis.adi}</h1>
              <p className="text-zinc-400 text-sm">{tesis.slogan}</p>
            </div>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl mb-4">{tesis.hakkimizda}</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" strokeWidth={1.5} />
              {tesis.konum}
            </div>
            <Link href="/uye-ol" className="rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-6 py-2.5 text-sm font-medium text-zinc-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all inline-flex items-center">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </div>

      {/* Bran\u015f kartlar\u0131 */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Bran\u015flar\u0131m\u0131z</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tesis.branslar.map((b, i) => {
            const Icon = BRANS_ICONS[b.icon] ?? Dumbbell
            const renkler = [
              { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
              { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
              { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
            ]
            const r = renkler[i % renkler.length]
            return (
              <div key={b.isim} className={`brans-card glass-panel border ${r.border}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.bg} ${r.color} mb-3`}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-white mb-1">{b.isim}</h3>
                <p className="text-xs text-zinc-400">{b.aciklama}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Canlı istatistikler (Premium) — feneratasehir placeholder: — */}
      {tesis.sablon === 'premium' && (() => {
        const isPlaceholder = tesis.slug === 'feneratasehir' || tesis.slug === 'fenerbahceatasehir'
        const ogrenci = isPlaceholder ? '—' : '140+'
        const brans = isPlaceholder ? '—' : '3'
        const ders = isPlaceholder ? '—' : '60+'
        return (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Canlı İstatistikler</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-panel p-4 text-center border border-cyan-400/20">
                <Users className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-2xl font-bold text-white">{ogrenci}</p>
                <p className="text-[10px] text-zinc-400">Aktif Öğrenci</p>
              </div>
              <div className="glass-panel p-4 text-center border border-cyan-400/20">
                <Dumbbell className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-2xl font-bold text-white">{brans}</p>
                <p className="text-[10px] text-zinc-400">Aktif Branş</p>
              </div>
              <div className="glass-panel p-4 text-center border border-cyan-400/20">
                <CalendarIcon className="h-6 w-6 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-2xl font-bold text-white">{ders}</p>
                <p className="text-[10px] text-zinc-400">Haftalık Ders</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Ba\u015far\u0131 hikayeleri */}
      {tesis.basarilar && tesis.basarilar.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Ba\u015far\u0131 Hikayeleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tesis.basarilar.map((b) => (
              <div key={b.isim} className="glass-panel p-4 border border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
                    <Star className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{b.isim}</p>
                    <p className="text-[10px] text-cyan-400">{b.basari}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 italic">&ldquo;{b.alinti}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duyurular */}
      {tesis.duyurular && tesis.duyurular.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Duyurular</h2>
          <div className="space-y-3">
            {tesis.duyurular.map((d) => (
              <div key={d.baslik} className="glass-panel p-4 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 mb-1">{d.tarih}</p>
                <h3 className="font-semibold text-white text-sm mb-1">{d.baslik}</h3>
                <p className="text-xs text-zinc-400">{d.ozet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   SECTION: Ders Program\u0131
   ================================================================ */
function SectionProgram() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <h2 className="text-lg font-bold text-white mb-1">Haftal\u0131k Ders Program\u0131</h2>
      <p className="text-zinc-400 text-xs mb-6">PZT-PAZ, 08:00-19:00 aras\u0131 ders saatleri</p>
      <DersProgramiGrid />
    </div>
  )
}

/* ================================================================
   SECTION: Fiyatlar
   ================================================================ */
function SectionFiyatlar() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <h2 className="text-lg font-bold text-white mb-1">Paket Fiyatlar\u0131</h2>
      <p className="text-zinc-400 text-xs mb-6">Size en uygun paketi se\u00e7in</p>
      <PaketFiyatlari />
    </div>
  )
}

/* ================================================================
   SECTION: Antren\u00f6rler + SSS + Veli Yorumlar\u0131
   ================================================================ */
function SectionAntrenorler({ tesis }: { tesis: TesisData }) {
  const [sssAcik, setSssAcik] = useState<number | null>(null)

  return (
    <div className="p-6 md:p-8 space-y-8">
      {tesis.antrenorler && tesis.antrenorler.length > 0 && (
        <AntrenorKartlari
          antrenorler={tesis.antrenorler.map((a) => ({
            isim: a.isim,
            brans: a.brans,
            deneyim: a.deneyim,
          }))}
          federasyonTemsilcisi={getTenantConfig(tesis.slug)?.federationInfo?.ilTemsilcisi}
          yarismaKulupleri={getTenantConfig(tesis.slug)?.federationInfo?.yarismaKulupleri}
        />
      )}

      {tesis.yorumlar && tesis.yorumlar.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Veli Yorumlar\u0131</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tesis.yorumlar.map((y) => (
              <div key={y.isim} className="glass-panel p-4 border border-zinc-800">
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < y.yildiz ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-400 mb-2 italic">&ldquo;{y.yorum}&rdquo;</p>
                <p className="text-[10px] text-zinc-500 font-medium">{y.isim}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tesis.sss && tesis.sss.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">S\u0131k Sorulan Sorular</h2>
          <div className="space-y-2 max-w-2xl">
            {tesis.sss.map((s, i) => (
              <div key={i} className="glass-panel border border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setSssAcik(sssAcik === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-white text-sm">{s.soru}</span>
                  {sssAcik === i ? (
                    <ChevronUp className="h-4 w-4 text-cyan-400 shrink-0" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" strokeWidth={1.5} />
                  )}
                </button>
                {sssAcik === i && (
                  <div className="px-4 pb-4 text-xs text-zinc-400">{s.cevap}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   SECTION: Yarismaci Antrenorler + Bolge Antrenorleri
   ================================================================ */
function SectionYarismacilar({ tesis }: { tesis: TesisData }) {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <AntrenorKartlari baslik="Yarışmacı Antrenörler" antrenorler={(tesis.yarismaciAntrenorler ?? []).map((a) => ({
        isim: a.isim,
        brans: a.brans,
        lisans: a.lisans_turu,
        yarismaciDeneyimi: a.is_competitive_coach,
      }))} />
      <BolgeAntrenorleri antrenorler={tesis.bolgeAntrenorleri ?? []} sehir={tesis.konum} />
    </div>
  )
}

/* ================================================================
   SECTION: Federasyon Bilgileri
   ================================================================ */
function SectionFederasyon({ tesis }: { tesis: TesisData }) {
  const fb = tesis.federasyonBilgileri
  return (
    <div className="p-6 md:p-8 space-y-8">
      <FederasyonBilgileri
        federasyonAdi={fb?.federasyonAdi}
        branch={fb?.branch}
        il={fb?.il}
        ilce={fb?.ilce}
        temsilciAdi={fb?.temsilciAdi}
        temsilciBransi={fb?.temsilciBransi}
        temsilciTelefonu={fb?.temsilciTelefonu}
        yarismaKulupleri={fb?.yarismaKulupleri}
        ilTemsilcisi={tesis.federasyon?.ilTemsilcisi}
        yarisanKulupler={tesis.federasyon?.yarisanKulupler}
      />
    </div>
  )
}

/* ================================================================
   SECTION: Galeri + Video
   ================================================================ */
function SectionGaleri({ tesis }: { tesis: TesisData }) {
  return (
    <div className="p-6 md:p-8 space-y-8">
      {tesis.sablon === 'premium' && tesis.videoUrl && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Tan\u0131t\u0131m Videosu</h2>
          <div className="glass-panel-strong aspect-video flex items-center justify-center border border-zinc-800">
            <div className="text-center">
              <Play className="h-12 w-12 text-cyan-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-zinc-400 text-sm">Video yak\u0131nda eklenecek</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white mb-4">Galeri</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel aspect-video flex items-center justify-center border border-zinc-800">
              <span className="text-zinc-600 text-xs">G\u00f6rsel {i}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   SECTION: \u0130leti\u015fim
   ================================================================ */
function SectionIletisim({ tesis }: { tesis: TesisData }) {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <h2 className="text-lg font-bold text-white mb-4">\u0130leti\u015fim</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="glass-panel p-4 flex items-center gap-4 border border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 shrink-0">
              <MapPin className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">Adres</p>
              <p className="text-white text-sm">{tesis.konum}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4 border border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 shrink-0">
              <Phone className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">Telefon</p>
              <p className="text-white text-sm">{tesis.telefon}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4 border border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 shrink-0">
              <Mail className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">E-posta</p>
              <p className="text-white text-sm">{tesis.email}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel-strong flex items-center justify-center min-h-[240px] border border-zinc-800">
          <div className="text-center p-6">
            <MapPin className="h-10 w-10 text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-zinc-500 text-xs">Harita yak\u0131nda eklenecek</p>
          </div>
        </div>
      </div>

      {tesis.sablon === 'premium' && <RandevuFormu tesis={tesis} />}
    </div>
  )
}

/* \u2500\u2500 Randevu Formu (Premium) \u2500\u2500 */
function RandevuFormu({ tesis }: { tesis: TesisData }) {
  const [modalAcik, setModalAcik] = useState(false)

  return (
    <>
      <button
        onClick={() => setModalAcik(true)}
        className="w-full md:w-auto rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-8 py-3 text-sm font-medium text-zinc-950 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all"
      >
        Randevu Al
      </button>

      {modalAcik && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-base font-bold text-white">Randevu Al</h2>
              <button onClick={() => setModalAcik(false)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-1">Bran\u015f</label>
                <select className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none">
                  {tesis.branslar.map((b) => (
                    <option key={b.isim}>{b.isim}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-1">Tercih Edilen G\u00fcn</label>
                <select className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none">
                  {['Pazartesi', 'Sal\u0131', '\u00c7ar\u015famba', 'Per\u015fembe', 'Cuma', 'Cumartesi'].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-1">Veli Ad\u0131</label>
                <input
                  type="text"
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Ad\u0131n\u0131z Soyad\u0131n\u0131z"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-zinc-400 block mb-1">Telefon</label>
                <input
                  type="tel"
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 block mb-1">\u00c7ocuk Ad\u0131</label>
                  <input
                    type="text"
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="\u00c7ocuk ad\u0131"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 block mb-1">\u00c7ocuk Ya\u015f\u0131</label>
                  <input
                    type="number"
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="Ya\u015f"
                  />
                </div>
              </div>
              <button className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2.5 text-sm font-medium text-zinc-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all mt-2">
                Randevu Talebi G\u00f6nder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
