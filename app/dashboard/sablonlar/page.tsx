'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LayoutTemplate,
  RefreshCw,
  AlertCircle,
  Store,
  Lightbulb,
  Maximize2,
  Minimize2,
  Sparkles,
  Monitor,
} from 'lucide-react'
import { ContentPreview, hasMediaContent } from '@/app/components/ContentPreview'

const KATEGORILER = [
  'Tümü',
  'CFO',
  'CLO',
  'CHRO',
  'CMO',
  'CTO',
  'CSO',
  'CSPO',
  'COO',
  'CMDO',
  'CCO',
  'CDO',
  'CISO',
  'RND',
] as const

type SablonItem = {
  id: string
  ad: string
  kategori: string
  icerik: Record<string, unknown>
  durum: string
  olusturan: string
  created_at?: string
}

type TemplateUsage = {
  id: string
  tenant_id: string
  tenant_name: string
  template_id: string
  template_source: string
  used_at: string
  notes?: string
}

type RDSuggestion = {
  id: string
  title: string
  description?: string
  source: string
  status: string
  created_at: string
}

function isEmptyIcerik(icerik: Record<string, unknown>): boolean {
  if (!icerik || typeof icerik !== 'object') return true
  const keys = Object.keys(icerik)
  return keys.length === 0 || (keys.length === 1 && keys[0] === 'aciklama' && !icerik.aciklama)
}

function extractHtml(icerik: Record<string, unknown>): string | null {
  if (icerik?.html && typeof icerik.html === 'string') return icerik.html
  if (icerik?.ui && typeof icerik.ui === 'string') return icerik.ui
  if (icerik?.content && typeof icerik.content === 'string' && icerik.content.trim().startsWith('<')) return icerik.content as string
  return null
}

function buildV0Prompt(s: SablonItem): string {
  const acik = typeof s.icerik?.aciklama === 'string' ? s.icerik.aciklama : ''
  const alanlar = Array.isArray(s.icerik?.alanlar) ? (s.icerik.alanlar as string[]).join(', ') : ''
  return `YİSA-S spor tesisi için "${s.ad}" şablonu. ${acik} ${alanlar ? `Alanlar: ${alanlar}.` : ''} Modern, renkli, responsive React/Next.js UI bileşeni. Türkçe.`
}

export default function SablonlarPage() {
  const [sablonlar, setSablonlar] = useState<SablonItem[]>([])
  const [toplam, setToplam] = useState(0)
  const [kategoriFilter, setKategoriFilter] = useState<string>('Tümü')
  const [usages, setUsages] = useState<TemplateUsage[]>([])
  const [suggestions, setSuggestions] = useState<RDSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSablon, setSelectedSablon] = useState<SablonItem | null>(null)
  const [previewExpanded, setPreviewExpanded] = useState(true)
  const [v0Output, setV0Output] = useState<string | null>(null)
  const [v0Loading, setV0Loading] = useState(false)
  const [previewMode, setPreviewMode] = useState<'raw' | 'media' | 'html' | 'v0'>('raw')

  const fetchData = useCallback(async (kategori?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = kategori && kategori !== 'Tümü'
        ? `/api/templates?kategori=${encodeURIComponent(kategori)}`
        : '/api/templates'
      const [tRes, uRes] = await Promise.all([
        fetch(url),
        fetch('/api/templates/usage'),
      ])
      const tData = await tRes.json()
      const uData = await uRes.json()
      setSablonlar(Array.isArray(tData?.sablonlar) ? tData.sablonlar : [])
      setToplam(typeof tData?.toplam === 'number' ? tData.toplam : (tData?.sablonlar?.length ?? 0))
      setSuggestions(Array.isArray(tData?.suggestions) ? tData.suggestions : [])
      setUsages(Array.isArray(uData?.items) ? uData.items : [])
    } catch {
      setError('Veri yüklenemedi.')
      setSablonlar([])
      setToplam(0)
      setUsages([])
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(kategoriFilter === 'Tümü' ? undefined : kategoriFilter)
  }, [kategoriFilter, fetchData])

  const handleSelectSablon = (s: SablonItem | null) => {
    setSelectedSablon(s)
    setV0Output(null)
    const html = s ? extractHtml(s.icerik) : null
    const media = s ? hasMediaContent(s.icerik) : false
    setPreviewMode(media ? 'media' : html ? 'html' : 'raw')
  }

  const handleV0Cikart = async () => {
    if (!selectedSablon) return
    setV0Loading(true)
    setV0Output(null)
    try {
      const prompt = buildV0Prompt(selectedSablon)
      const res = await fetch('/api/v0/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data?.ok && data?.text) {
        setV0Output(data.text)
        setPreviewMode('v0')
      } else {
        setV0Output(`Hata: ${data?.error || 'Bilinmeyen'}`)
      }
    } catch (e) {
      setV0Output(`Hata: ${e instanceof Error ? e.message : 'Bağlantı hatası'}`)
    } finally {
      setV0Loading(false)
    }
  }

  const bosIcerikSayisi = sablonlar.filter((s) => isEmptyIcerik(s.icerik)).length
  const hasHtml = selectedSablon ? !!extractHtml(selectedSablon.icerik) : false
  const hasMedia = selectedSablon ? hasMediaContent(selectedSablon.icerik) : false

  return (
    <div className="p-6 min-h-screen bg-gray-950 text-white">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Şablonlar</h1>
          <p className="text-gray-400">Şablona tıklayın — sağdaki büyük ekranda içeriği görün, v0 ile görselleştirin.</p>
          <div className="mt-3 p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-xs text-gray-300 space-y-1">
            <p><strong className="text-pink-400">Geniş Ekran:</strong> Şablon seçince burada görünür. v0 Çıkart ile tasarım üretilir.</p>
            <p><strong className="text-amber-400">Format:</strong> JSON (icerik). Resim, video, ses, dosya, Word, MD — Medya sekmesinde önizlenir.</p>
            <p><strong className="text-emerald-400">Komut:</strong> Siz komut verirsiniz → Asistanlar işler → Onay + deploy.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => fetchData(kategoriFilter === 'Tümü' ? undefined : kategoriFilter)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {bosIcerikSayisi > 0 && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{bosIcerikSayisi} şablonun içeriği boş.</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-gray-400 text-sm">Kategori:</span>
        {KATEGORILER.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKategoriFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              kategoriFilter === k
                ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mb-4 text-gray-400 text-sm">
        Toplam: <strong className="text-pink-400">{toplam}</strong> şablon
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          Yükleniyor…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Şablon listesi */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <LayoutTemplate size={20} className="text-pink-400" /> Şablon Havuzu
            </h2>
            {sablonlar.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                <AlertCircle className="mx-auto mb-2 text-gray-500" size={32} />
                <p className="text-gray-500 text-sm">Bu kategoride şablon yok.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {sablonlar.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSablon(s)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      selectedSablon?.id === s.id
                        ? 'border-pink-500 bg-pink-500/20 ring-2 ring-pink-500/40'
                        : isEmptyIcerik(s.icerik)
                          ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/10 border-gray-700'
                          : 'border-gray-700 bg-gray-900 hover:border-pink-500/40 hover:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium text-white truncate">{s.ad}</div>
                    <div className="text-gray-400 text-sm mt-1">{s.kategori}</div>
                    {isEmptyIcerik(s.icerik) && (
                      <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={12} /> İçerik boş
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: Geniş Ekran önizleme */}
          <div className="lg:col-span-2">
            <div
              className={`rounded-2xl border-2 overflow-hidden transition-all ${
                previewExpanded
                  ? 'border-pink-500/40 bg-gray-900 min-h-[500px]'
                  : 'border-gray-700 bg-gray-900 min-h-[200px]'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-pink-500/10 to-amber-500/10">
                <div className="flex items-center gap-3">
                  <Monitor size={24} className="text-pink-400" />
                  <h3 className="text-lg font-semibold text-white">
                    {selectedSablon ? selectedSablon.ad : 'Geniş Ekran — Şablon seçin'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPreviewExpanded(!previewExpanded)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
                    title={previewExpanded ? 'Küçült' : 'Genişlet'}
                  >
                    {previewExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
                {selectedSablon && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('raw')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        previewMode === 'raw' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Ham
                    </button>
                    {hasMedia && (
                      <button
                        type="button"
                        onClick={() => setPreviewMode('media')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          previewMode === 'media' ? 'bg-cyan-500/30 text-cyan-300' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        Medya
                      </button>
                    )}
                    {hasHtml && (
                      <button
                        type="button"
                        onClick={() => setPreviewMode('html')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          previewMode === 'html' ? 'bg-blue-500/30 text-blue-300' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        Görüntü
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleV0Cikart}
                      disabled={v0Loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-sm font-medium disabled:opacity-50"
                    >
                      <Sparkles size={16} className={v0Loading ? 'animate-pulse' : ''} />
                      {v0Loading ? 'Üretiliyor…' : 'v0 Çıkart'}
                    </button>
                    {v0Output && (
                      <button
                        type="button"
                        onClick={() => setPreviewMode('v0')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          previewMode === 'v0' ? 'bg-amber-500/30 text-amber-300' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        v0 Sonuç
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className={`overflow-auto ${previewExpanded ? 'min-h-[400px]' : 'min-h-[120px]'} p-6`}>
                {!selectedSablon ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <LayoutTemplate size={48} className="mb-4 opacity-50" />
                    <p>Soldan bir şablon seçin — burada önizleme görünecek</p>
                    <p className="text-sm mt-2">v0 Çıkart ile tasarım üretebilirsiniz</p>
                  </div>
                ) : previewMode === 'v0' && v0Output ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <p className="text-xs text-amber-400 font-medium mb-2">v0 Üretimi</p>
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                        {v0Output}
                      </pre>
                    </div>
                    {v0Output.includes('export default') || v0Output.includes('function ') ? (
                      <div className="rounded-xl border border-gray-700 bg-white/5 p-4 text-gray-400 text-xs">
                        <p>React/JSX kodu. Kopyalayıp projeye ekleyebilirsiniz.</p>
                      </div>
                    ) : null}
                  </div>
                ) : previewMode === 'media' && hasMedia ? (
                  <ContentPreview icerik={selectedSablon.icerik} />
                ) : previewMode === 'html' && hasHtml ? (
                  <div className="rounded-xl border border-blue-500/30 bg-white overflow-auto">
                    <iframe
                      srcDoc={extractHtml(selectedSablon.icerik) || ''}
                      title="Şablon önizleme"
                      className="w-full min-h-[300px] border-0"
                      sandbox="allow-scripts"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hasMedia && (
                      <ContentPreview icerik={selectedSablon.icerik} />
                    )}
                    {typeof selectedSablon.icerik?.aciklama === 'string' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <p className="text-xs text-emerald-400 font-medium mb-1">Açıklama</p>
                        <p className="text-gray-300 text-sm">{selectedSablon.icerik.aciklama}</p>
                      </div>
                    )}
                    {selectedSablon.icerik?.tip != null && (
                      <p className="text-gray-400 text-sm">
                        <span className="text-gray-500">Tip:</span>{' '}
                        <span className="text-cyan-400">{String(selectedSablon.icerik.tip)}</span>
                      </p>
                    )}
                    {Array.isArray(selectedSablon.icerik?.alanlar) && (
                      <p className="text-gray-400 text-sm">
                        <span className="text-gray-500">Alanlar:</span>{' '}
                        <span className="text-pink-300">{(selectedSablon.icerik.alanlar as string[]).join(', ')}</span>
                      </p>
                    )}
                    <pre className="bg-gray-950 border border-gray-700 rounded-xl p-4 text-xs text-gray-400 overflow-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedSablon.icerik, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Şablon Kullanımı */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Store size={20} className="text-blue-400" /> Şablon Kullanımı
        </h2>
        {usages.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">Henüz kayıtlı şablon kullanımı yok.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">Tenant</th>
                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">Şablon ID</th>
                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">Kaynak</th>
                    <th className="px-6 py-4 text-gray-400 font-medium text-sm">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {usages.map((u) => (
                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-pink-500/5">
                      <td className="px-6 py-4 text-white font-medium">{u.tenant_name}</td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">{String(u.template_id).slice(0, 8)}…</td>
                      <td className="px-6 py-4 text-gray-400">{u.template_source}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {u.used_at ? new Date(u.used_at).toLocaleString('tr-TR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" /> Ar-Ge / CEO Güncellemeleri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium">{s.title}</h3>
                  <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400">{s.status}</span>
                </div>
                {s.description && <p className="text-gray-400 text-sm mb-2">{s.description}</p>}
                <p className="text-gray-500 text-xs">{s.source} · {s.created_at ? new Date(s.created_at).toLocaleDateString('tr-TR') : '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
