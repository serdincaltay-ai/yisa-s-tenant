import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantIdWithFallback } from '@/lib/franchise-tenant'
import { canonicalizeRole } from '@/lib/auth/role-canonical'

export const dynamic = 'force-dynamic'

type TrialStatus = 'pending' | 'approved' | 'rejected' | 'converted'

const VALID_STATUSES: TrialStatus[] = ['pending', 'approved', 'rejected', 'converted']

function mapDbStatusToApi(status: string | null | undefined): TrialStatus {
  switch (status) {
    case 'onaylandi':
      return 'approved'
    case 'iptal':
      return 'rejected'
    case 'tamamlandi':
      return 'converted'
    case 'bekliyor':
    default:
      return 'pending'
  }
}

function mapApiStatusToDb(status: string | null | undefined): string {
  switch (status) {
    case 'approved':
      return 'onaylandi'
    case 'rejected':
      return 'iptal'
    case 'converted':
      return 'tamamlandi'
    case 'pending':
    default:
      return 'bekliyor'
  }
}

async function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

async function getActor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 }) }

  const service = await getServiceClient()
  if (!service) return { error: NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 }) }

  const tenantId = await getTenantIdWithFallback(user.id, null)
  if (!tenantId) return { error: NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 403 }) }

  const { data: roleRow } = await service
    .from('user_tenants')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  const canonical = canonicalizeRole(roleRow?.role ?? '')
  const allowed = ['platform_owner', 'tenant_owner', 'branch_manager', 'registration_staff', 'cashier']
  if (!canonical || !allowed.includes(canonical)) {
    return { error: NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 }) }
  }

  return { user, tenantId, service, canonical }
}

export async function GET() {
  try {
    const actor = await getActor()
    if ('error' in actor) return actor.error

    const { data, error } = await actor.service
      .from('trial_requests')
      .select('id, tenant_id, lead_id, cocuk_adi, cocuk_yasi, veli_adi, veli_telefon, brans, tercih_gun, tercih_saat, durum, notlar, created_at, updated_at')
      .eq('tenant_id', actor.tenantId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: 'Deneme talepleri getirilemedi: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: (data ?? []).map((x) => ({
        ...x,
        status: mapDbStatusToApi(x.durum as string | null | undefined),
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await getActor()
    if ('error' in actor) return actor.error

    const body = await req.json()
    const cocuk_adi = typeof body.cocuk_adi === 'string' ? body.cocuk_adi.trim() : ''
    const veli_adi = typeof body.veli_adi === 'string' ? body.veli_adi.trim() : ''
    const veli_telefon = typeof body.veli_telefon === 'string' ? body.veli_telefon.trim() : ''
    const status = typeof body.status === 'string' ? body.status : 'pending'
    const dbStatus = mapApiStatusToDb(status)

    if (!cocuk_adi || !veli_adi || !veli_telefon) {
      return NextResponse.json({ error: 'çocuk adı, veli adı ve veli telefonu zorunludur' }, { status: 400 })
    }

    const insertPayload = {
      tenant_id: actor.tenantId,
      lead_id: body.lead_id ?? null,
      cocuk_adi,
      cocuk_yasi: typeof body.cocuk_yasi === 'number' ? body.cocuk_yasi : null,
      veli_adi,
      veli_telefon,
      brans: typeof body.brans === 'string' ? body.brans.trim() : null,
      tercih_gun: typeof body.tercih_gun === 'string' ? body.tercih_gun.trim() : null,
      tercih_saat: typeof body.tercih_saat === 'string' ? body.tercih_saat.trim() : null,
      durum: dbStatus,
      notlar: typeof body.notlar === 'string' ? body.notlar : null,
    }

    const { data, error } = await actor.service
      .from('trial_requests')
      .insert(insertPayload)
      .select('id, tenant_id, lead_id, cocuk_adi, veli_adi, veli_telefon, brans, durum, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Deneme talebi oluşturulamadı: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      item: {
        ...data,
        status: mapDbStatusToApi(data.durum as string | null | undefined),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await getActor()
    if ('error' in actor) return actor.error

    const body = await req.json()
    const id = typeof body.id === 'string' ? body.id : ''
    const status = typeof body.status === 'string' ? body.status : ''
    if (!id || !VALID_STATUSES.includes(status as TrialStatus)) {
      return NextResponse.json({ error: 'id ve geçerli status zorunludur' }, { status: 400 })
    }

    const { data, error } = await actor.service
      .from('trial_requests')
      .update({
        durum: mapApiStatusToDb(status),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', actor.tenantId)
      .select('id, durum, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Durum güncellenemedi: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      item: {
        ...data,
        status: mapDbStatusToApi(data.durum as string | null | undefined),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
