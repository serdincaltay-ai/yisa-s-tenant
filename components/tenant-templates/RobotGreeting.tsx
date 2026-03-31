"use client"

import React, { useState } from "react"
import { Bot, X, Send, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface RobotGreetingProps {
  tesisAd: string
  whatsapp: string
}

export default function RobotGreeting({ tesisAd, whatsapp }: RobotGreetingProps) {
  const [open, setOpen] = useState(false)
  const [mesaj, setMesaj] = useState("")

  const hizliMesajlar = [
    "Deneme dersi hakkında bilgi almak istiyorum",
    "Paket fiyatları nedir?",
    "Ders programını görmek istiyorum",
    "Kayıt nasıl yapılır?",
  ]

  const handleGonder = (text: string) => {
    const encoded = encodeURIComponent(text || mesaj)
    window.open(`https://wa.me/${whatsapp}?text=${encoded}`, "_blank")
    setMesaj("")
  }

  return (
    <>
      {/* Floating Robot Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/30 hover:scale-110 transition-all group"
        title="YiSA-S Robot Danışman"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Bot className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
            </span>
          </>
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[104px] right-6 z-50 w-80 rounded-2xl border border-white/10 bg-[#0a1020] shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">YiSA-S Robot Danışman</p>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400">Çevrimiçi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {/* Robot mesajı */}
              <div className="flex gap-2 mb-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-300 leading-relaxed">
                  Merhaba! 👋 {tesisAd} robot danışmanıyım. Size nasıl yardımcı olabilirim?
                </div>
              </div>

              {/* Hızlı mesajlar */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Hızlı Sorular</p>
                {hizliMesajlar.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => handleGonder(msg)}
                    className="block w-full text-left rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-xs text-gray-300 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-300 transition-all"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mesaj}
                  onChange={(e) => setMesaj(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mesaj.trim()) handleGonder(mesaj)
                  }}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none transition"
                />
                <button
                  onClick={() => mesaj.trim() && handleGonder(mesaj)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:opacity-90 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
