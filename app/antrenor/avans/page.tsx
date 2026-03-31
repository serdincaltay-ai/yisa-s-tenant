'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Loader2, Send, DollarSign } from 'lucide-react'

type AvansItem = {
  id: string
  amount: number
  reason: string | null
  status: string
  requested_at: string
  reviewed_at: string | null
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Beklemede', cls: 'bg-amber-500/20 text-amber-400' },
  approved: { label: 'Onaylandı', cls: 'bg-emerald-500/20 text-emerald-400' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-500/20 text-red-400' },
}

export default function AntrenorAvansPage() {
  const [items, setItems] = useState<AvansItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/antrenor/avans')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    fetchItems().finally(() => setLoading(false))
  }, [fetchItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/antrenor/avans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), reason }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessage({ type: 'success', text: 'Avans talebi gönderildi' })
        setAmount('')
        setReason('')
        fetchItems()
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Talep gönderilemedi' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Bağlantı hatası' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <main className="p-4 space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-white flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-cyan-400" />
        Avans Talebi
      </h1>

      {/* Yeni Talep Formu */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Yeni Talep</h2>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Tutar (TL)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="Ör: 500"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Açıklama (isteğe bağlı)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full min-h-[60px] rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors resize-y"
            placeholder="Avans talebi nedeninizi yazın..."
            maxLength={300}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !amount}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-black font-semibold py-3 px-4 transition-colors"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? 'Gönderiliyor...' : 'Talep Gönder'}
        </button>
      </form>

      {/* Mesaj */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
              : 'bg-red-400/10 text-red-400 border border-red-400/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Geçmiş Talepler */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Geçmiş Talepler</h2>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Henüz avans talebi yok.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const st = STATUS_LABELS[item.status] ?? STATUS_LABELS.pending
              return (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-700 p-3">
                  <div>
                    <p className="font-medium text-white">{item.amount.toLocaleString('tr-TR')} TL</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(item.requested_at).toLocaleDateString('tr-TR')}
                      {item.reason ? ` · ${item.reason}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
