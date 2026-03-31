"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { Send, Bot, X } from "lucide-react"

/**
 * Embed Widget Page — /embed/:slug
 * Disaridan iframe ile embed edilebilir
 * Tenant'a ozel demo talep formu + mini chat
 */

interface ChatMessage {
  id: string
  role: "user" | "bot"
  text: string
  ts: number
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Merhaba! YiSA-S spor yönetim sistemine hoş geldiniz. Size nasıl yardımcı olabilirim?",
  ts: Date.now(),
}

export default function EmbedWidgetPage() {
  const params = useParams()
  const slug = (params?.slug as string) || "demo"

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  })
  const [formSent, setFormSent] = useState(false)

  function handleSend() {
    if (!input.trim()) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: input.trim(),
      ts: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    // Bot auto-reply
    setTimeout(() => {
      const botReply: ChatMessage = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: "Teşekkürler! Deneme dersi için bilgilerinizi bırakmanızı öneriyorum. Form açılsın mı?",
        ts: Date.now(),
      }
      setMessages((prev) => [...prev, botReply])
      setShowForm(true)
    }, 800)
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "embed_widget",
          tenant_slug: slug,
        }),
      })
    } catch {
      // silently fail — still show success
    }
    setFormSent(true)
    setShowForm(false)
    const thankMsg: ChatMessage = {
      id: `b-thx-${Date.now()}`,
      role: "bot",
      text: `Teşekkürler ${formData.name}! En kısa sürede sizinle iletişime geçeceğiz.`,
      ts: Date.now(),
    }
    setMessages((prev) => [...prev, thankMsg])
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white font-[Inter]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <Bot className="w-5 h-5 text-cyan-400" />
        <span className="text-sm font-semibold text-cyan-400">
          YiSA-S — {slug}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.role === "user"
                  ? "bg-cyan-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Demo Form */}
      {showForm && !formSent && (
        <div className="mx-4 mb-3 p-4 bg-zinc-900 border border-zinc-700 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-cyan-400">
              Deneme Dersi Formu
            </span>
            <button
              onClick={() => setShowForm(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-2">
            <input
              type="text"
              placeholder="Adınız"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="tel"
              placeholder="Telefon"
              value={formData.phone}
              onChange={(e) =>
                setFormData((p) => ({ ...p, phone: e.target.value }))
              }
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="email"
              placeholder="E-posta"
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Gönder
            </button>
          </form>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-t border-zinc-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Mesajınızı yazın..."
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
