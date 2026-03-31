// YiSA-S Service Worker v4.0 — Inter font + scroll-snap PWA + panel offline
const CACHE_NAME = 'yisa-s-v6'
const OFFLINE_URL = '/offline.html'

// Önbelleğe alınacak statik dosyalar
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/auth/login',
  '/franchise',
  '/veli',
  '/antrenor',
  '/kayit',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/manifest.json'
]

// Google Fonts (Inter) önbellek adı
const FONT_CACHE_NAME = 'yisa-s-fonts-v1'

// Service Worker kurulumu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Önbellek açıldı')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Bazı dosyalar önbelleğe alınamadı:', err)
      })
    })
  )
  self.skipWaiting()
})

// Service Worker aktivasyonu — eski cache temizligi
self.addEventListener('activate', (event) => {
  const KEEP = [CACHE_NAME, FONT_CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !KEEP.includes(name))
          .map((name) => {
            console.log('[SW] Eski onbellek siliniyor:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch istekleri
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API istekleri için network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Başarılı API yanıtını önbelleğe al (GET istekleri için)
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Offline durumda önbellekten dene
          return caches.match(request)
        })
    )
    return
  }

  // Google Fonts (Inter) için uzun süreli önbellek
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
        })
      })
    )
    return
  }

  // Statik dosyalar için cache-first
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|css|js|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // HTML sayfaları için network-first with fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Başarılı sayfa yanıtını önbelleğe al
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Offline durumda önbellekten dene
          return caches.match(request).then((cached) => {
            if (cached) return cached
            // Önbellekte yoksa offline sayfası göster
            return caches.match(OFFLINE_URL).catch(() => {
              return new Response(
                '<html><body><h1>Çevrimdışı</h1><p>İnternet bağlantınızı kontrol edin.</p></body></html>',
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              )
            })
          })
        })
    )
    return
  }

  // Diğer istekler için network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// Push bildirimleri — bildirim türlerine göre ikon ve renk
const NOTIFICATION_ICONS = {
  yoklama_sonucu: '/icon-192.png',
  odeme_hatirlatma: '/icon-192.png',
  duyuru: '/icon-192.png'
}

const NOTIFICATION_DEFAULTS = {
  yoklama_sonucu: { title: 'Yoklama Sonucu', body: 'Yoklama bilgisi güncellendi.', url: '/veli/dashboard' },
  odeme_hatirlatma: { title: 'Ödeme Hatırlatma', body: 'Ödeme tarihiniz yaklaşıyor.', url: '/veli/odeme' },
  duyuru: { title: 'Yeni Duyuru', body: 'Yeni bir duyuru yayınlandı.', url: '/veli/duyurular' }
}

self.addEventListener('push', (event) => {
  if (event.data) {
    let data
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'YİSA-S', body: event.data.text() }
    }

    const notifType = data.notification_type || 'duyuru'
    const defaults = NOTIFICATION_DEFAULTS[notifType] || NOTIFICATION_DEFAULTS.duyuru

    const options = {
      body: data.body || defaults.body,
      icon: NOTIFICATION_ICONS[notifType] || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      tag: notifType + '-' + Date.now(),
      data: {
        ...data.data,
        url: data.url || defaults.url,
        notification_type: notifType,
      },
      actions: notifType === 'odeme_hatirlatma'
        ? [{ action: 'pay', title: 'Ödemeye Git' }]
        : [{ action: 'open', title: 'Aç' }]
    }
    event.waitUntil(
      self.registration.showNotification(data.title || defaults.title, options)
    )
  }
})

// Bildirime tıklama
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

console.log('[SW] YİSA-S Service Worker yüklendi')
