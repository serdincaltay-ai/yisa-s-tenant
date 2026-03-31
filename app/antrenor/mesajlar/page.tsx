'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { AntrenorBottomNav } from '@/components/PanelBottomNav'
import { ArrowLeft, MessageSquare, Send, Loader2, CheckCheck } from 'lucide-react'
import { useRealtimeMessages } from '@/lib/realtime/use-messages'
import { createClient } from '@/lib/supabase/client'

type Partner = {
  id: string
  name: string
  athletes: string[]
  last_message: string | null
  last_message_at: string | null
  last_message_from_me: boolean
  unread_count: number
}

export default function AntrenorMesajlarPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get current user and fetch partners (tenant_id comes from API response)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetch('/api/antrenor/messages')
      .then((r) => r.json())
      .then((d) => {
        setPartners(Array.isArray(d?.partners) ? d.partners : [])
        if (d?.tenant_id) setTenantId(d.tenant_id)
      })
      .catch(() => setPartners([]))
      .finally(() => setLoading(false))
  }, [])

  // Realtime messages hook
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    markAsRead,
  } = useRealtimeMessages({
    userId,
    partnerId: selectedPartner?.id ?? null,
    tenantId,
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read when conversation opens
  useEffect(() => {
    if (selectedPartner) {
      markAsRead()
    }
  }, [selectedPartner, markAsRead])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const result = await sendMessage(input.trim())
      if (result) {
        setInput('')
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <main className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/antrenor" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <h1 className="text-xl font-bold text-white">Mesajlaşma</h1>
          <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Canlı bağlantı" />
        </div>

        <p className="text-sm text-zinc-400">Veli ile iletişim — sporcuların velileriyle canlı mesajlaşın.</p>

        {loading && !selectedPartner ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : selectedPartner ? (
          <>
            <button
              onClick={() => setSelectedPartner(null)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              &larr; Konuşma listesi
            </button>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 mb-2">
              <p className="text-sm font-medium text-white">{selectedPartner.name}</p>
              <p className="text-xs text-zinc-500">
                Sporcu: {selectedPartner.athletes.join(', ')}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col" style={{ minHeight: '350px', maxHeight: '60vh' }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">Henüz mesaj yok. İlk mesajı siz gönderin!</p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_id === userId
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMine
                              ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-400/20'
                              : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                          }`}
                        >
                          {m.content}
                          <div className="flex items-center gap-1 mt-1">
                            <p className="text-[10px] opacity-60">
                              {new Date(m.created_at).toLocaleString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </p>
                            {isMine && m.is_read && (
                              <CheckCheck className="h-3 w-3 text-cyan-400 opacity-80" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-zinc-800 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Mesajınız..."
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white text-sm placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2.5 text-zinc-950 disabled:opacity-50 transition-opacity"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <MessageSquare className="h-8 w-8 text-cyan-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-semibold text-white mb-1">Veli ile iletişim</h3>
            <p className="text-sm text-zinc-400 mb-4">Sporcuların velileriyle canlı mesajlaşın.</p>
            {partners.length === 0 ? (
              <p className="text-sm text-zinc-500">Henüz konuşma yok. Size sporcu atandığında velileri burada görünecek.</p>
            ) : (
              <div className="space-y-2">
                {partners.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPartner(p)}
                    className="w-full text-left rounded-xl border border-zinc-700 p-3 hover:border-cyan-400/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{p.name}</p>
                        <p className="text-xs text-zinc-500 truncate">
                          Sporcu: {p.athletes.join(', ')}
                        </p>
                        {p.last_message && (
                          <p className="text-xs text-zinc-400 mt-1 truncate">
                            {p.last_message_from_me ? 'Siz: ' : ''}
                            {p.last_message}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3">
                        {p.last_message_at && (
                          <p className="text-[10px] text-zinc-500">
                            {new Date(p.last_message_at).toLocaleDateString('tr-TR')}
                          </p>
                        )}
                        {p.unread_count > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-400 text-zinc-950 text-[10px] font-bold px-1.5">
                            {p.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <AntrenorBottomNav />
    </div>
  )
}
