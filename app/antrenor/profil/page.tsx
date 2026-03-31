'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Loader2, Save, User } from 'lucide-react'

type Profile = {
  name: string
  surname: string
  phone: string
  email: string
}

type StaffInfo = {
  branch: string
  employment_type: string
  is_competitive_coach: boolean
  license_type: string
  employment_start_date: string | null
  bio: string
  address: string
  city: string
  district: string
  previous_work: string
  chronic_condition: string
  has_driving_license: boolean
  languages: string
}

export default function AntrenorProfilPage() {
  const [profile, setProfile] = useState<Profile>({ name: '', surname: '', phone: '', email: '' })
  const [staff, setStaff] = useState<StaffInfo>({
    branch: '',
    employment_type: 'full_time',
    is_competitive_coach: false,
    license_type: '',
    employment_start_date: null,
    bio: '',
    address: '',
    city: '',
    district: '',
    previous_work: '',
    chronic_condition: '',
    has_driving_license: false,
    languages: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/antrenor/profil')
      const data = await res.json()
      if (data.profile) {
        setProfile({
          name: data.profile.name ?? '',
          surname: data.profile.surname ?? '',
          phone: data.profile.phone ?? '',
          email: data.profile.email ?? '',
        })
      }
      if (data.staff) {
        setStaff({
          branch: data.staff.branch ?? '',
          employment_type: data.staff.employment_type ?? 'full_time',
          is_competitive_coach: data.staff.is_competitive_coach ?? false,
          license_type: data.staff.license_type ?? '',
          employment_start_date: data.staff.employment_start_date ?? null,
          bio: data.staff.bio ?? '',
          address: data.staff.address ?? '',
          city: data.staff.city ?? '',
          district: data.staff.district ?? '',
          previous_work: data.staff.previous_work ?? '',
          chronic_condition: data.staff.chronic_condition ?? '',
          has_driving_license: data.staff.has_driving_license ?? false,
          languages: data.staff.languages ?? '',
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
      const res = await fetch('/api/antrenor/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          surname: profile.surname,
          phone: profile.phone,
          employment_type: staff.employment_type,
          is_competitive_coach: staff.is_competitive_coach,
          license_type: staff.license_type,
          employment_start_date: staff.employment_start_date,
          bio: staff.bio,
          address: staff.address,
          city: staff.city,
          district: staff.district,
          previous_work: staff.previous_work,
          chronic_condition: staff.chronic_condition,
          has_driving_license: staff.has_driving_license,
          languages: staff.languages,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!profile?.email) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-400">
        Profil yüklenemedi.
      </div>
    )
  }

  return (
    <main className="p-4 space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-white flex items-center gap-2">
        <User className="h-5 w-5 text-cyan-400" />
        Profilim
      </h1>

      {/* Kişisel Bilgiler */}
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

      {/* Çalışma Bilgileri */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Çalışma Bilgileri</h2>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Çalışma Türü</label>
          <select
            value={staff.employment_type}
            onChange={(e) => setStaff((s) => ({ ...s, employment_type: e.target.value }))}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
          >
            <option value="full_time">Tam Zamanlı</option>
            <option value="part_time">Yarı Zamanlı</option>
            <option value="intern">Stajyer</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Federasyon Belgesi Türü</label>
          <input
            type="text"
            value={staff.license_type}
            onChange={(e) => setStaff((s) => ({ ...s, license_type: e.target.value }))}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="Ör: 1. Kademe Antrenör Belgesi"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">İşe Başlama Tarihi</label>
          <input
            type="date"
            value={staff.employment_start_date ?? ''}
            onChange={(e) => setStaff((s) => ({ ...s, employment_start_date: e.target.value || null }))}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">Yarışmacı Antrenör</p>
            <p className="text-xs text-zinc-500">Yarışmacı sporcu deneyiminiz var mı?</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={staff.is_competitive_coach}
            onClick={() => setStaff((s) => ({ ...s, is_competitive_coach: !s.is_competitive_coach }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              staff.is_competitive_coach ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                staff.is_competitive_coach ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Kişisel Detaylar */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Kişisel Detaylar</h2>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Adres</label>
          <input
            type="text"
            value={staff.address}
            onChange={(e) => setStaff((s) => ({ ...s, address: e.target.value }))}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="Oturduğunuz adres"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">İl</label>
            <input
              type="text"
              value={staff.city}
              onChange={(e) => setStaff((s) => ({ ...s, city: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              placeholder="İstanbul"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">İlçe</label>
            <input
              type="text"
              value={staff.district}
              onChange={(e) => setStaff((s) => ({ ...s, district: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              placeholder="Tuzla"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Önceki İş Deneyimi</label>
          <input
            type="text"
            value={staff.previous_work}
            onChange={(e) => setStaff((s) => ({ ...s, previous_work: e.target.value }))}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="Daha önce çalıştığınız yer"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Sürekli Rahatsızlık</label>
          <input
            type="text"
            value={staff.chronic_condition}
            onChange={(e) => setStaff((s) => ({ ...s, chronic_condition: e.target.value }))}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="Varsa belirtiniz"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Dil Bilgileri</label>
          <input
            type="text"
            value={staff.languages}
            onChange={(e) => setStaff((s) => ({ ...s, languages: e.target.value }))}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="Türkçe, İngilizce"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">Ehliyet</p>
            <p className="text-xs text-zinc-500">Araba kullanabiliyor musunuz?</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={staff.has_driving_license}
            onClick={() => setStaff((s) => ({ ...s, has_driving_license: !s.has_driving_license }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              staff.has_driving_license ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                staff.has_driving_license ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Özgeçmiş */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Özgeçmiş</h2>
        <textarea
          value={staff.bio}
          onChange={(e) => setStaff((s) => ({ ...s, bio: e.target.value }))}
          className="w-full min-h-[100px] rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors resize-y"
          placeholder="Kısa özgeçmişinizi yazın..."
          maxLength={500}
        />
        <p className="text-xs text-zinc-600">{staff.bio.length}/500 karakter</p>
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
  )
}
