'use client'

import { useEffect, useState } from 'react'
import { Check, X, Clock, AlertCircle, RefreshCw, Loader2, Trash2, Ban, GitBranch, FileText, Bot, Rocket, Eye } from 'lucide-react'
import { ContentPreview } from '@/app/components/ContentPreview'

type ApprovalItem = {
  id: string
  ticket_no?: string
  type: string
  title: string
  description?: string
  status: string
  priority?: string
  created_at: string
  source?: string
  has_github_commit?: boolean
  /** Komutu gönderen (Patron e-posta) */
  sent_by_email?: string
  /** Asistan özeti: ne yapıldı, onaylarsanız ne olur */
  assistant_summary?: string
  director_key?: string
  director_name?: string
  /** Önizleme: video, görsel, dosya, metin */
  displayText?: string
  output_payload?: Record<string, unknown>
}

type DemoRequest = {
  id: string
  name: string
  email: string
  phone?: string | null
  facility_type?: string | null
  city?: string | null
  notes?: string | null
  status: string
  source?: string | null
  created_at: string
  payment_status?: string | null
  payment_amount?: number | null
  payment_at?: string | null
  payment_notes?: string | null
}

export default function OnayKuyruguPage() {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [table, setTable] = useState<string | null>(null)
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [demoLoading, setDemoLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'commands' | 'demo'>('commands')
  const [directorFilter, setDirectorFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [migrateLoading, setMigrateLoading] = useState(false)
  const [orphanCount, setOrphanCount] = useState(0)
  const [unprocessedCount, setUnprocessedCount] = useState(0)
  const [previewItemId, setPreviewItemId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/approvals')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Veri yüklenemedi.')
        setItems([])
        setTable(null)
        return
      }
      setItems(Array.isArray(data?.items) ? data.items : [])
      setTable(data?.table ?? null)
      setOrphanCount(typeof data?.orphan_count === 'number' ? data.orphan_count : 0)
      setUnprocessedCount(typeof data?.unprocessed_count === 'number' ? data.unprocessed_count : 0)
    } catch {
      setError('Veri yüklenemedi.')
      setItems([])
      setTable(null)
    } finally {
      setLoading(false)
    }
  }

  const handleMigrate = async () => {
    if (!confirm('Veritabanı migration çalıştırılacak. Devam?')) return
    setMigrateLoading(true)
    try {
      const res = await fetch('/api/db/migrate', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        alert('✅ ' + (data.message ?? 'Migration tamamlandı.'))
      } else {
        alert('❌ ' + (data.error ?? 'Migration başarısız.'))
      }
    } catch {
      alert('❌ İstek gönderilemedi.')
    } finally {
      setMigrateLoading(false)
    }
  }

  const handleApproveAllPending = async () => {
    const toApprove = items.filter((i) => i.status === 'pending')
    if (toApprove.length === 0) return
    if (!confirm(`${toApprove.length} bekleyen işi tek tuşla onaylayıp push/deploy yapacaksınız. Devam?`)) return
    setActingId('approve_all')
    let done = 0
    for (const item of toApprove) {
      try {
        const res = await fetch('/api/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command_id: item.id, decision: 'approve' }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && !data.error) done++
      } catch { /* skip */ }
    }
    setActingId(null)
    setError(null)
    await fetchData()
    alert(`Tebrikler! ✅ ${done} iş onaylandı. Push/deploy otomatik tetiklendi.`)
  }

  const handleDecision = async (commandId: string, decision: 'approve' | 'reject' | 'cancel' | 'push') => {
    setActingId(commandId + '_' + decision)
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command_id: commandId, decision }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'İşlem başarısız.')
        return
      }
      if (data.message) {
        alert(data.message)
      }
      setError(null)
      await fetchData()
    } catch {
      setError('İstek gönderilemedi.')
    } finally {
      setActingId(null)
    }
  }

  const handleCancelAll = async () => {
    const cancellable = items.filter((i) => ['pending', 'approved', 'modified'].includes(i.status))
    if (cancellable.length === 0) return
    if (!confirm(`${cancellable.length} işin tamamını iptal etmek istediğinize emin misiniz?`)) return
    setActingId('cancel_all')
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_all: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Tümünü iptal başarısız.')
        return
      }
      if (data.message) {
        alert(data.message)
      }
      setError(null)
      await fetchData()
    } catch {
      setError('İstek gönderilemedi.')
    } finally {
      setActingId(null)
    }
  }

  const fetchDemoRequests = async () => {
    setDemoLoading(true)
    try {
      const res = await fetch('/api/demo-requests')
      const data = await res.json().catch(() => ({}))
      setDemoRequests(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setDemoRequests([])
    } finally {
      setDemoLoading(false)
    }
  }

  const handleDemoDecision = async (id: string, decision: 'approve' | 'reject') => {
    setActingId('demo_' + id + '_' + decision)
    try {
      const res = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decide', id, decision }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'İşlem başarısız.')
        return
      }
      setError(null)
      if (data.temp_password && data.login_email) {
        alert(`✅ Onaylandı. Firma sahibi giriş bilgileri:\n\nE-posta: ${data.login_email}\nGeçici şifre: ${data.temp_password}\n\nBu bilgiyi kopyalayıp franchise sahibine iletin. İlk girişte şifreyi değiştirmesini söyleyin.`)
      } else if (data.message) {
        alert(data.message)
      }
      await fetchDemoRequests()
    } catch {
      setError('İstek gönderilemedi.')
    } finally {
      setActingId(null)
    }
  }

  const handleRecordPayment = async (id: string, amount?: number) => {
    setActingId('demo_pay_' + id)
    try {
      const res = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'record_payment', id, amount: amount ?? undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Ödeme kaydedilemedi.')
        return
      }
      setError(null)
      await fetchDemoRequests()
    } catch {
      setError('İstek gönderilemedi.')
    } finally {
      setActingId(null)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchDemoRequests()
  }, [])

  const newDemoRequests = demoRequests.filter((d) => d.status === 'new')

  const pending = items.filter((i) => i.status === 'pending')
  const approved = items.filter((i) => i.status === 'approved')
  const rejected = items.filter((i) => ['rejected', 'cancelled'].includes(i.status))
  const cancellable = items.filter((i) => ['pending', 'approved', 'modified'].includes(i.status))

  const directorKeys = [...new Set(items.map((i) => i.director_key).filter(Boolean))] as string[]
  const filteredItems = directorFilter
    ? items.filter((i) => (i.director_key ?? '') === directorFilter)
    : items

  const DIRECTOR_LABELS: Record<string, string> = {
    CFO: 'Finans',
    CTO: 'Teknoloji',
    CIO: 'Bilgi',
    CMO: 'Pazarlama',
    CHRO: 'İK',
    CLO: 'Hukuk',
    CSO_SATIS: 'Satış',
    CPO: 'Ürün',
    CDO: 'Veri',
    CISO: 'Güvenlik',
    CCO: 'Müşteri',
    CSO_STRATEJI: 'Strateji',
    CSPO: 'Spor',
    COO: 'Operasyon',
    RND: 'AR-GE',
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">10&apos;a Çıkart</h1>
          <p className="text-slate-400">
            CEO Havuzu — Sistemden gelen işler: video, dosya, tasarım. Onayla / Reddet / İptal / Push · Demo talepleri
            {table && <span className="ml-2 text-xs text-slate-500">(Kaynak: {table})</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pending.length > 0 && (
            <button
              type="button"
              onClick={handleApproveAllPending}
              disabled={loading || actingId !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 text-sm font-medium transition-colors disabled:opacity-50"
              title="Tüm bekleyen işleri onayla — Push + Deploy otomatik"
            >
              {actingId === 'approve_all' ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
              Tümünü Onayla ({pending.length})
            </button>
          )}
          {cancellable.length > 0 && (
            <button
              type="button"
              onClick={handleCancelAll}
              disabled={loading || actingId !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 text-sm font-medium transition-colors disabled:opacity-50"
              title="Bekleyen ve onaylanmış tüm işleri iptal et"
            >
              {actingId === 'cancel_all' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Tümünü İptal Et ({cancellable.length})
            </button>
          )}
          <button
            type="button"
            onClick={handleMigrate}
            disabled={migrateLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/40 text-sm transition-colors disabled:opacity-50"
            title="Veritabanı migration — athlete_health_records vb."
          >
            {migrateLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            Migrate
          </button>
          <button
            type="button"
            onClick={() => { fetchData(); fetchDemoRequests(); }}
            disabled={loading || demoLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading || demoLoading ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('commands')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'commands' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Patron Komutları ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('demo')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'demo' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Demo Talepleri ({newDemoRequests.length} yeni)
        </button>
      </div>

      {orphanCount > 0 && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm flex items-center gap-2">
          <AlertCircle size={20} />
          <span>
            <strong>{orphanCount}</strong> komut 24 saatten uzun süredir açıkta (onay/red bekliyor). 
            {unprocessedCount > 0 && ` Toplam işlenmemiş: ${unprocessedCount}.`} Lütfen onaylayın veya iptal edin.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {activeTab === 'demo' ? (
        <>
          {demoLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">Yükleniyor…</div>
          ) : demoRequests.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
              <FileText className="mx-auto mb-4 text-slate-500" size={48} />
              <p className="text-slate-400 mb-2">Henüz demo talebi yok.</p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-6 py-4 text-slate-400 font-medium text-sm">Ad</th>
                      <th className="px-6 py-4 text-slate-400 font-medium text-sm">E-posta</th>
                      <th className="px-6 py-4 text-slate-400 font-medium text-sm">Tesis / Şehir</th>
                      <th className="px-6 py-4 text-slate-400 font-medium text-sm">Kaynak</th>
                      <th className="px-6 py-4 text-slate-400 font-medium text-sm">Tarih</th>
                      <th className="px-6 py-4 text-slate-400 font-medium text-sm">Durum</th>
                      <th className="px-6 py-4 text-slate-400 font-medium text-sm">Ödeme</th>
                      <th className="px-6 py-4 text-slate-400 font-medium text-sm">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoRequests.map((dr) => (
                      <tr key={dr.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="px-6 py-4 text-white">{dr.name}</td>
                        <td className="px-6 py-4">
                          <a href={`mailto:${dr.email}`} className="text-cyan-400 hover:underline">{dr.email}</a>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {[dr.facility_type, dr.city].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{dr.source ?? '—'}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {dr.created_at ? new Date(dr.created_at).toLocaleDateString('tr-TR') : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-lg ${
                            dr.status === 'new' ? 'bg-amber-500/20 text-amber-400'
                            : dr.status === 'converted' ? 'bg-emerald-500/20 text-emerald-400'
                            : dr.status === 'rejected' ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {dr.status === 'new' ? 'Yeni' : dr.status === 'converted' ? 'Onaylandı' : dr.status === 'rejected' ? 'Reddedildi' : dr.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {dr.payment_status === 'odendi' ? (
                            <span className="text-emerald-400 text-sm">
                              Ödendi
                              {dr.payment_amount != null && ` · ${Number(dr.payment_amount).toLocaleString('tr-TR')}`}
                              {dr.payment_at && ` · ${new Date(dr.payment_at).toLocaleDateString('tr-TR')}`}
                            </span>
                          ) : dr.status === 'converted' ? (
                            <button
                              type="button"
                              onClick={() => handleRecordPayment(dr.id)}
                              disabled={!!actingId}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium disabled:opacity-50"
                            >
                              {actingId === 'demo_pay_' + dr.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Ödeme alındı
                            </button>
                          ) : (
                            <span className="text-slate-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {dr.status === 'new' ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleDemoDecision(dr.id, 'approve')}
                                disabled={!!actingId}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium disabled:opacity-50"
                              >
                                {actingId === 'demo_' + dr.id + '_approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                Onayla
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDemoDecision(dr.id, 'reject')}
                                disabled={!!actingId}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
                              >
                                {actingId === 'demo_' + dr.id + '_reject' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                Reddet
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          Yükleniyor…
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-slate-400 mb-2">Henüz onay kaydı yok.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-slate-400" />
              <span className="text-slate-400 text-sm">Direktör:</span>
              <select
                value={directorFilter}
                onChange={(e) => setDirectorFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Tümü</option>
                {directorKeys.sort().map((k) => (
                  <option key={k} value={k}>{k} — {DIRECTOR_LABELS[k] ?? k}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-400 text-sm">Bekleyen</p>
              <p className="text-2xl font-bold text-white">{pending.length}</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-emerald-400 text-sm">Onaylanan</p>
              <p className="text-2xl font-bold text-white">{approved.length}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-sm">Reddedilen / İptal</p>
              <p className="text-2xl font-bold text-white">{rejected.length}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-4 text-slate-400 font-medium text-sm">Ticket</th>
                    <th className="px-6 py-4 text-slate-400 font-medium text-sm">Gönderen</th>
                    <th className="px-6 py-4 text-slate-400 font-medium text-sm">Tip / Direktör</th>
                    <th className="px-6 py-4 text-slate-400 font-medium text-sm">Başlık</th>
                    <th className="px-6 py-4 text-slate-400 font-medium text-sm">Öncelik</th>
                    <th className="px-6 py-4 text-slate-400 font-medium text-sm">Durum</th>
                    <th className="px-6 py-4 text-slate-400 font-medium text-sm">Tarih</th>
                    <th className="px-6 py-4 text-slate-400 font-medium text-sm">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-6 py-4 text-cyan-400 font-mono text-sm">
                        {item.ticket_no ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm" title={item.sent_by_email ?? 'Patron'}>
                        {item.sent_by_email ? (item.sent_by_email.length > 18 ? item.sent_by_email.slice(0, 18) + '…' : item.sent_by_email) : 'Patron'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{item.type}</span>
                        {(item.director_key || item.director_name) && (
                          <span className="block text-xs text-cyan-400 font-medium">
                            {item.director_key} {DIRECTOR_LABELS[item.director_key ?? ''] ? `— ${DIRECTOR_LABELS[item.director_key ?? '']}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{item.title.length > 80 ? item.title.slice(0, 80) + '…' : item.title}</span>
                        {item.assistant_summary && (
                          <p className="mt-1 text-xs text-slate-500 max-w-md" title={item.assistant_summary}>
                            {item.assistant_summary.length > 60 ? item.assistant_summary.slice(0, 60) + '…' : item.assistant_summary}
                          </p>
                        )}
                        {item.has_github_commit && (
                          <span className="ml-2 text-xs text-purple-400" title="GitHub commit hazır">
                            <GitBranch size={12} className="inline" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          item.priority === 'high' ? 'bg-rose-500/20 text-rose-400'
                          : item.priority === 'low' ? 'bg-slate-500/20 text-slate-400'
                          : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {item.priority ?? 'normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'pending' && (
                          <span className="flex items-center gap-1 text-amber-400 text-sm">
                            <Clock size={14} /> Bekliyor
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="flex items-center gap-1 text-emerald-400 text-sm">
                            <Check size={14} /> Onaylandı
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <X size={14} /> Reddedildi
                          </span>
                        )}
                        {item.status === 'cancelled' && (
                          <span className="flex items-center gap-1 text-slate-400 text-sm">
                            <Ban size={14} /> İptal Edildi
                          </span>
                        )}
                        {item.status === 'modified' && (
                          <span className="flex items-center gap-1 text-blue-400 text-sm">
                            <RefreshCw size={14} /> Düzenlendi
                          </span>
                        )}
                        {!['pending', 'approved', 'rejected', 'cancelled', 'modified'].includes(item.status) && (
                          <span className="text-slate-400 text-sm">{item.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {(item.output_payload || item.displayText) && (
                          <button
                            type="button"
                            onClick={() => setPreviewItemId(previewItemId === item.id ? null : item.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium transition-colors mr-2"
                            title="Video, dosya, görsel önizleme"
                          >
                            <Eye size={14} />
                            Görüntüle
                          </button>
                        )}
                        {item.status === 'pending' ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecision(item.id, 'approve')}
                              disabled={actingId !== null}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                              title={item.has_github_commit ? 'Onayla → Push + Deploy otomatik' : 'Onayla'}
                            >
                              {actingId === item.id + '_approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              {item.has_github_commit ? 'Onayla (Push+Deploy)' : 'Onayla'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(item.id, 'cancel')}
                              disabled={actingId !== null}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {actingId === item.id + '_cancel' ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                              İptal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(item.id, 'reject')}
                              disabled={actingId !== null}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {actingId === item.id + '_reject' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                              Reddet
                            </button>
                          </div>
                        ) : item.status === 'approved' ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecision(item.id, 'cancel')}
                              disabled={actingId !== null}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {actingId === item.id + '_cancel' ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                              İptal
                            </button>
                            {item.has_github_commit && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('GitHub\'a push yapmak istediğinize emin misiniz?')) {
                                    handleDecision(item.id, 'push')
                                  }
                                }}
                                disabled={actingId !== null}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                {actingId === item.id + '_push' ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
                                Push Et
                              </button>
                            )}
                          </div>
                        ) : item.status === 'modified' ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecision(item.id, 'approve')}
                              disabled={actingId !== null}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                              title={item.has_github_commit ? 'Onayla → Push + Deploy otomatik' : 'Onayla'}
                            >
                              {actingId === item.id + '_approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              {item.has_github_commit ? 'Onayla (Push+Deploy)' : 'Onayla'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(item.id, 'cancel')}
                              disabled={actingId !== null}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {actingId === item.id + '_cancel' ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                              İptal
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Önizleme modal — video, dosya, görsel */}
          {previewItemId && (() => {
            const item = items.find((i) => i.id === previewItemId)
            if (!item) return null
            const payload = (item.output_payload ?? {}) as Record<string, unknown>
            const content = { ...payload }
            if (item.displayText) (content as Record<string, unknown>).content = item.displayText
            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                onClick={() => setPreviewItemId(null)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <button
                      type="button"
                      onClick={() => setPreviewItemId(null)}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <ContentPreview icerik={content} />
                  {item.displayText && !payload.video_url && !payload.image_url && !payload.gorsel_url && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 whitespace-pre-wrap text-sm">
                      {item.displayText}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
