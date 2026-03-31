/**
 * API route'lar için yetkilendirme helper'ları
 * User her zaman sunucuda session'dan alınır; body'den asla kabul edilmez.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPatron, canTriggerFlow, canAccessDashboard } from './roles'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'

export type AuthUser = {
  id: string
  email?: string | null
  user_metadata?: { role?: string }
}

/** Session'dan kullanıcı al (API route'larda kullan) */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user as AuthUser | null
}

/** Giriş zorunlu — 401 döner */
export async function requireAuth(): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })
  }
  return { user }
}

/** Patron veya flow yetkisi — 403 döner */
export async function requirePatronOrFlow(): Promise<{ user: AuthUser } | NextResponse> {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result
  if (!canTriggerFlow(result.user)) {
    return NextResponse.json(
      { error: 'Yetkisiz. Sadece Patron ve yetkili roller bu işlemi yapabilir.' },
      { status: 403 }
    )
  }
  return result
}

/** Sadece Patron — 403 döner */
export async function requirePatron(): Promise<{ user: AuthUser } | NextResponse> {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result
  if (!isPatron(result.user)) {
    return NextResponse.json(
      { error: 'Yetkisiz. Sadece Patron bu işlemi yapabilir.' },
      { status: 403 }
    )
  }
  return result
}

/** Dashboard erişimi (Patron paneli) — 403 döner */
export async function requireDashboard(): Promise<{ user: AuthUser } | NextResponse> {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result
  if (!canAccessDashboard(result.user)) {
    return NextResponse.json(
      { error: 'Yetkisiz. Dashboard erişiminiz yok.' },
      { status: 403 }
    )
  }
  return result
}

/** Auth + Tenant doğrulama — Franchise/Antrenör/Tesis paneli route'ları için */
export async function requireAuthWithTenant(
  req?: NextRequest | null
): Promise<{ user: AuthUser; tenantId: string } | NextResponse> {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result
  const tenantId = await getTenantIdWithFallback(result.user.id, req)
  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant ataması bulunamadı.' },
      { status: 403 }
    )
  }
  return { user: result.user, tenantId }
}

/**
 * CRON veya Patron auth — Vercel Cron job'ları ve Patron için
 * CRON_SECRET header ile veya session-based Patron auth ile geçer.
 */
export async function requireCronOrPatron(
  req: NextRequest
): Promise<{ type: 'cron' } | { type: 'patron'; user: AuthUser } | NextResponse> {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth === `Bearer ${cronSecret}`) {
      return { type: 'cron' }
    }
  }
  const result = await requirePatron()
  if (result instanceof NextResponse) return result
  return { type: 'patron', user: result.user }
}

/**
 * Internal API auth — Robot/CELF/CEO endpoint'leri için
 * CRON_SECRET veya PatronOrFlow auth ile geçer.
 */
export async function requireInternalOrPatron(
  req: NextRequest
): Promise<{ type: 'internal' } | { type: 'patron'; user: AuthUser } | NextResponse> {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth === `Bearer ${cronSecret}`) {
      return { type: 'internal' }
    }
  }
  const result = await requirePatronOrFlow()
  if (result instanceof NextResponse) return result
  return { type: 'patron', user: result.user }
}
