'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Shield,
  Users,
  TrendingUp,
  ChevronRight,
  Star,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface BilgilendirmeSunumuProps {
  tenantName: string
  il?: string
  onGeri?: () => void
}

/** Antrenör seviyeleri (Cimnastik federasyonu referans) */
const ANTRENOR_SEVIYELERI = [
  {
    seviye: '1. Kademe',
    aciklama: 'Temel seviye antrenör — yeni başlayan gruplar',
    renk: 'text-green-400',
  },
  {
    seviye: '2. Kademe',
    aciklama: 'Orta seviye — yarışma hazırlık grupları',
    renk: 'text-blue-400',
  },
  {
    seviye: '3. Kademe',
    aciklama: 'Üst seviye — milli takım aday kadrosu',
    renk: 'text-purple-400',
  },
  {
    seviye: '4. Kademe',
    aciklama: 'En üst kademe — uluslararası düzey',
    renk: 'text-cyan-400',
  },
]

const NEDEN_BIZ = [
  {
    baslik: 'Yapay Zeka Destekli Takip',
    aciklama: 'Her çocuğun gelişimini bilimsel verilerle izliyoruz.',
    icon: TrendingUp,
  },
  {
    baslik: 'Federasyon Onaylı',
    aciklama: 'Tüm antrenörlerimiz federasyon belgeli, sigortamız geçerli.',
    icon: Shield,
  },
  {
    baslik: 'Kişiye Özel Program',
    aciklama: 'Yaş, seviye ve hedeflere göre bireysel antrenman planı.',
    icon: Star,
  },
  {
    baslik: 'Uzman Kadro',
    aciklama: 'Deneyimli antrenörler ve pedagojik danışman desteği.',
    icon: Users,
  },
]

/**
 * BilgilendirmeSunumu — Franchise sayfasında veliye sunulan bilgilendirme.
 * Federasyon temsilcisi, kulüp listesi, antrenör seviyeleri, neden biz bölümleri.
 */
export default function BilgilendirmeSunumu({
  tenantName,
  il = 'İstanbul',
  onGeri,
}: BilgilendirmeSunumuProps) {
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Geri butonu */}
      {onGeri && (
        <Button
          variant="ghost"
          onClick={onGeri}
          className="text-zinc-400 hover:text-white -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Geri
        </Button>
      )}

      {/* Başlık */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          {tenantName} Hakkında
        </h2>
        <p className="text-zinc-400 mt-2">Veliler için bilgilendirme sunumu</p>
      </motion.div>

      {/* Federasyon temsilcisi */}
      <motion.section
        {...fadeUp}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <Award className="w-6 h-6 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">
            Federasyon Temsilcisi — {il}
          </h3>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">
          {il} ili Cimnastik Federasyonu il temsilciliği bünyesinde faaliyet
          gösteren kayıtlı spor kulübüyüz. Tüm faaliyetlerimiz federasyon
          denetiminde yürütülmektedir.
        </p>
      </motion.section>

      {/* Kayıtlı spor kulüpleri */}
      <motion.section
        {...fadeUp}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Kayıtlı Spor Kulüpleri
          </h3>
        </div>
        <ul className="space-y-2">
          {[
            'Artistik Cimnastik Kulübü',
            'Ritmik Cimnastik Kulübü',
            'Trampolin Cimnastik Kulübü',
            'Genel Jimnastik & Temel Hareket Eğitimi',
          ].map((kulup, i) => (
            <li key={i} className="flex items-center gap-2 text-zinc-300 text-sm">
              <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
              {kulup}
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Antrenör seviyeleri */}
      <motion.section
        {...fadeUp}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Antrenör Seviyeleri</h3>
        </div>
        <div className="space-y-3">
          {ANTRENOR_SEVIYELERI.map((a) => (
            <div key={a.seviye} className="flex items-start gap-3">
              <span className={`font-semibold text-sm whitespace-nowrap ${a.renk}`}>
                {a.seviye}
              </span>
              <span className="text-zinc-400 text-sm">{a.aciklama}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Neden bizimle çalışmalısınız */}
      <motion.section
        {...fadeUp}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-white text-center">
          Neden Bizimle Çalışmalısınız?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NEDEN_BIZ.map((item) => (
            <div
              key={item.baslik}
              className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="w-5 h-5 text-cyan-400" />
                <span className="text-white text-sm font-semibold">{item.baslik}</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">{item.aciklama}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
