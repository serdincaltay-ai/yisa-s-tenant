'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { YisaLogo } from '@/components/YisaLogo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasRecovery, setHasRecovery] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((_event, session) => {
      setHasRecovery(!!session?.user)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasRecovery(!!session?.user)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şifre güncellenemedi.')
    } finally {
      setLoading(false)
    }
  }

  if (hasRecovery === null) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasRecovery) {
    return (
      <div className="min-h-screen bg-[#0a0e17] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <Link href="/auth/login" className="inline-block mb-8">
            <YisaLogo variant="full" href="/auth/login" showAcronym />
          </Link>
          <div className="bg-card/80 border border-border rounded-2xl p-8">
            <h1 className="text-xl font-bold mb-2">Link Geçersiz</h1>
            <p className="text-muted-foreground mb-6">
              Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen giriş sayfasından tekrar &quot;Şifre sıfırlama e-postası al&quot; butonuna tıklayın.
            </p>
            <Link href="/auth/login">
              <Button className="w-full">Giriş sayfasına dön</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0e17] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card/80 border border-border rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-xl font-bold mb-2">Şifre Güncellendi</h1>
            <p className="text-muted-foreground">Giriş sayfasına yönlendiriliyorsunuz...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link href="/auth/login" className="flex justify-center mb-8">
          <YisaLogo variant="full" href="/auth/login" showAcronym />
        </Link>
        <div className="bg-card/80 border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-2">Yeni Şifre Belirleyin</h1>
          <p className="text-muted-foreground mb-6">Hesabınız için yeni bir şifre girin.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Yeni şifre (en az 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 h-12 rounded-xl"
              required
              minLength={6}
            />
            <Input
              type="password"
              placeholder="Şifreyi tekrar girin"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-white/5 border-white/10 h-12 rounded-xl"
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
