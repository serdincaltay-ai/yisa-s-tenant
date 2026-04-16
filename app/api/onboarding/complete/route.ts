/**
 * POST /api/onboarding/complete
 * Onboarding'i tamamlar, tenant olusturur, subdomain atar, sayfa render eder.
 * Body: { session_id }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { subdomainSlug, generateTenantSlug } from '@/lib/utils/slug'
import { addVercelDomain } from '@/lib/vercel'
import { SLOT_DEFINITIONS, TEMPLATE_SLOT_CONFIG, mapSablonToTemplateKey } from '@/lib/templates/slot-definitions'

export const dynamic = 'force-dynamic'

interface OnboardingData {
  tesis_adi?: string
  branslar?: string[]
  logo_url?: string
  logo_style?: string
  renk_paleti?: { primary: string; secondary: string; accent: string; bg: string }
  sablon_tipi?: 'standard' | 'medium' | 'premium'
  telefon?: string
  email?: string
  adres?: string
}

type StepStatus = 'done' | 'already_done' | 'failed'
type StepName = 'tenant' | 'logo' | 'template' | 'personel' | 'sube' | 'yayin'

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i < retries - 1) {
        await sleep(200 * Math.pow(2, i))
      }
    }
  }
  throw lastError
}

async function logStep(
  service: unknown,
  payload: {
    sessionId: string
    tenantId: string
    step: StepName
    status: StepStatus
    detail?: string
  }
) {
  try {
    await (service as {
      from: (table: string) => { insert: (values: Record<string, unknown>) => Promise<unknown> }
    })
      .from('onboarding_steps')
      .insert({
        session_id: payload.sessionId,
        tenant_id: payload.tenantId,
        step_name: payload.step,
        status: payload.status,
        detail: payload.detail ?? null,
      })
  } catch {
    // logging non-fatal
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giris gerekli' }, { status: 401 })
    }

    const body = await req.json()
    const { session_id } = body as { session_id: string }

    if (!session_id) {
      return NextResponse.json({ error: 'session_id gerekli' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Sunucu yapilandirma hatasi' }, { status: 500 })
    }
    const service = createServiceClient(url, key)

    // Session'i getir
    const { data: session, error: fetchErr } = await service
      .from('onboarding_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !session) {
      return NextResponse.json({ error: 'Oturum bulunamadi' }, { status: 404 })
    }

    if (session.status !== 'in_progress') {
      if (session.status === 'completed') {
        return NextResponse.json({
          ok: true,
          tenant_id: session.tenant_id ?? null,
          message: 'Onboarding daha once tamamlanmis (idempotent cevap).',
        })
      }
      return NextResponse.json({ error: 'Oturum zaten tamamlanmis' }, { status: 400 })
    }

    const onbData = session.data as OnboardingData
    const tesisAdi = onbData.tesis_adi?.trim() || 'Yeni Tesis'
    const branslar = onbData.branslar || []
    const logoUrl = onbData.logo_url || null
    const renkPaleti = onbData.renk_paleti || { primary: '#1a1a2e', secondary: '#16213e', accent: '#0f3460', bg: '#0a0a0a' }
    const sablonTipi = onbData.sablon_tipi || 'standard'

    const stepStates: Partial<Record<StepName, StepStatus>> = {}

    // 1. Tenant olustur / mevcut tenant'i idempotent sekilde kullan
    const slug = generateTenantSlug(tesisAdi, session_id.slice(0, 8))
    const subdomain = subdomainSlug(tesisAdi)

    let tenantId: string | null = null

    if (session.tenant_id) {
      tenantId = session.tenant_id as string
    } else {
      const { data: existingTenant } = await service
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .eq('slug', slug)
        .maybeSingle()

      if (existingTenant?.id) {
        tenantId = existingTenant.id
      } else {
        const { data: newTenant, error: tenantErr } = await withRetry(async () =>
          service
            .from('tenants')
            .insert({
              ad: tesisAdi,
              name: tesisAdi,
              slug,
              durum: 'aktif',
              owner_id: user.id,
              package_type: 'starter',
              setup_completed: true,
              logo_url: logoUrl,
              primary_color: renkPaleti.primary,
              phone: onbData.telefon ?? null,
              address: onbData.adres ?? null,
            } as Record<string, unknown>)
            .select('id')
            .single()
        )

        if (tenantErr || !newTenant) {
          console.error('[onboarding/complete] Tenant error:', tenantErr)
          return NextResponse.json({ error: 'Tenant olusturulamadi: ' + (tenantErr?.message ?? '') }, { status: 500 })
        }
        tenantId = newTenant.id as string
      }
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant olusturulamadi' }, { status: 500 })
    }
    stepStates.tenant = 'done'
    await logStep(service, { sessionId: session_id, tenantId, step: 'tenant', status: 'done' })

    // 2. user_tenants iliskisi
    await withRetry(async () => service.from('user_tenants').upsert(
      { user_id: user.id, tenant_id: tenantId, role: 'owner' },
      { onConflict: 'user_id,tenant_id' }
    ))

    // 3. Branslar ekle (idempotent) + personel/sube step log
    for (const brans of branslar) {
      try {
        await withRetry(async () => service.from('tenant_branches').upsert(
          {
            tenant_id: tenantId,
            ad: brans,
          },
          { onConflict: 'tenant_id,ad' }
        ))
      } catch {
        // Branch insert hatasi non-fatal
      }
    }
    stepStates.sube = 'already_done'
    await logStep(service, { sessionId: session_id, tenantId, step: 'sube', status: 'already_done', detail: 'Brans kayitlari upsert ile senkronize edildi.' })
    stepStates.personel = 'already_done'
    await logStep(service, { sessionId: session_id, tenantId, step: 'personel', status: 'already_done', detail: 'Bu endpointte personel adimi veri degisikligi gerektirmedi.' })

    // 4. Tenant ayarlari (renk paleti, sablon tipi + logo) idempotent
    try {
      await withRetry(async () => service.from('tenant_settings').upsert({
        tenant_id: tenantId,
        renk_paleti: renkPaleti,
        sablon_tipi: sablonTipi,
        branslar: branslar,
      }, { onConflict: 'tenant_id' }))
      stepStates.logo = 'already_done'
      await logStep(service, { sessionId: session_id, tenantId, step: 'logo', status: 'already_done', detail: 'Logo/renk paleti tenant ayarlarinda upsert edildi.' })
    } catch {
      // tenant_settings tablosu yoksa tenants'a yaz
      await withRetry(async () => service.from('tenants').update({
        primary_color: renkPaleti.primary,
      } as Record<string, unknown>).eq('id', tenantId))
      stepStates.logo = 'already_done'
      await logStep(service, { sessionId: session_id, tenantId, step: 'logo', status: 'already_done', detail: 'Logo/renk fallback olarak tenants tablosuna yazildi.' })
    }

    // 5. Subdomain olustur
    let subdomainCreated = false
    let finalSubdomain = subdomain
    try {
      const { data: existing } = await service
        .from('franchise_subdomains')
        .select('id, tenant_id')
        .eq('subdomain', subdomain)
        .maybeSingle()

      if (existing) {
        if (!existing.tenant_id) {
          // Subdomain bos, sahiplen
          const { error: updateErr } = await withRetry(async () => service
            .from('franchise_subdomains')
            .update({ tenant_id: tenantId })
            .eq('subdomain', subdomain)
            .is('tenant_id', null)
          )
          if (!updateErr) subdomainCreated = true
        } else if (existing.tenant_id === tenantId) {
          // Aynı tenant için subdomain zaten var
          subdomainCreated = true
        } else {
          // Subdomain baskasina ait, suffix ekleyerek yeni subdomain olustur
          finalSubdomain = `${subdomain}-${session_id.slice(0, 6)}`
          const { error: insertErr } = await withRetry(async () => service.from('franchise_subdomains').insert({
            subdomain: finalSubdomain,
            franchise_name: tesisAdi,
            tenant_id: tenantId,
          }))
          if (!insertErr) subdomainCreated = true
        }
      } else {
        const { error: insertErr } = await withRetry(async () => service.from('franchise_subdomains').insert({
          subdomain: finalSubdomain,
          franchise_name: tesisAdi,
          tenant_id: tenantId,
        }))
        if (!insertErr) subdomainCreated = true
      }

      // Vercel domain ekle (sadece subdomain basarili olustuysa)
      if (subdomainCreated) {
        const fullDomain = `${finalSubdomain}.yisa-s.com`
        await withRetry(async () => addVercelDomain(fullDomain)).catch(() => {
          // Vercel domain ekleme hatasi non-fatal
        })
      }
      stepStates.yayin = subdomainCreated ? 'done' : 'already_done'
      await logStep(service, {
        sessionId: session_id,
        tenantId,
        step: 'yayin',
        status: stepStates.yayin,
        detail: subdomainCreated ? `Subdomain hazir: ${finalSubdomain}` : 'Subdomain adimi daha once tamamlanmis olabilir.',
      })
    } catch (e) {
      console.error('[onboarding/complete] Subdomain error:', e)
      stepStates.yayin = 'failed'
      await logStep(service, { sessionId: session_id, tenantId, step: 'yayin', status: 'failed', detail: e instanceof Error ? e.message : String(e) })
    }

    // 5b. Template slotlarını oluştur (FAZ 8)
    try {
      const templateKey = mapSablonToTemplateKey(sablonTipi)
      const slotConfig = TEMPLATE_SLOT_CONFIG[templateKey] ?? TEMPLATE_SLOT_CONFIG['standart']

      // system_templates'den template_id'yi al
      const { data: sysTemplate } = await withRetry(async () => service
        .from('system_templates')
        .select('id')
        .eq('template_key', templateKey)
        .maybeSingle()
      )

      const templateId = sysTemplate?.id ?? null

      // 10 slot kaydı oluştur
      const slotRows = SLOT_DEFINITIONS.map(slot => ({
        tenant_id: tenantId,
        template_id: templateId,
        slot_key: slot.slot_key,
        slot_title: slot.slot_title,
        icerik: {},
        sira: slot.sira,
        is_active: slotConfig[slot.slot_key] ?? false,
      }))

      for (const row of slotRows) {
        await withRetry(async () => service
          .from('tenant_template_slots')
          .upsert(row, { onConflict: 'tenant_id,slot_key' })
        )
      }
      stepStates.template = 'done'
      await logStep(service, { sessionId: session_id, tenantId, step: 'template', status: 'done' })
    } catch (e) {
      console.error('[onboarding/complete] Slot creation error:', e)
      stepStates.template = 'failed'
      await logStep(service, { sessionId: session_id, tenantId, step: 'template', status: 'failed', detail: e instanceof Error ? e.message : String(e) })
    }

    // 6. Varsayilan calisma saatleri
    try {
      await withRetry(async () => service.from('tenants').update({
        working_hours: {
          Pazartesi: { open: '09:00', close: '21:00' },
          Sali: { open: '09:00', close: '21:00' },
          Carsamba: { open: '09:00', close: '21:00' },
          Persembe: { open: '09:00', close: '21:00' },
          Cuma: { open: '09:00', close: '21:00' },
          Cumartesi: { open: '09:00', close: '18:00' },
          Pazar: { open: null, close: null },
        },
      } as Record<string, unknown>).eq('id', tenantId))
    } catch {
      // non-fatal
    }

    // 7. Session'i tamamla
    await withRetry(async () => service
      .from('onboarding_sessions')
      .update({
        status: 'completed',
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id)
    )

    return NextResponse.json({
      ok: true,
      tenant_id: tenantId,
      slug,
      subdomain: finalSubdomain,
      subdomain_url: subdomainCreated ? `https://${finalSubdomain}.yisa-s.com` : null,
      sablon_tipi: sablonTipi,
      steps: stepStates,
      message: `${tesisAdi} basariyla olusturuldu!`,
    })
  } catch (e) {
    console.error('[onboarding/complete] Error:', e)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
