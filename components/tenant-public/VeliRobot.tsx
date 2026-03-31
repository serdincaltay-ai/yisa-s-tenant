'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, UserPlus, CalendarDays } from 'lucide-react'

export interface VeliRobotProps {
  tenantName: string
  onBilgilendirme?: () => void
  onKayit?: () => void
  onDersProgrami?: () => void
}

/**
 * VeliRobot — Franchise sayfasında veli karşılama robotu.
 * Neon animasyonlu robot yüzü, konuşma balonu ve 3 yönlendirme butonu.
 */
export default function VeliRobot({
  tenantName,
  onBilgilendirme,
  onKayit,
  onDersProgrami,
}: VeliRobotProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 w-full max-w-lg mx-auto">
      {/* Robot Avatar — neon çerçeve */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        {/* Neon glow halka */}
        <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 opacity-60 blur-xl animate-pulse" />

        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-zinc-900 border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center">
          {/* Anten */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-ping" />
            <div className="w-0.5 h-4 bg-cyan-400/60" />
          </div>

          {/* Yüz */}
          <div className="flex flex-col items-center gap-3">
            {/* Gözler */}
            <div className="flex gap-5">
              <div className="relative w-5 h-5 md:w-6 md:h-6 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]">
                <motion.div
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                  className="absolute inset-0 rounded-full bg-cyan-400"
                />
                <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/80" />
              </div>
              <div className="relative w-5 h-5 md:w-6 md:h-6 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]">
                <motion.div
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                  className="absolute inset-0 rounded-full bg-cyan-400"
                />
                <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/80" />
              </div>
            </div>
            {/* Ağız */}
            <div className="w-8 h-3 md:w-10 md:h-4 rounded-b-full border-2 border-cyan-400 border-t-0 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
          </div>
        </div>
      </motion.div>

      {/* Konuşma balonu */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="relative bg-zinc-800/90 border border-cyan-500/30 rounded-2xl px-6 py-4 text-center shadow-[0_0_20px_rgba(34,211,238,0.15)]"
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-800/90 border-l border-t border-cyan-500/30 rotate-45" />
        <p className="text-white text-base md:text-lg font-medium leading-relaxed">
          Merhaba, hoş geldiniz!
          <br />
          <span className="text-cyan-400 font-semibold">
            Burası {tenantName}
          </span>
        </p>
      </motion.div>

      {/* Yönlendirme butonları */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex flex-col gap-3 w-full"
      >
        <button
          onClick={onBilgilendirme}
          className="flex items-center gap-3 w-full rounded-xl bg-zinc-800/80 border border-purple-500/30 px-5 py-4 text-left transition hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] active:scale-[0.98]"
        >
          <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <span className="text-white text-sm md:text-base font-medium">
            Bilgilendirme sunumu ister misiniz?
          </span>
        </button>

        <button
          onClick={onKayit}
          className="flex items-center gap-3 w-full rounded-xl bg-zinc-800/80 border border-cyan-500/30 px-5 py-4 text-left transition hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-[0.98]"
        >
          <UserPlus className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <span className="text-white text-sm md:text-base font-medium">
            Kayıt olmak istiyorum
          </span>
        </button>

        <button
          onClick={onDersProgrami}
          className="flex items-center gap-3 w-full rounded-xl bg-zinc-800/80 border border-pink-500/30 px-5 py-4 text-left transition hover:border-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.25)] active:scale-[0.98]"
        >
          <CalendarDays className="w-5 h-5 text-pink-400 flex-shrink-0" />
          <span className="text-white text-sm md:text-base font-medium">
            Ders programını görmek istiyorum
          </span>
        </button>
      </motion.div>
    </div>
  )
}
