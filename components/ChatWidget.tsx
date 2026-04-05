"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Building2,
  Users,
  Dumbbell,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Settings,
  Square,
} from "lucide-react"
import { useVoice } from "@/lib/context/voice-context"
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition"
import VoiceSettingsPanel from "@/components/VoiceSettingsPanel"
import KaraokeText from "@/components/KaraokeText"

/* ================================================================
   LiSES Robot Chat Widget — Floating sag-alt kose
   Franchise / Veli / Antrenor yonlendirme
   Demo talep takibi
   Ses + Yazi Senkronu (GÖREV #23)
   ================================================================ */

type UserType = "franchise" | "veli" | "antrenor" | null

interface ChatMessage {
  id: string
  role: "user" | "bot"
  text: string
  ts: number
}

const WELCOME_MSG: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Merhaba! Ben LiSES, YiSA-S yapay zeka asistanınız. Size nasıl yardımcı olabilirim?",
  ts: Date.now(),
}

const USER_TYPE_OPTIONS = [
  {
    type: "franchise" as UserType,
    label: "Franchise / Okul Sahibi",
    icon: Building2,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10 hover:bg-cyan-500/20",
  },
  {
    type: "veli" as UserType,
    label: "Veli / Aile",
    icon: Users,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 hover:bg-orange-500/20",
  },
  {
    type: "antrenor" as UserType,
    label: "Antrenör / Eğitmen",
    icon: Dumbbell,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20",
  },
]

const RESPONSES: Record<string, string[]> = {
  franchise: [
    "Franchise başvurusu için bilgilerinizi paylaşır mısınız? Ad, şehir ve iletişim numaranız yeterli.",
    "YiSA-S franchise sistemi ile kendi spor okulunuzu dijitalleştirebilirsiniz. Aylık abonelik modeli ile çalışıyoruz.",
    "Demo talebinizi oluşturduk! Ekibimiz en kısa sürede sizinle iletişime geçecek.",
  ],
  veli: [
    "Çocuğunuzun gelişim takibi, ders programı ve ödeme işlemleri için veli panelimizi kullanabilirsiniz.",
    "Deneme dersi için hangi branşla ilgileniyorsunuz? Cimnastik, basketbol, voleybol, yüzme, futbol veya tenis?",
    "Kaydınızı oluşturduk! Yakında sizinle iletişime geçeceğiz.",
  ],
  antrenor: [
    "Antrenör panelinden yoklama, ölçüm ve sınıf yönetimi yapabilirsiniz.",
    "Haftalık ders programınızı görüntülemek ve sporcu gelişim raporlarını takip etmek için giriş yapabilirsiniz.",
    "Bilgilerinizi aldık, antrenör hesabınız en kısa sürede oluşturulacak.",
  ],
}

interface ChatWidgetProps {
  tenantSlug?: string
  tenantName?: string
  primaryColor?: string
}

export default function ChatWidget({ tenantSlug, tenantName, primaryColor }: ChatWidgetProps = {}) {
  const pathname = usePathname()
  const isPublicMode = !!tenantSlug
  const [isOpen, setIsOpen] = useState(false)
  const [userType, setUserType] = useState<UserType>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG])
  const [input, setInput] = useState("")
  const [responseIdx, setResponseIdx] = useState(0)
  const responseIdxRef = useRef(0)
  const autoReplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ses state
  const voice = useVoice()
  const [showSettings, setShowSettings] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const prevMsgCountRef = useRef(messages.length)
  const speakCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // STT
  const stt = useSpeechRecognition()

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (speakCheckRef.current) clearInterval(speakCheckRef.current)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Otomatik okuma: yeni bot mesajı gelince oku
  useEffect(() => {
    if (!voice.enabled || !voice.autoRead) return
    if (messages.length <= prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length
      return
    }
    prevMsgCountRef.current = messages.length

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === "bot") {
      speakMessage(lastMsg)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, voice.enabled, voice.autoRead])

  // STT transcript -> input alanına yaz
  useEffect(() => {
    if (stt.transcript) {
      setInput((prev) => (prev ? prev + " " + stt.transcript : stt.transcript))
    }
  }, [stt.transcript])

  // Embed sayfalarinda widget gosterme — tum hook'lardan SONRA
  if (pathname?.startsWith("/embed")) {
    return null
  }

  function speakMessage(msg: ChatMessage) {
    // Clear any existing polling interval
    if (speakCheckRef.current) {
      clearInterval(speakCheckRef.current)
      speakCheckRef.current = null
    }

    if (speakingMsgId === msg.id) {
      voice.stop()
      setSpeakingMsgId(null)
      setHighlightIndex(-1)
      return
    }

    const msgId = msg.id
    setSpeakingMsgId(msgId)
    setHighlightIndex(-1)

    voice.speak(msg.text, (charIndex) => {
      setHighlightIndex(charIndex)
    })

    // Ses bitince state temizle — use a small delay to avoid race with cancel/re-speak
    speakCheckRef.current = setInterval(() => {
      if (typeof window !== "undefined" && !window.speechSynthesis.speaking) {
        setSpeakingMsgId((current) => {
          if (current === msgId) {
            setHighlightIndex(-1)
            return null
          }
          return current
        })
        if (speakCheckRef.current) {
          clearInterval(speakCheckRef.current)
          speakCheckRef.current = null
        }
      }
    }, 200)
  }

  function selectUserType(type: UserType) {
    setUserType(type)
    const introMsg: ChatMessage = {
      id: `bot-intro-${Date.now()}`,
      role: "bot",
      text:
        type === "franchise"
          ? "Harika! Franchise/okul sahibi olarak size nasıl yardımcı olabilirim? Yeni franchise başvurusu, mevcut sistem hakkında bilgi veya demo talep edebilirsiniz."
          : type === "veli"
            ? "Hoş geldiniz! Veli olarak deneme dersi kaydı, çocuk gelişim takibi veya ödeme işlemleri hakkında bilgi alabilirsiniz."
            : "Merhaba hocam! Antrenör paneli, yoklama sistemi veya sporcu ölçüm takibi hakkında bilgi alabilirsiniz.",
      ts: Date.now(),
    }
    setMessages((prev) => [...prev, introMsg])
  }

  function handleSend() {
    const text = stt.isListening ? (input + " " + stt.interimTranscript).trim() : input.trim()
    if (!text) return

    if (stt.isListening) {
      stt.stopListening()
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      ts: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    // Public mode: use /api/robot/chat endpoint
    if (isPublicMode && tenantSlug) {
      autoReplyTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/robot/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, slug: tenantSlug }),
          })
          const json = await res.json()
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: json.reply || 'Anlayamadım, tekrar dener misiniz?',
            ts: Date.now(),
          }
          setMessages((prev) => [...prev, botMsg])
        } catch {
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: 'Bağlantı hatası, lütfen tekrar deneyin.',
            ts: Date.now(),
          }
          setMessages((prev) => [...prev, botMsg])
        }
      }, 300)
      return
    }

    // Auto-reply based on userType (authenticated mode)
    autoReplyTimerRef.current = setTimeout(() => {
      const pool = RESPONSES[userType || "franchise"] || RESPONSES.franchise
      const currentIdx = responseIdxRef.current
      const reply = pool[currentIdx % pool.length]
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: reply,
        ts: Date.now(),
      }
      setMessages((prev) => [...prev, botMsg])
      responseIdxRef.current = currentIdx + 1
      setResponseIdx(currentIdx + 1)
    }, 600)
  }

  function handleReset() {
    if (autoReplyTimerRef.current) {
      clearTimeout(autoReplyTimerRef.current)
      autoReplyTimerRef.current = null
    }
    voice.stop()
    setSpeakingMsgId(null)
    setHighlightIndex(-1)
    setUserType(null)
    setMessages([WELCOME_MSG])
    setResponseIdx(0)
    responseIdxRef.current = 0
  }

  function toggleMic() {
    if (stt.isListening) {
      stt.stopListening()
    } else {
      stt.startListening()
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center transition-all hover:scale-110"
          aria-label="Chat aç"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-48px)] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-sm font-semibold text-white">
                  LiSES
                </span>
                <span className="text-xs text-zinc-500 ml-2">
                  YiSA-S AI Asistan
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Ses Toggle */}
              <button
                onClick={() => voice.setEnabled(!voice.enabled)}
                className={`p-1.5 rounded transition-colors ${
                  voice.enabled
                    ? "text-cyan-400 hover:bg-cyan-500/10"
                    : "text-zinc-600 hover:bg-zinc-800"
                }`}
                title={voice.enabled ? "Sesi kapat" : "Sesi aç"}
              >
                {voice.enabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              {/* Ses Ayarları */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                  title="Ses ayarları"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {showSettings && (
                  <VoiceSettingsPanel onClose={() => setShowSettings(false)} />
                )}
              </div>

              {userType && (
                <button
                  onClick={handleReset}
                  className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded"
                >
                  Sıfırla
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-500 hover:text-white rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Type Selection (hidden in public mode — goes straight to chat) */}
          {!userType && !isPublicMode && (
            <div className="p-4 space-y-2 border-b border-zinc-800">
              <p className="text-xs text-zinc-400 mb-2">
                Sizi doğru yönlendirebilmem için kim olduğunuzu seçin:
              </p>
              {USER_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => selectUserType(opt.type)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${opt.bgColor} border border-transparent hover:border-zinc-700 transition-all`}
                >
                  <opt.icon className={`w-5 h-5 ${opt.color}`} />
                  <span className="text-sm text-white font-medium">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[75%]">
                  <div
                    className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-cyan-600 text-white rounded-br-md"
                        : "bg-zinc-800 text-zinc-200 rounded-bl-md"
                    }`}
                  >
                    {speakingMsgId === msg.id ? (
                      <KaraokeText
                        text={msg.text}
                        highlightIndex={highlightIndex}
                        isActive={true}
                      />
                    ) : (
                      msg.text
                    )}
                  </div>
                  {/* Ses ikonu — bot mesajlarında */}
                  {msg.role === "bot" && voice.enabled && (
                    <button
                      onClick={() => speakMessage(msg)}
                      className={`self-start flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all ${
                        speakingMsgId === msg.id
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                      }`}
                      title={speakingMsgId === msg.id ? "Durdur" : "Sesli oku"}
                    >
                      {speakingMsgId === msg.id ? (
                        <>
                          <Square className="w-3 h-3" /> Durdur
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" /> Oku
                        </>
                      )}
                    </button>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* STT interim transcript göstergesi */}
          {stt.isListening && stt.interimTranscript && (
            <div className="px-4 py-1 bg-zinc-900/80 border-t border-zinc-800">
              <p className="text-[11px] text-cyan-400/70 italic truncate">
                {stt.interimTranscript}
              </p>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-t border-zinc-800">
            {/* Mikrofon butonu */}
            {stt.isSupported && (
              <button
                onClick={toggleMic}
                className={`p-2 rounded-lg transition-all ${
                  stt.isListening
                    ? "bg-red-500/20 text-red-400 animate-pulse"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
                title={stt.isListening ? "Kaydı durdur" : "Sesli mesaj"}
                disabled={!userType && !isPublicMode}
              >
                {stt.isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                stt.isListening
                  ? "Dinleniyor..."
                  : (userType || isPublicMode)
                    ? "Mesajınızı yazın..."
                    : "Önce yukarıdan profil seçin..."
              }
              disabled={!userType && !isPublicMode}
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 disabled:opacity-40"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !stt.interimTranscript) || (!userType && !isPublicMode)}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
