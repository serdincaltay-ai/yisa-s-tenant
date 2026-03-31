'use client'

import { useEffect, useState } from 'react'
import { Store, Users, Activity, ExternalLink, RefreshCw, User, Mail, ShoppingCart } from 'lucide-react'

type FranchiseItem = {
  id: string
  name: string
  slug?: string
  region?: string
  package?: string
  members_count?: number
  athletes_count?: number
  status: string
  created_at: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}

export default function FranchisesPage() {
  const [items, setItems] = useState<FranchiseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/franchises')
      const data = await res.json()
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setError('Veri yüklenemedi.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Franchise&apos;lar</h1>
          <p className="text-slate-400">Aktif franchise ve satış yapılacak firmalar — yetkili bilgisi, panele git, satış yap.</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors disabled:opacity-50"
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

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          Yükleniyor…
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
          <Store className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-slate-400 mb-2">Henüz franchise kaydı yok.</p>
          <p className="text-slate-500 text-sm">
            <code>franchises</code>, <code>organizations</code> veya <code>tenants</code> tablosu Supabase&apos;de oluşturulduğunda burada listelenecek.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-800/50 border rounded-2xl p-6 hover:border-amber-500/30 transition-colors ${
                item.status === 'lead' ? 'border-amber-500/40' : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Store className="text-amber-400" size={24} />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-lg font-medium ${
                    item.status === 'lead'
                      ? 'bg-amber-500/30 text-amber-400'
                      : item.status === 'demo'
                        ? 'bg-blue-500/20 text-blue-400'
                        : item.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {item.status === 'lead' ? 'Satış yap' : item.status === 'demo' ? 'Demo' : item.status}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">{item.name}</h2>
              {item.slug && <p className="text-slate-500 text-sm mb-2">/{item.slug}</p>}
              {item.contact_name && (
                <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                  <User size={14} className="text-slate-500" />
                  <span><strong>Yetkili:</strong> {item.contact_name}</span>
                </div>
              )}
              {item.contact_email && (
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Mail size={14} className="text-slate-500" />
                  <a href={`mailto:${item.contact_email}`} className="hover:text-amber-400">{item.contact_email}</a>
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-4">
                {item.region != null && <span>{item.region}</span>}
                {item.package != null && (
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-amber-400">{item.package}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-slate-500 text-sm mb-4">
                {item.members_count != null && (
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {item.members_count} üye
                  </span>
                )}
                {item.athletes_count != null && (
                  <span className="flex items-center gap-1">
                    <Activity size={14} /> {item.athletes_count} sporcu
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {item.status === 'lead' && (
                  <a
                    href={`/dashboard/franchises/${item.id}?satis=1`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium"
                  >
                    <ShoppingCart size={14} /> Satış yap
                  </a>
                )}
                <a
                  href={`/dashboard/franchises/${item.id}`}
                  className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium"
                >
                  Detay / Panele git <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
