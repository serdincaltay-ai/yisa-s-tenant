'use client'

import { useEffect, useState } from 'react'
import { Wallet, Send, Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type AvansTalebi = {
  id: string
  amount: number
  reason: string
  status: string
  created_at: string
}

export default function AvansTalebiPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [talepler, setTalepler] = useState<AvansTalebi[]>([])
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/antrenor/avans-talebi')
      .then((r) => r.json())
      .then((d) => setTalepler(d.items ?? []))
      .catch(() => setTalepler([]))
      .finally(() => setLoading(false))
  }, [])

  const handleGonder = async () => {
    const tutar = Number(amount)
    if (!tutar || tutar <= 0) {
      alert('Geçerli bir tutar giriniz.')
      return
    }
    if (!reason.trim()) {
      alert('Sebep zorunludur.')
      return
    }
    setSubmitting(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/antrenor/avans-talebi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: tutar, reason }),
      })
      const j = await res.json()
      if (j.ok) {
        setSuccess(true)
        setAmount('')
        setReason('')
        if (j.talebi) setTalepler((prev) => [j.talebi, ...prev])
      } else {
        alert(j.error ?? 'Gönderim başarısız')
      }
    } catch {
      alert('Gönderim başarısız')
    } finally {
      setSubmitting(false)
    }
  }

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
    if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-400" strokeWidth={1.5} />
    return <Clock className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
  }

  const statusLabel = (status: string) => {
    if (status === 'approved') return 'Onaylandı'
    if (status === 'rejected') return 'Reddedildi'
    return 'Beklemede'
  }

  const statusColor = (status: string) => {
    if (status === 'approved') return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30'
    if (status === 'rejected') return 'text-red-400 bg-red-400/10 border-red-500/30'
    return 'text-amber-400 bg-amber-400/10 border-amber-500/30'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <main className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
          Avans Talebi
        </h1>
        <p className="text-sm text-zinc-400">Tutar ve sebebinizi girin, talebi gönderin.</p>
      </div>

      {/* Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">Yeni Avans Talebi</h3>
        <div>
          <label className="text-xs font-medium text-zinc-400">Tutar (TL)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
            placeholder="1000"
            min="1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400">Sebep</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
            rows={3}
            placeholder="Avans talebinizin sebebini yazın..."
          />
        </div>
        <button
          onClick={handleGonder}
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 text-sm font-medium text-zinc-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" strokeWidth={1.5} />
          {submitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
        </button>
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
            Avans talebiniz başarıyla gönderildi.
          </div>
        )}
      </div>

      {/* Geçmiş Talepler */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Geçmiş Talepler</h3>
        {talepler.length === 0 ? (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs text-zinc-500">Henüz avans talebi yok.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {talepler.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-zinc-700 p-3">
                <div>
                  <p className="text-sm font-medium text-white">{t.amount.toLocaleString('tr-TR')} TL</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.reason}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${statusColor(t.status)}`}>
                  {statusIcon(t.status)}
                  {statusLabel(t.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
