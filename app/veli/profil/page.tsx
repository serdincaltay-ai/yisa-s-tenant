'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { PanelHeader } from '@/components/PanelHeader'
import { VeliBottomNav } from '@/components/PanelBottomNav'
import { Loader2, Save, User, Bell } from 'lucide-react'

type Profile = {
  name: string
  surname: string
  phone: string
  email: string
}

type Preferences = {
  yoklama_notify: boolean
  odeme_notify: boolean
  duyuru_notify: boolean
}

export default function VeliProfilPage() {
  const [profile, setProfile] = useState<Profile>({ name: '', surname: '', phone: '', email: '' })
  const [prefs, setPrefs] = useState<Preferences>({ yoklama_notify: true, odeme_notify: true, duyuru_notify: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/veli/profil')
      const data = await res.json()
      if (data.profile) {
        setProfile({
          name: data.profile.name ?? '',
          surname: data.profile.surname ?? '',
          phone: data.profile.phone ?? '',
          email: data.profile.email ?? '',
        })
      }
      if (data.preferences) {
        setPrefs({
          yoklama_notify: data.preferences.yoklama_notify ?? true,
          odeme_notify: data.preferences.odeme_notify ?? true,
          duyuru_notify: data.preferences.duyuru_notify ?? true,
        })
      }
    } catch {
      setMessage({ type: 'error', text: 'Profil yüklenemedi' })
    }
  }, [])

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false))
  }, [fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/veli/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          surname: profile.surname,
          phone: profile.phone,
          ...prefs,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessage({ type: 'success', text: 'Profil kaydedildi' })
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Kayıt başarısız' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Bağlantı hatası' })
    } finally {
      setSaving(false)
    }
  }

  const togglePref = (key: keyof Preferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 pb-20">
        <PanelHeader panelName="VELİ PANELİ" />
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
        <VeliBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <PanelHeader panelName="VELİ PANELİ" />

      <main className="p-4 space-y-6 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-400" />
          Profilim
        </h1>

        {/* Profil Bilgileri */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Kişisel Bilgiler</h2>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Ad</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              placeholder="Adınız"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Soyad</label>
            <input
              type="text"
              value={profile.surname}
              onChange={(e) => setProfile((p) => ({ ...p, surname: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              placeholder="Soyadınız"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Telefon</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              placeholder="05XX XXX XX XX"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">E-posta</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-600 mt-1">E-posta adresi değiştirilemez</p>
          </div>
        </section>

        {/* Bildirim Tercihleri */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Bildirim Tercihleri
          </h2>

          <div className="space-y-3">
            <ToggleRow
              label="Yoklama Bildirimi"
              description="Çocuğunuzun yoklama durumu hakkında bildirim alın"
              checked={prefs.yoklama_notify}
              onChange={() => togglePref('yoklama_notify')}
            />
            <ToggleRow
              label="Ödeme Hatırlatma"
              description="Aidat ve ödeme vadesi yaklaştığında hatırlatma alın"
              checked={prefs.odeme_notify}
              onChange={() => togglePref('odeme_notify')}
            />
            <ToggleRow
              label="Duyuru Bildirimi"
              description="Tesis duyuruları ve etkinlik bilgileri alın"
              checked={prefs.duyuru_notify}
              onChange={() => togglePref('duyuru_notify')}
            />
          </div>
        </section>

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

        {/* Kaydet Butonu */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-black font-semibold py-3 px-4 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </main>

      <VeliBottomNav />
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-cyan-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
