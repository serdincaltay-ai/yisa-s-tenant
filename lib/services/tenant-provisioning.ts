/**
 * Tenant Provisioning Service
 * Handles the full chain: demo_request approval → tenant creation → user setup → subdomain → initial data
 * Includes compensating transactions for rollback on failure.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { generateTenantSlug, subdomainSlug } from '@/lib/utils/slug'
import { CELF_DIRECTORATE_KEYS } from '@/lib/robots/celf-center'
import { sendEmail } from '@/lib/email/resend'
import { render } from '@react-email/components'
import { Hosgeldiniz } from '@/lib/email/templates/hosgeldiniz'
import { addVercelDomain } from '@/lib/vercel'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DemoRequest {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  facility_type: string | null
  city: string | null
  notes: string | null
  status: string
  source: string | null
  created_at: string
  payment_status: string | null
  payment_amount: number | null
}

export interface ProvisioningResult {
  ok: boolean
  message: string
  tenant_id?: string
  slug?: string
  subdomain?: string
  temp_password?: string
  login_email?: string
  franchise_created?: boolean
  celf_triggered?: boolean
  steps_completed: string[]
  error_step?: string
  error_detail?: string
}

interface ProvisioningContext {
  supabase: SupabaseClient
  demoRequest: DemoRequest
  tenantId?: string
  slug?: string
  subdomain?: string
  userId?: string
  tempPassword?: string
  franchiseCreated: boolean
  celfTriggered: boolean
  stepsCompleted: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ─── Step 1: Create Tenant ──────────────────────────────────────────────────

async function createTenant(ctx: ProvisioningContext): Promise<void> {
  const { supabase, demoRequest } = ctx
  const baseName = demoRequest.name?.trim() || demoRequest.facility_type || 'Yeni Tesis'
  const cityPart = demoRequest.city ? ` ${demoRequest.city}` : ''
  const tenantName = `${baseName}${cityPart}`.trim() || 'Yeni Tesis'

  const slug = generateTenantSlug(tenantName, String(demoRequest.id).slice(0, 8))

  const { data: newTenant, error } = await supabase
    .from('tenants')
    .insert({
      ad: tenantName,
      name: tenantName,
      slug,
      durum: 'aktif',
      owner_id: null,
      package_type: 'starter',
      setup_completed: false,
      phone: demoRequest.phone ?? null,
    } as Record<string, unknown>)
    .select('id')
    .single()

  if (error) {
    throw new Error(`Tenant oluşturulamadı: ${error.message}`)
  }

  ctx.tenantId = newTenant?.id
  ctx.slug = slug
  ctx.stepsCompleted.push('tenant_created')
}

// ─── Step 2: Create or Link User ────────────────────────────────────────────

async function setupUser(ctx: ProvisioningContext): Promise<void> {
  const { supabase, demoRequest, tenantId, slug } = ctx
  const reqEmail = (demoRequest.email ?? '').trim().toLowerCase()
  if (!reqEmail || !tenantId) return

  try {
    // Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const usersList = listData?.users as unknown as Array<{ id: string; email?: string }> | undefined
    const existingUser = usersList?.find(
      (u) => (u.email ?? '').toLowerCase() === reqEmail
    )

    if (existingUser) {
      // Link existing user to tenant
      await supabase.from('tenants').update({ owner_id: existingUser.id }).eq('id', tenantId)
      await supabase.from('user_tenants').upsert(
        { user_id: existingUser.id, tenant_id: tenantId, role: 'tenant_owner' },
        { onConflict: 'user_id,tenant_id' }
      )
      ctx.userId = existingUser.id
    } else {
      // Create new user with temp password
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
      const tempPassword = Array.from(
        { length: 12 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('')

      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: reqEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: 'tenant_owner', tenant_slug: slug },
      })

      if (!createErr && newUser?.user) {
        await supabase.from('tenants').update({ owner_id: newUser.user.id }).eq('id', tenantId)
        await supabase.from('user_tenants').upsert(
          { user_id: newUser.user.id, tenant_id: tenantId, role: 'tenant_owner' },
          { onConflict: 'user_id,tenant_id' }
        )
        ctx.userId = newUser.user.id
        ctx.tempPassword = tempPassword
      }
    }
    ctx.stepsCompleted.push('user_setup')
  } catch (e) {
    // User setup failure is non-fatal — tenant still exists
    console.error('[tenant-provisioning] User setup error:', e)
    ctx.stepsCompleted.push('user_setup_partial')
  }
}

// ─── Step 3: Create Franchise Record (vitrin source) ────────────────────────

async function createFranchiseRecord(ctx: ProvisioningContext): Promise<void> {
  const { supabase, demoRequest, tenantId } = ctx
  const isVitrin = demoRequest.source === 'vitrin'
  if (!isVitrin || !tenantId) return

  const baseName = demoRequest.name?.trim() || demoRequest.facility_type || 'Yeni Tesis'
  const nameParts = baseName.trim().split(/\s+/)
  const yetkiliAd = nameParts[0] || 'Tesis'
  const yetkiliSoyad = nameParts.slice(1).join(' ') || 'Sahibi'

  let notesObj: { sablonId?: string; tesisSablonId?: string; toplamTek?: number; aylik?: number } = {}
  try {
    notesObj = typeof demoRequest.notes === 'string' ? JSON.parse(demoRequest.notes) : {}
  } catch {
    /* notes parse edilemezse bos */
  }

  try {
    await supabase.from('franchises').insert({
      tenant_id: tenantId,
      isletme_adi: baseName,
      yetkili_ad: yetkiliAd,
      yetkili_soyad: yetkiliSoyad,
      durum: 'aktif',
      il: demoRequest.city ?? null,
    } as Record<string, unknown>)
  } catch {
    /* franchises tablosu yoksa devam et */
  }

  try {
    await supabase.from('tenant_purchases').insert({
      tenant_id: tenantId,
      product_key: `vitrin_${notesObj.sablonId ?? 'modern'}_${notesObj.tesisSablonId ?? 'temel'}`,
      product_name: `Vitrin paket: ${notesObj.sablonId ?? 'modern'} + ${notesObj.tesisSablonId ?? 'temel'}`,
      amount: notesObj.toplamTek ?? 0,
      para_birimi: 'TRY',
      odeme_onaylandi: true,
      approved_at: new Date().toISOString(),
    })
  } catch {
    /* tenant_purchases hatasi */
  }

  ctx.franchiseCreated = true
  ctx.stepsCompleted.push('franchise_record')
}

// ─── Step 4: Create Subdomain Entry ────────────────────────────────────────

async function createSubdomain(ctx: ProvisioningContext): Promise<void> {
  const { supabase, demoRequest, tenantId, slug } = ctx
  if (!tenantId || !slug) return

  const baseName = demoRequest.name?.trim() || demoRequest.facility_type || 'Yeni Tesis'
  const subdomain = subdomainSlug(baseName)

  try {
    // Check if subdomain already exists
    const { data: existing } = await supabase
      .from('franchise_subdomains')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle()

    if (existing) {
      // Subdomain exists — update tenant_id if null
      await supabase
        .from('franchise_subdomains')
        .update({ tenant_id: tenantId })
        .eq('subdomain', subdomain)
        .is('tenant_id', null)
    } else {
      // Create new subdomain entry
      await supabase.from('franchise_subdomains').insert({
        subdomain,
        franchise_name: baseName,
        tenant_id: tenantId,
      })
    }

    ctx.subdomain = subdomain
    ctx.stepsCompleted.push('subdomain_created')

    // Vercel projesine domain ekle (wildcard subdomain routing)
    const fullDomain = `${subdomain}.yisa-s.com`
    const vercelResult = await addVercelDomain(fullDomain)
    if (vercelResult.ok) {
      ctx.stepsCompleted.push('vercel_domain_added')
    } else {
      // Vercel domain ekleme hatası non-fatal
      console.error(`[tenant-provisioning] Vercel domain eklenemedi (${fullDomain}):`, 'error' in vercelResult ? vercelResult.error : 'unknown')
      ctx.stepsCompleted.push('vercel_domain_skipped')
    }
  } catch (e) {
    // Subdomain creation failure is non-fatal
    console.error('[tenant-provisioning] Subdomain error:', e)
    ctx.stepsCompleted.push('subdomain_skipped')
  }
}

// ─── Step 4b: Add Vercel domain (non-critical) ──────────────────────────────

async function addVercelDomainStep(ctx: ProvisioningContext): Promise<void> {
  if (!ctx.subdomain) return
  const domain = `${ctx.subdomain}.yisa-s.com`
  try {
    const { addVercelDomain } = await import('@/lib/vercel')
    const result = await addVercelDomain(domain)
    if (result.ok) {
      ctx.stepsCompleted.push('vercel_domain_added')
    } else {
      console.warn('[tenant-provisioning] Vercel domain warning:', 'error' in result ? result.error : 'unknown')
      ctx.stepsCompleted.push('vercel_domain_skipped')
    }
  } catch (e) {
    console.error('[tenant-provisioning] Vercel domain error:', e)
    ctx.stepsCompleted.push('vercel_domain_skipped')
  }
}

// ─── Step 5: Seed Initial Tenant Data ──────────────────────────────────────

async function seedTenantData(ctx: ProvisioningContext): Promise<void> {
  const { supabase, tenantId } = ctx
  if (!tenantId) return

  try {
    // Seed default tenant settings (working hours)
    await supabase
      .from('tenants')
      .update({
        working_hours: {
          Pazartesi: { open: '09:00', close: '21:00' },
          Sali: { open: '09:00', close: '21:00' },
          Carsamba: { open: '09:00', close: '21:00' },
          Persembe: { open: '09:00', close: '21:00' },
          Cuma: { open: '09:00', close: '21:00' },
          Cumartesi: { open: '09:00', close: '18:00' },
          Pazar: { open: null, close: null },
        },
        aidat_tiers: { '25': 500, '45': 700, '60': 900 },
        primary_color: '#1a1a2e',
      } as Record<string, unknown>)
      .eq('id', tenantId)

    // Seed default schedule (sample lessons)
    const defaultSchedule = [
      { gun: 'Pazartesi', saat: '10:00', ders_adi: 'Genel Cimnastik', brans: 'cimnastik' },
      { gun: 'Pazartesi', saat: '14:00', ders_adi: 'Yeni Başlayanlar', brans: 'cimnastik' },
      { gun: 'Carsamba', saat: '10:00', ders_adi: 'Genel Cimnastik', brans: 'cimnastik' },
      { gun: 'Carsamba', saat: '14:00', ders_adi: 'Orta Seviye', brans: 'cimnastik' },
      { gun: 'Cuma', saat: '10:00', ders_adi: 'Genel Cimnastik', brans: 'cimnastik' },
      { gun: 'Cumartesi', saat: '10:00', ders_adi: 'Hafta Sonu Grup', brans: 'cimnastik' },
    ]

    for (const lesson of defaultSchedule) {
      try {
        await supabase.from('tenant_schedule').insert({
          tenant_id: tenantId,
          ...lesson,
        })
      } catch {
        // Duplicate or schema mismatch — skip individual lesson
      }
    }

    ctx.stepsCompleted.push('data_seeded')
  } catch (e) {
    // Seed failure is non-fatal
    console.error('[tenant-provisioning] Seed error:', e)
    ctx.stepsCompleted.push('data_seed_partial')
  }
}

// ─── Step 6: Update Demo Request Status ────────────────────────────────────

async function markDemoRequestConverted(ctx: ProvisioningContext): Promise<void> {
  const { supabase, demoRequest } = ctx
  await supabase
    .from('demo_requests')
    .update({ status: 'converted' })
    .eq('id', demoRequest.id)
  ctx.stepsCompleted.push('status_updated')
}

// ─── Step 7: Trigger CELF Startup Tasks (Faz 2 — Adım 2.2) ─────────────────

/**
 * Tenant oluşturulduktan sonra CELF başlangıç görevlerini tetikler.
 * sim_updates tablosuna INSERT yaparak CELF motorunu haberdar eder.
 * Yol haritası referansı: YISA_S_V0_YOL_HARITASI.md — Faz 2, Adım 2.2
 *
 * sim_updates kuralları:
 *   - status: "beklemede" veya "islendi" (başka değer yok)
 *   - payload kolonu yok — ek bilgi command alanına JSON string olarak yazılır
 *   - Kolon adı: target_directorate (canlı DB şeması ile doğrulandı)
 */
async function triggerCelfStartup(ctx: ProvisioningContext): Promise<void> {
  const { supabase, tenantId, slug, demoRequest } = ctx
  if (!tenantId) return

  // Tüm direktörlük anahtarlarını celf-center.ts'den al (15 direktörlük)
  const celfDirectorlukler = [...CELF_DIRECTORATE_KEYS]

  const commandPayload = JSON.stringify({
    type: 'tenant_baslangic_gorevleri',
    tenant_id: tenantId,
    slug: slug ?? '',
    firma_adi: demoRequest.name ?? '',
    email: demoRequest.email ?? '',
    direktorlukler: celfDirectorlukler,
  })

  try {
    const { error } = await supabase.from('sim_updates').insert({
      target_robot: 'CELF',
      target_directorate: 'genel_mudurluk',
      command: commandPayload,
      status: 'beklemede',
    })

    if (error) {
      console.error('[tenant-provisioning] CELF sim_updates INSERT error:', error.message)
      ctx.stepsCompleted.push('celf_trigger_failed')
      return
    }

    ctx.celfTriggered = true
    ctx.stepsCompleted.push('celf_triggered')
  } catch (e) {
    // CELF trigger failure is non-fatal — tenant still exists and is usable
    console.error('[tenant-provisioning] CELF trigger error:', e)
    ctx.stepsCompleted.push('celf_trigger_error')
  }
}

// ─── Step 8: Send Welcome Email ──────────────────────────────────────────────

/**
 * Yeni tenant oluşturulduktan sonra franchise sahibine hoşgeldiniz emaili gönderir.
 * RESEND_API_KEY tanımlı değilse sessizce atlar (non-fatal).
 */
async function sendWelcomeEmail(ctx: ProvisioningContext): Promise<void> {
  const { demoRequest, subdomain, tempPassword } = ctx
  const email = (demoRequest.email ?? '').trim().toLowerCase()
  if (!email) {
    ctx.stepsCompleted.push('welcome_email_skipped_no_email')
    return
  }

  // RESEND_API_KEY yoksa sessizce atla
  if (!process.env.RESEND_API_KEY) {
    console.warn('[tenant-provisioning] RESEND_API_KEY yok, hoşgeldiniz emaili atlanıyor.')
    ctx.stepsCompleted.push('welcome_email_skipped_no_key')
    return
  }

  const ownerAd = demoRequest.name?.trim() || 'Sayın İşletme Sahibi'
  const baseName = demoRequest.name?.trim() || demoRequest.facility_type || 'Yeni Tesis'
  const cityPart = demoRequest.city ? ` ${demoRequest.city}` : ''
  const tesisAdi = `${baseName}${cityPart}`.trim() || 'Yeni Tesis'

  try {
    const html = await render(
      Hosgeldiniz({
        ownerAd,
        tesisAdi,
        loginEmail: email,
        tempPassword: tempPassword ?? undefined,
        subdomain: subdomain ?? undefined,
      })
    )

    const result = await sendEmail(email, `YiSA-S'e Hoşgeldiniz - ${tesisAdi}`, html)

    if (result.ok) {
      ctx.stepsCompleted.push('welcome_email_sent')
    } else {
      console.error('[tenant-provisioning] Welcome email error:', result.error)
      ctx.stepsCompleted.push('welcome_email_failed')
    }
  } catch (e) {
    // Email gönderimi non-fatal — tenant hala kullanılabilir
    console.error('[tenant-provisioning] Welcome email error:', e)
    ctx.stepsCompleted.push('welcome_email_error')
  }
}

// ─── Compensating Transaction (Rollback) ────────────────────────────────────

async function rollback(ctx: ProvisioningContext, failedStep: string): Promise<void> {
  const { supabase, tenantId, subdomain, userId, demoRequest } = ctx
  console.error(`[tenant-provisioning] Rolling back from step: ${failedStep}`)

  try {
    // Remove subdomain entry
    if (subdomain) {
      await supabase.from('franchise_subdomains').delete().eq('subdomain', subdomain)
    }

    // Remove user_tenants mapping
    if (tenantId && userId) {
      await supabase.from('user_tenants').delete()
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
    }

    // Remove tenant
    if (tenantId) {
      // Cascade will clean up tenant_schedule, tenant_purchases, franchise records
      await supabase.from('tenants').delete().eq('id', tenantId)
    }

    // Reset demo request status back to 'new'
    await supabase.from('demo_requests').update({ status: 'new' }).eq('id', demoRequest.id)
  } catch (e) {
    console.error('[tenant-provisioning] Rollback error:', e)
  }
}

// ─── Main Provisioning Function ────────────────────────────────────────────

export async function provisionTenant(demoRequestId: string): Promise<ProvisioningResult> {
  const supabase = getServiceSupabase()
  if (!supabase) {
    return {
      ok: false,
      message: 'Sunucu yapılandırma hatası.',
      steps_completed: [],
      error_step: 'init',
      error_detail: 'Supabase bağlantısı yok',
    }
  }

  // Fetch demo request
  const { data: row, error: fetchErr } = await supabase
    .from('demo_requests')
    .select('*')
    .eq('id', demoRequestId)
    .single()

  if (fetchErr || !row) {
    return {
      ok: false,
      message: 'Talep bulunamadı.',
      steps_completed: [],
      error_step: 'fetch',
      error_detail: fetchErr?.message ?? 'row is null',
    }
  }

  if (row.status !== 'new') {
    return {
      ok: false,
      message: 'Bu talep zaten işlendi.',
      steps_completed: [],
      error_step: 'validation',
      error_detail: `Mevcut durum: ${row.status}`,
    }
  }

  const ctx: ProvisioningContext = {
    supabase,
    demoRequest: row as DemoRequest,
    franchiseCreated: false,
    celfTriggered: false,
    stepsCompleted: [],
  }

  // Execute provisioning chain
  const steps: { name: string; fn: (ctx: ProvisioningContext) => Promise<void> }[] = [
    { name: 'create_tenant', fn: createTenant },
    { name: 'setup_user', fn: setupUser },
    { name: 'create_franchise', fn: createFranchiseRecord },
    { name: 'create_subdomain', fn: createSubdomain },
    { name: 'vercel_domain', fn: addVercelDomainStep },
    { name: 'seed_data', fn: seedTenantData },
    { name: 'update_status', fn: markDemoRequestConverted },
    { name: 'celf_trigger', fn: triggerCelfStartup },
    { name: 'welcome_email', fn: sendWelcomeEmail },
  ]

  for (const step of steps) {
    try {
      await step.fn(ctx)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      console.error(`[tenant-provisioning] Step "${step.name}" failed:`, errorMsg)

      // Only rollback for critical steps (tenant creation)
      if (step.name === 'create_tenant') {
        return {
          ok: false,
          message: `Tenant oluşturma başarısız: ${errorMsg}`,
          steps_completed: ctx.stepsCompleted,
          error_step: step.name,
          error_detail: errorMsg,
        }
      }

      // For non-critical steps, attempt rollback if tenant was created but chain fails badly
      if (step.name === 'update_status') {
        // Status update failure — try again once
        try {
          await supabase.from('demo_requests').update({ status: 'converted' }).eq('id', demoRequestId)
          ctx.stepsCompleted.push('status_updated_retry')
        } catch {
          await rollback(ctx, step.name)
          return {
            ok: false,
            message: `Zincir tamamlanamadı. Geri alındı. Hata: ${errorMsg}`,
            steps_completed: ctx.stepsCompleted,
            error_step: step.name,
            error_detail: errorMsg,
          }
        }
      }
      // Other non-critical steps just log and continue
    }
  }

  // Build response message
  const reqEmail = (ctx.demoRequest.email ?? '').trim().toLowerCase()
  let message = 'Talep onaylandı, tenant oluşturuldu.'
  if (ctx.tempPassword) {
    message = `Talep onaylandı. Tenant oluşturuldu. Firma sahibi hesabı açıldı. Giriş: ${reqEmail} / Geçici şifre: ${ctx.tempPassword} — İlk girişte değiştirsin.`
  }
  if (ctx.subdomain) {
    message += ` Subdomain: ${ctx.subdomain}.yisa-s.com`
  }
  if (ctx.celfTriggered) {
    message += ' CELF başlangıç görevleri tetiklendi.'
  }

  return {
    ok: true,
    message,
    tenant_id: ctx.tenantId,
    slug: ctx.slug,
    subdomain: ctx.subdomain,
    temp_password: ctx.tempPassword,
    login_email: ctx.tempPassword ? reqEmail : undefined,
    franchise_created: ctx.franchiseCreated,
    celf_triggered: ctx.celfTriggered,
    steps_completed: ctx.stepsCompleted,
  }
}

// ─── Reject Demo Request ───────────────────────────────────────────────────

export async function rejectDemoRequest(
  demoRequestId: string,
  reason?: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = getServiceSupabase()
  if (!supabase) {
    return { ok: false, message: 'Sunucu yapılandırma hatası.' }
  }

  const { data: row } = await supabase
    .from('demo_requests')
    .select('id, status')
    .eq('id', demoRequestId)
    .single()

  if (!row) {
    return { ok: false, message: 'Talep bulunamadı.' }
  }

  if (row.status !== 'new') {
    return { ok: false, message: 'Bu talep zaten işlendi.' }
  }

  const update: Record<string, unknown> = { status: 'rejected' }
  if (reason) {
    update.notes = reason
  }

  const { error } = await supabase
    .from('demo_requests')
    .update(update)
    .eq('id', demoRequestId)

  if (error) {
    return { ok: false, message: `Güncelleme hatası: ${error.message}` }
  }

  return { ok: true, message: 'Talep reddedildi.' }
}
