'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, BellOff, BellRing, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

/* ── Tipler ─────────────────────────────────────────────────── */

interface Preferences {
  yoklama_sonucu: boolean
  odeme_hatirlatma: boolean
  duyuru: boolean
}

type NotifKey = keyof Preferences

const NOTIF_CONFIG: { key: NotifKey; label: string; description: string }[] = [
  {
    key: 'yoklama_sonucu',
    label: 'Yoklama Sonucu',
    description: 'Çocuğunuzun yoklama bilgisi güncellendiğinde bildirim alın.',
  },
  {
    key: 'odeme_hatirlatma',
    label: 'Ödeme Hatırlatma',
    description: 'Ödeme tarihiniz yaklaştığında hatırlatma bildirimi alın.',
  },
  {
    key: 'duyuru',
    label: 'Duyuru',
    description: 'Tesis ve kulüp duyurularını anında alın.',
  },
]

/* ── VAPID key → Uint8Array çevirici ────────────────────────── */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/* ── Ana Bileşen ────────────────────────────────────────────── */

export default function VeliBildirimlerPage() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>({
    yoklama_sonucu: true,
    odeme_hatirlatma: true,
    duyuru: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  /* ── İlk yükleme ──────────────────────────────────────────── */

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }

    // Mevcut subscription kontrolü
    checkSubscription()

    // Tercihleri yükle
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((data: { preferences?: Preferences }) => {
        if (data.preferences) {
          setPreferences(data.preferences)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {
      // Service worker hazır değil
    }
  }

  /* ── Bildirim izni + Subscription ──────────────────────────── */

  const subscribe = useCallback(async () => {
    setMessage(null)
    try {
      // 1. Bildirim izni al
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setMessage({ type: 'error', text: 'Bildirim izni verilmedi. Tarayıcı ayarlarından izin vermeniz gerekiyor.' })
        return
      }

      // 2. VAPID key al
      const vapidRes = await fetch('/api/notifications/vapid-key')
      const vapidData = await vapidRes.json() as { publicKey?: string; error?: string }
      if (!vapidData.publicKey) {
        setMessage({ type: 'error', text: vapidData.error ?? 'VAPID anahtarı alınamadı.' })
        return
      }

      // 3. Service worker'dan subscription oluştur
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey).buffer as ArrayBuffer,
      })

      // 4. Subscription'ı sunucuya kaydet
      const subJson = subscription.toJSON()
      const saveRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
        }),
      })

      const saveData = await saveRes.json() as { ok?: boolean; error?: string }
      if (!saveData.ok) {
        setMessage({ type: 'error', text: saveData.error ?? 'Abonelik kaydedilemedi.' })
        return
      }

      setSubscribed(true)
      setMessage({ type: 'success', text: 'Bildirimler başarıyla etkinleştirildi!' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Bir hata oluştu.' })
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setMessage(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.getSubscription()
      if (subscription) {
        // Sunucudan sil
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        // Tarayıcıdan sil
        await subscription.unsubscribe()
      }
      setSubscribed(false)
      setMessage({ type: 'success', text: 'Bildirimler devre dışı bırakıldı.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Bir hata oluştu.' })
    }
  }, [])

  /* ── Tercih güncelleme ──────────────────────────────────────── */

  const togglePreference = async (key: NotifKey) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] }
    setPreferences(newPrefs)
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!data.ok) {
        // Geri al
        setPreferences(preferences)
        setMessage({ type: 'error', text: data.error ?? 'Tercih güncellenemedi.' })
      }
    } catch {
      setPreferences(preferences)
      setMessage({ type: 'error', text: 'Bağlantı hatası.' })
    } finally {
      setSaving(false)
    }
  }

  /* ── Render ─────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="ml-3 text-gray-500">Yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <Bell className="text-blue-500" size={28} />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bildirim Ayarları</h1>
          <p className="text-sm text-gray-500">
            Push bildirim tercihlerinizi yönetin
          </p>
        </div>
      </div>

      {/* Mesaj */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      {/* Bildirim İzni + Abone Kartı */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {subscribed ? (
              <BellRing className="text-green-500" size={20} />
            ) : (
              <BellOff className="text-gray-400" size={20} />
            )}
            <span className="font-medium text-gray-900">
              Push Bildirimleri
            </span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              subscribed
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {subscribed ? 'Aktif' : 'Kapalı'}
          </span>
        </div>

        <p className="text-sm text-gray-500">
          {permission === 'denied'
            ? 'Bildirim izni engellendi. Tarayıcı ayarlarından izin vermeniz gerekiyor.'
            : subscribed
              ? 'Bildirimler aktif. Aşağıdan hangi bildirimleri almak istediğinizi seçebilirsiniz.'
              : 'Bildirimleri etkinleştirerek önemli gelişmelerden anında haberdar olun.'}
        </p>

        {permission !== 'denied' && (
          <button
            onClick={subscribed ? unsubscribe : subscribe}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              subscribed
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {subscribed ? 'Bildirimleri Kapat' : 'Bildirimleri Etkinleştir'}
          </button>
        )}
      </div>

      {/* Bildirim Türleri */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        <div className="px-4 py-3">
          <h2 className="font-medium text-gray-900">Bildirim Türleri</h2>
          <p className="text-xs text-gray-500">Almak istediğiniz bildirimleri seçin</p>
        </div>

        {NOTIF_CONFIG.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 mr-4">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <button
              onClick={() => togglePreference(key)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                preferences[key] ? 'bg-blue-500' : 'bg-gray-200'
              } ${saving ? 'opacity-50' : ''}`}
              role="switch"
              aria-checked={preferences[key]}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Bilgi Notu */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-700">
          <strong>Not:</strong> Push bildirimleri tarayıcınız üzerinden gönderilir.
          Bildirimleri alabilmek için tarayıcınızın bildirim iznine sahip olması gerekir.
          Bildirimleri istediğiniz zaman bu sayfadan kapatabilirsiniz.
        </p>
      </div>
    </div>
  )
}
