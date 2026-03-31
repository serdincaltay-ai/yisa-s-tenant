'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Bot, Send, Loader2, Sparkles, ClipboardCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ASISTANLAR = [
  { id: 'claude', name: 'Claude', color: 'from-amber-500 to-orange-600', uzmanlik: 'Strateji, analiz, kod, hukuk, finans' },
  { id: 'gpt', name: 'ChatGPT', color: 'from-emerald-500 to-green-600', uzmanlik: 'Yaratıcı fikir, içerik, metin' },
  { id: 'gemini', name: 'Gemini', color: 'from-blue-500 to-cyan-600', uzmanlik: 'Çok modlu, görsel anlama, medya' },
  { id: 'v0', name: 'v0', color: 'from-rose-500 to-pink-600', uzmanlik: 'Web sayfası, UI tasarımı' },
  { id: 'cursor', name: 'Cursor', color: 'from-violet-500 to-purple-600', uzmanlik: 'Kod, yazılım, deploy' },
  { id: 'together', name: 'Together', color: 'from-slate-500 to-slate-600', uzmanlik: 'Hızlı toplu işlem, veri analizi' },
] as const

type AsistanId = (typeof ASISTANLAR)[number]['id']

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ai?: string
}

export default function CELFPage() {
  const [activeAsistan, setActiveAsistan] = useState<AsistanId | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingToCeo, setSendingToCeo] = useState(false)
  const [ceoSent, setCeoSent] = useState<{ ticket_no?: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeAsistan) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Sistem komutu: "subdomain ekle: madamfavori" → doğrudan API çağır
      const subdomainMatch = userMsg.content.match(/(?:subdomain\s+ekle|yeni\s+franchise\s+subdomain)\s*:?\s*([a-z0-9-]+)/i)
      if (subdomainMatch) {
        const slug = subdomainMatch[1].toLowerCase().replace(/[^a-z0-9-]/g, '')
        const res = await fetch('/api/celf/add-subdomain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subdomain: slug }),
        })
        const data = await res.json()
        const text = res.ok && data.ok
          ? `${data.message}\n\n${data.vercel_added ? '✅ ' : ''}${data.vercel_note ?? ''}`
          : (data.error ?? 'Eklenemedi.')
        setMessages((prev) => [...prev, { role: 'assistant', content: text, ai: 'sistem' }])
        setLoading(false)
        return
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          assignedAI: activeAsistan.toUpperCase(),
          user_id: userId,
        }),
      })
      const data = await res.json()
      const text = res.ok ? (data.text ?? 'Yanıt alınamadı.') : (data.error ?? 'Hata oluştu.')
      setMessages((prev) => [...prev, { role: 'assistant', content: text, ai: activeAsistan }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Bağlantı hatası.', ai: activeAsistan }])
    } finally {
      setLoading(false)
    }
  }

  const handleSendToCeo = async () => {
    if (messages.length === 0 || !activeAsistan) return
    setSendingToCeo(true)
    setCeoSent(null)
    try {
      const res = await fetch('/api/celf/send-to-ceo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          assignedAI: activeAsistan.toUpperCase(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setCeoSent({ ticket_no: data.ticket_no })
      } else {
        setCeoSent({ ticket_no: undefined })
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'CEO\'ya gönderim başarısız: ' + (data.error ?? 'Bilinmeyen hata'),
          ai: 'sistem',
        }])
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'CEO\'ya gönderim sırasında bağlantı hatası.',
        ai: 'sistem',
      }])
    } finally {
      setSendingToCeo(false)
    }
  }

  const asistan = ASISTANLAR.find((a) => a.id === activeAsistan)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot className="w-8 h-8 text-cyan-400" />
          CELF — Asistan
        </h1>
        <p className="text-slate-400 mt-1">
          Bir asistan seçin, sohbet edin. Sistem komutu: &quot;subdomain ekle: madamfavori&quot; — 10&apos;a Çıkart&apos;a göndermeden doğrudan eklenir.
        </p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Asistan listesi */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
            {ASISTANLAR.map((a) => {
              const isActive = activeAsistan === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveAsistan(isActive ? null : a.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 border-2 border-cyan-400/60 ring-2 ring-cyan-400/30'
                      : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center flex-shrink-0`}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{a.name}</p>
                    <p className="text-xs text-slate-400 truncate">{a.uzmanlik}</p>
                  </div>
                  {isActive && (
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Aktif" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sohbet alanı */}
        <div className="flex-1 min-w-0 bg-slate-800/50 border border-slate-700 rounded-2xl flex flex-col overflow-hidden">
          {activeAsistan ? (
            <>
              <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${asistan?.color ?? ''} flex items-center justify-center`}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-white">{asistan?.name} ile sohbet</span>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
                {messages.length === 0 && (
                  <p className="text-slate-500 text-center py-8">
                    Merhaba. Ne yapmak istiyorsunuz? &quot;Bunu CEO&apos;ya gönder&quot; diyerek komutu havuza iletebilirsiniz.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        m.role === 'user'
                          ? 'bg-cyan-500/20 text-cyan-100'
                          : 'bg-slate-700/80 text-slate-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      {m.ai && m.role === 'assistant' && (
                        <p className="text-xs text-slate-500 mt-1">{m.ai}</p>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700/80 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-slate-400">Yanıt hazırlanıyor...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
              <div className="p-4 border-t border-slate-700 space-y-2">
                {messages.length > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleSendToCeo}
                      disabled={sendingToCeo || loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-200 text-sm font-medium disabled:opacity-50"
                    >
                      {sendingToCeo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ClipboardCheck className="w-4 h-4" />
                      )}
                      {sendingToCeo ? 'Gönderiliyor...' : "10'a Çıkart'a Gönder"}
                    </button>
                    {ceoSent?.ticket_no && (
                      <Link
                        href="/dashboard/onay-kuyrugu"
                        className="text-sm text-emerald-400 hover:underline"
                      >
                        #{ceoSent.ticket_no} → Onay kuyruğu
                      </Link>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center gap-2"
                >
                  <Send size={18} />
                  Gönder
                </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 p-8">
              <p>Sohbet başlatmak için soldan bir asistan seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
