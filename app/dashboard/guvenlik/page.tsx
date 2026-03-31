'use client'

import { useEffect, useState } from 'react'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Loader2,
  Activity,
  Eye,
  Ban,
  Zap,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SecurityLog {
  id: string
  event_type: string
  severity: string
  description: string | null
  blocked: boolean
  created_at: string
}

interface DuvarDurumu {
  duvar: string
  aciklama: string
  aktif: boolean
  kural_sayisi: number
  renk: string
}

interface Istatistikler {
  toplam: number
  engellenen: number
  izin_verilen: number
  seviye_dagilimi: {
    sari: number
    turuncu: number
    kirmizi: number
    acil: number
  }
  olay_turleri: { tur: string; sayi: number }[]
}

interface DashboardData {
  logs: SecurityLog[]
  istatistikler: Istatistikler
  duvarlar: DuvarDurumu[]
  toplam_kural: number
}

// ─── Severity Badge ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, { bg: string; text: string; icon: typeof Shield }> = {
    sari: { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400', icon: Eye },
    turuncu: { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-400', icon: AlertTriangle },
    kirmizi: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', icon: ShieldAlert },
    acil: { bg: 'bg-red-600/30 border-red-600/40', text: 'text-red-300', icon: Ban },
  }
  const s = styles[severity] ?? styles.sari
  const Icon = s.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
      <Icon size={12} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function GuvenlikDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [testSonuc, setTestSonuc] = useState<string | null>(null)
  const [testYukleniyor, setTestYukleniyor] = useState(false)

  useEffect(() => {
    fetch('/api/guvenlik/durum?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setData(d as DashboardData)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const testKomut = async () => {
    setTestYukleniyor(true)
    setTestSonuc(null)
    try {
      const res = await fetch('/api/guvenlik/uc-duvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'sporcu listesi göster', action: 'read' }),
      })
      const result = await res.json()
      setTestSonuc(
        result.sonuc === 'gecti'
          ? 'Kontrol geçti — tüm duvarlar OK'
          : result.sonuc === 'uyari'
            ? `Uyarı: ${(result.uyarilar as string[]).join(', ')}`
            : `Engellendi: ${result.engel_sebebi as string}`
      )
    } catch {
      setTestSonuc('Test hatası')
    } finally {
      setTestYukleniyor(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-400">
        <Loader2 size={18} className="animate-spin" /> Güvenlik verileri yükleniyor...
      </div>
    )
  }

  const ist = data?.istatistikler
  const duvarlar = data?.duvarlar ?? []
  const logs = data?.logs ?? []

  return (
    <div className="p-8 space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield size={24} className="text-cyan-400" />
          Güvenlik Dashboard
        </h1>
        <p className="text-slate-400 mt-1">3 Duvar sistemi, güvenlik logları ve alarm istatistikleri</p>
      </div>

      {/* 3 Duvar Kartları */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock size={18} /> 3 Duvar Sistemi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {duvarlar.map((d, i) => (
            <div
              key={i}
              className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: d.renk }}
              />
              <div className="flex items-center gap-2 mb-2">
                {d.aktif ? (
                  <ShieldCheck size={18} className="text-emerald-400" />
                ) : (
                  <XCircle size={18} className="text-red-400" />
                )}
                <span className="font-semibold text-white">{d.duvar}</span>
              </div>
              <p className="text-slate-400 text-sm mb-3">{d.aciklama}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{d.kural_sayisi} kural</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  d.aktif ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {d.aktif ? 'Aktif' : 'Devre Dışı'}
                </span>
              </div>
            </div>
          ))}
        </div>
        {data?.toplam_kural && (
          <p className="text-slate-500 text-sm mt-2">
            Toplam: {data.toplam_kural} güvenlik kuralı aktif
          </p>
        )}
      </div>

      {/* 3 Duvar Test */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Zap size={16} className="text-amber-400" /> 3 Duvar Test
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={testKomut}
            disabled={testYukleniyor}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {testYukleniyor ? 'Test ediliyor...' : 'Test Komutu Gönder'}
          </button>
          {testSonuc && (
            <span className={`text-sm ${
              testSonuc.startsWith('Kontrol geçti') ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {testSonuc}
            </span>
          )}
        </div>
        <p className="text-slate-500 text-xs mt-2">
          &quot;sporcu listesi göster&quot; komutunu 3 duvar sisteminden geçirir.
        </p>
      </div>

      {/* İstatistikler */}
      {ist && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={18} /> Alarm İstatistikleri
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{ist.toplam}</p>
              <p className="text-slate-400 text-sm">Toplam Olay</p>
            </div>
            <div className="bg-slate-800/60 border border-emerald-500/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{ist.izin_verilen}</p>
              <p className="text-slate-400 text-sm">İzin Verilen</p>
            </div>
            <div className="bg-slate-800/60 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{ist.engellenen}</p>
              <p className="text-slate-400 text-sm">Engellenen</p>
            </div>
            <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {ist.seviye_dagilimi.kirmizi + ist.seviye_dagilimi.acil}
              </p>
              <p className="text-slate-400 text-sm">Kritik Alarm</p>
            </div>
          </div>

          {/* Seviye dağılımı */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {([
              { label: 'Sarı', sayi: ist.seviye_dagilimi.sari, renk: 'text-yellow-400 bg-yellow-500/10' },
              { label: 'Turuncu', sayi: ist.seviye_dagilimi.turuncu, renk: 'text-orange-400 bg-orange-500/10' },
              { label: 'Kırmızı', sayi: ist.seviye_dagilimi.kirmizi, renk: 'text-red-400 bg-red-500/10' },
              { label: 'Acil', sayi: ist.seviye_dagilimi.acil, renk: 'text-red-300 bg-red-600/10' },
            ]).map((s) => (
              <div key={s.label} className={`rounded-lg p-3 text-center ${s.renk}`}>
                <p className="text-lg font-bold">{s.sayi}</p>
                <p className="text-xs opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Olay Türleri */}
      {ist && ist.olay_turleri.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Olay Türleri</h2>
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3 text-slate-400 font-medium">Tür</th>
                  <th className="text-right p-3 text-slate-400 font-medium">Sayı</th>
                </tr>
              </thead>
              <tbody>
                {ist.olay_turleri.slice(0, 10).map((o) => (
                  <tr key={o.tur} className="border-b border-slate-800">
                    <td className="p-3 text-slate-300 font-mono text-xs">{o.tur}</td>
                    <td className="p-3 text-right text-white font-medium">{o.sayi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Güvenlik Logları */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldAlert size={18} /> Son Güvenlik Logları
        </h2>
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm">Henüz güvenlik logu yok.</p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 50).map((log) => (
              <div
                key={log.id}
                className={`bg-slate-800/50 border rounded-xl p-4 ${
                  log.blocked ? 'border-red-500/30' : 'border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {log.blocked ? (
                    <XCircle size={14} className="text-red-400" />
                  ) : (
                    <CheckCircle size={14} className="text-emerald-400" />
                  )}
                  <span className="text-slate-300 font-mono text-xs">{log.event_type}</span>
                  <SeverityBadge severity={log.severity} />
                  <span className="text-slate-500 text-xs ml-auto">
                    {new Date(log.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>
                {log.description && (
                  <p className="text-slate-400 text-sm ml-6">{log.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
