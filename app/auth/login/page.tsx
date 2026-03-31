'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { YisaLogo } from '@/components/YisaLogo'
import { resolveLoginRole, ROLE_TO_PATH } from '@/lib/auth/resolve-role'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

/** Supabase Auth hatalarını Türkçe mesaja çevir */
function translateAuthError(msg: string): string {
  const m = msg?.toLowerCase() ?? ''
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'E-posta veya şifre hatalı. Lütfen kontrol edin.'
  if (m.includes('email not confirmed')) return 'E-posta adresiniz henüz onaylanmamış. Gelen kutunuzu kontrol edin.'
  if (m.includes('user not found')) return 'Bu e-posta ile kayıtlı hesap bulunamadı.'
  if (m.includes('too many requests')) return 'Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.'
  if (m.includes('44000') || m.includes('invalid configuration')) return 'Veritabanı bağlantı hatası. Lütfen daha sonra tekrar deneyin.'
  return msg || 'Giriş hatası'
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const unauthorized = searchParams.get('unauthorized') === '1'

  const handleResetPassword = async () => {
    if (!email?.trim()) {
      setError('Şifre sıfırlama için önce e-posta adresinizi girin.')
      return
    }
    setResetLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
      })
      if (err) throw err
      setResetSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şifre sıfırlama e-postası gönderilemedi.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      const userId = data.user?.id ?? ''
      const meta = data.user?.user_metadata || {}

      // Rol çözümle: PATRON_EMAIL > kullanicilar > profiles > user_metadata
      // kullanicilar/profiles 44000 veya başka hata verirse yine de devam et
      let kullaniciRolKod: string | null = null
      let profilesRole: string | null = null
      let userTenantsRole: string | null = null
      try {
        const [kullaniciRes, profileRes, userTenantsRes] = await Promise.all([
          supabase.from('kullanicilar').select('rol_id, roller(kod)').eq('auth_id', userId).maybeSingle(),
          supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
          supabase.from('user_tenants').select('role').eq('user_id', userId).limit(1).maybeSingle(),
        ])
        const kullanici = kullaniciRes.data as { roller?: unknown } | null
        const roller = kullanici?.roller
        if (Array.isArray(roller)) {
          kullaniciRolKod = (roller[0] as { kod?: string })?.kod ?? null
        } else if (roller != null && typeof roller === 'object' && 'kod' in roller) {
          kullaniciRolKod = (roller as { kod?: string }).kod ?? null
        }
        profilesRole = (profileRes.data as { role?: string } | null)?.role ?? null
        userTenantsRole = (userTenantsRes.data as { role?: string } | null)?.role ?? null
      } catch {
        // Tablo yok veya 44000 vb. — devam et, PATRON_EMAIL ile rol çözülecek
      }

      const role = resolveLoginRole({
        userId,
        email: data.user?.email ?? undefined,
        userMetadata: meta as Record<string, unknown>,
        profilesRole,
        kullanicilarRolKod: kullaniciRolKod,
        userTenantsRole,
      })

      const path = ROLE_TO_PATH[role] ?? '/veli'
      const panel = meta.panel as string | undefined
      const finalPath = role === 'franchise' && panel === 'tesis' ? '/tesis' : path
      router.push(finalPath.startsWith('/') ? finalPath : '/veli')
    } catch (err: unknown) {
      setError(translateAuthError(err instanceof Error ? err.message : 'Giris hatasi'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingBall size={300} color="emerald" top="20%" left="-5%" delay={0} />
        <FloatingBall size={200} color="cyan" bottom="20%" right="-5%" delay={2} />
      </div>

      <div className="relative z-10 w-full max-w-md p-8">

        <Link href="/" className="flex justify-center mb-10">
          <YisaLogo variant="full" href="/" showAcronym />
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <h1 className="text-2xl font-bold mb-2">Giris Yap</h1>
          <p className="text-white/40 mb-8">Hesabiniza giris yapin</p>

          {unauthorized && (
            <div className="mb-4 p-3 rounded-lg text-sm border border-amber-500/30 bg-amber-500/10 text-amber-400">
              Yetkisiz erişim. Sadece Patron ve yetkili roller Komuta Merkezi&apos;ne girebilir.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Sifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {resetSent && (
              <p className="text-emerald-400 text-sm">
                Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu (ve spam klasörünü) kontrol edin.
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Giris yapiliyor...' : 'Giris Yap'}
            </Button>
          </form>

          <p className="text-center text-white/40 mt-4 text-sm">
            Şifrenizi mi unuttunuz?{' '}
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              {resetLoading ? 'Gönderiliyor...' : 'Şifre sıfırlama e-postası al'}
            </button>
          </p>
          <p className="text-center text-white/40 mt-6">
            Hesabiniz yok mu?{' '}
            <Link href="/uye-ol" className="text-white hover:underline">
              Kayit olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function FloatingBall({
  size,
  color,
  top,
  left,
  right,
  bottom,
  delay
}: {
  size: number
  color: "emerald" | "cyan"
  top?: string
  left?: string
  right?: string
  bottom?: string
  delay: number
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const animate = () => {
      const time = Date.now() / 1000 + delay
      setPosition({
        x: Math.sin(time * 0.5) * 30,
        y: Math.cos(time * 0.3) * 20
      })
    }

    const interval = setInterval(animate, 50)
    return () => clearInterval(interval)
  }, [delay])

  const colorMap = {
    emerald: "from-emerald-500/20 to-emerald-500/5",
    cyan: "from-cyan-500/20 to-cyan-500/5"
  }

  return (
    <div
      className={`absolute rounded-full bg-gradient-to-br ${colorMap[color]} blur-3xl`}
      style={{
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.5s ease-out'
      }}
    />
  )
}
