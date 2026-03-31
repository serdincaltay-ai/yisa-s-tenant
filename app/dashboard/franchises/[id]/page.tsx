'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { ArrowLeft, Store, Users, Activity, User, Mail, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

type FranchiseDetail = {
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

function FranchiseDetailContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const satisMode = searchParams?.get('satis') === '1'
  const [item, setItem] = useState<FranchiseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch('/api/franchises')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.items) ? data.items : []
        const found = list.find((f: { id: string }) => String(f.id) === String(id))
        setItem(found ?? null)
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/franchises"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Franchise listesine dön
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          Yükleniyor…
        </div>
      ) : !item ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-2">Franchise bulunamadı.</p>
          <Link href="/dashboard/franchises" className="text-amber-400 hover:text-amber-300 text-sm">
            Listeye dön
          </Link>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {satisMode && item.status === 'lead' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <ShoppingCart size={20} /> Satış yap — {item.name}
              </h2>
              <p className="text-slate-300 text-sm mb-4">
                Yetkili: <strong>{item.contact_name ?? '—'}</strong>
                {item.contact_email && (
                  <> · <a href={`mailto:${item.contact_email}`} className="text-amber-400 hover:underline">{item.contact_email}</a></>
                )}
              </p>
              <ul className="text-slate-400 text-sm space-y-1 mb-4">
                <li>1. Paket seçimi (Temel / Modüller)</li>
                <li>2. Sözleşme ve ödeme</li>
                <li>3. Kurulum ve yetkili hesap açılışı</li>
              </ul>
              <p className="text-slate-500 text-xs">Sözleşme ve ödeme adımları Patron onayı ile tamamlanacak.</p>
            </div>
          )}
          <div className={`bg-slate-800/50 border rounded-2xl p-8 ${item.status === 'lead' ? 'border-amber-500/40' : 'border-slate-700'}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Store className="text-amber-400" size={28} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{item.name}</h1>
                {item.slug && <p className="text-slate-500 text-sm">/{item.slug}</p>}
                <span
                  className={`inline-block mt-2 text-xs px-2 py-1 rounded-lg font-medium ${
                    item.status === 'lead'
                      ? 'bg-amber-500/20 text-amber-400'
                      : item.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {item.status === 'lead' ? 'Satış yap' : item.status}
                </span>
              </div>
            </div>
            {(item.contact_name || item.contact_email) && (
              <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-sm font-medium mb-2">Firma yetkilisi</p>
                <div className="flex items-center gap-2 text-white">
                  <User size={18} className="text-slate-500" />
                  <span>{item.contact_name ?? '—'}</span>
                </div>
                {item.contact_email && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    <Mail size={14} className="text-slate-500" />
                    <a href={`mailto:${item.contact_email}`} className="text-amber-400 hover:underline">{item.contact_email}</a>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {item.region != null && (
                <div>
                  <p className="text-slate-500">Bölge</p>
                  <p className="text-white">{item.region}</p>
                </div>
              )}
              {item.package != null && (
                <div>
                  <p className="text-slate-500">Paket</p>
                  <p className="text-amber-400">{item.package}</p>
                </div>
              )}
              {item.members_count != null && (
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-slate-500" />
                  <div>
                    <p className="text-slate-500">Üye</p>
                    <p className="text-white">{item.members_count}</p>
                  </div>
                </div>
              )}
              {item.athletes_count != null && (
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-slate-500" />
                  <div>
                    <p className="text-slate-500">Sporcu</p>
                    <p className="text-white">{item.athletes_count}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-slate-500">Kayıt tarihi</p>
                <p className="text-slate-400">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : '—'}
                </p>
              </div>
            </div>
            {item.notes && (
              <p className="mt-4 text-slate-500 text-sm">{item.notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FranchiseDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center text-slate-500">Yükleniyor…</div>}>
      <FranchiseDetailContent />
    </Suspense>
  )
}
